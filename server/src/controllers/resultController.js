const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Question = require('../models/Question');

const getMyResults = async (req, res, next) => {
  try {
    const results = await Result.find({ studentId: req.user._id })
      .populate('examId', 'title description durationMinutes allowAnswerReview')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    next(error);
  }
};

const enrichBreakdownWithOptions = async (breakdown) => {
  if (!Array.isArray(breakdown) || breakdown.length === 0) return breakdown;

  const needsEnrichment = breakdown.some(
    (item) => item.questionType === 'mcq' && (!item.selectedOptionText || !item.correctAnswerText || !item.options || item.options.length === 0)
  );

  if (!needsEnrichment) {
    return breakdown;
  }

  const questionIds = breakdown.map((item) => item.questionId).filter(Boolean);
  const questions = await Question.find({ _id: { $in: questionIds } }).select('options correctAnswer');
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  return breakdown.map((item) => {
    const itemObj = item.toObject ? item.toObject() : { ...item };
    const q = questionMap.get(itemObj.questionId?.toString());
    if (q && q.options) {
      if (!itemObj.options || itemObj.options.length === 0) {
        itemObj.options = q.options.map((o) => ({ id: o.id, text: o.text }));
      }
      if (!itemObj.selectedOptionText && itemObj.selectedOption) {
        const found = q.options.find((o) => o.id === itemObj.selectedOption);
        if (found) itemObj.selectedOptionText = found.text;
      }
      if (!itemObj.correctAnswerText && (itemObj.correctAnswer || q.correctAnswer)) {
        const target = itemObj.correctAnswer || q.correctAnswer;
        const found = q.options.find((o) => o.id === target);
        if (found) itemObj.correctAnswerText = found.text;
      }
    }
    return itemObj;
  });
};

const getResultById = async (req, res, next) => {
  try {
    const { resultId } = req.params;
    const result = await Result.findById(resultId)
      .populate('studentId', 'name email')
      .populate('examId', 'title description createdBy allowAnswerReview');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    // Role and ownership check
    if (req.user.role === 'student') {
      if (result.studentId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only view your own exam results'
        });
      }

      const resultObj = result.toObject();
      resultObj.breakdown = await enrichBreakdownWithOptions(resultObj.breakdown);

      // If review is disallowed by teacher, remove correctAnswer and explanation
      if (!result.examId.allowAnswerReview) {
        resultObj.breakdown = resultObj.breakdown.map((item) => ({
          questionId: item.questionId,
          questionText: item.questionText,
          questionType: item.questionType,
          selectedOption: item.selectedOption,
          selectedOptionText: item.selectedOptionText,
          answerText: item.answerText,
          isCorrect: item.isCorrect,
          marksAwarded: item.marksAwarded,
          maxMarks: item.maxMarks
        }));
        return res.status(200).json({ success: true, result: resultObj });
      }

      return res.status(200).json({ success: true, result: resultObj });
    } else if (req.user.role === 'teacher') {
      if (result.examId.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only view results for exams you created'
        });
      }

      const resultObj = result.toObject();
      resultObj.breakdown = await enrichBreakdownWithOptions(resultObj.breakdown);
      return res.status(200).json({ success: true, result: resultObj });
    }

    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    next(error);
  }
};

const getExamResultsAndAnalytics = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only view results for your own exams'
      });
    }

    const results = await Result.find({ examId })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    const totalSubmissions = results.length;
    let averageScore = 0;
    let averagePercentage = 0;
    let highestScore = 0;
    let lowestScore = totalSubmissions > 0 ? results[0].score : 0;
    let passCount = 0;

    if (totalSubmissions > 0) {
      const totalScoreSum = results.reduce((sum, r) => sum + r.score, 0);
      const totalPercentSum = results.reduce((sum, r) => sum + r.percentage, 0);
      averageScore = Math.round((totalScoreSum / totalSubmissions) * 100) / 100;
      averagePercentage = Math.round((totalPercentSum / totalSubmissions) * 100) / 100;

      for (const r of results) {
        if (r.score > highestScore) highestScore = r.score;
        if (r.score < lowestScore) lowestScore = r.score;
        if (r.percentage >= 50) passCount++;
      }
    }

    const passRate = totalSubmissions > 0 ? Math.round((passCount / totalSubmissions) * 10000) / 100 : 0;

    // Question-level accuracy breakdown
    const questions = await Question.find({ examId }).sort({ order: 1 });
    const questionAccuracy = questions.map((q) => {
      let qTotalAnswers = 0;
      let qCorrectAnswers = 0;

      results.forEach((r) => {
        const item = r.breakdown.find((b) => b.questionId.toString() === q._id.toString());
        if (item) {
          if (item.selectedOption) qTotalAnswers++;
          if (item.isCorrect) qCorrectAnswers++;
        }
      });

      const accuracy = totalSubmissions > 0 ? Math.round((qCorrectAnswers / totalSubmissions) * 10000) / 100 : 0;

      return {
        questionId: q._id,
        questionText: q.questionText,
        marks: q.marks,
        totalAnswers: qTotalAnswers,
        correctAnswers: qCorrectAnswers,
        accuracyPercentage: accuracy
      };
    });

    const enrichedResults = await Promise.all(
      results.map(async (r) => {
        const rObj = r.toObject();
        rObj.breakdown = await enrichBreakdownWithOptions(rObj.breakdown);
        return rObj;
      })
    );

    res.status(200).json({
      success: true,
      exam,
      analytics: {
        totalSubmissions,
        averageScore,
        averagePercentage,
        highestScore,
        lowestScore,
        passCount,
        passRate,
        questionAccuracy
      },
      results: enrichedResults
    });
  } catch (error) {
    next(error);
  }
};

const gradeSubjectiveAnswer = async (req, res, next) => {
  try {
    const { resultId, questionId } = req.params;
    const marksAwarded = Number(req.body.marksAwarded);
    const feedback = typeof req.body.feedback === 'string' ? req.body.feedback.trim() : '';
    const result = await Result.findById(resultId).populate('examId', 'createdBy allowAnswerReview');

    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    if (result.examId.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only grade your own exam results' });
    }

    const item = result.breakdown.find((entry) => entry.questionId.toString() === questionId);
    if (!item || item.questionType !== 'subjective') {
      return res.status(404).json({ success: false, message: 'Subjective question result not found' });
    }
    if (!Number.isFinite(marksAwarded) || marksAwarded < 0 || marksAwarded > item.maxMarks) {
      return res.status(400).json({ success: false, message: `Marks must be between 0 and ${item.maxMarks}` });
    }

    item.marksAwarded = marksAwarded;
    item.gradingStatus = 'manually-graded';
    item.isCorrect = marksAwarded === item.maxMarks;
    item.graderFeedback = feedback;

    result.score = result.breakdown.reduce((sum, entry) => sum + (entry.marksAwarded || 0), 0);
    result.correctCount = result.breakdown.filter((entry) => entry.isCorrect === true).length;
    result.incorrectCount = result.breakdown.filter((entry) => entry.isCorrect === false && entry.gradingStatus !== 'pending').length;
    result.unansweredCount = result.breakdown.filter((entry) => !entry.answerText?.trim() && !entry.selectedOption).length;
    result.gradingStatus = result.breakdown.some((entry) => entry.gradingStatus === 'pending') ? 'provisional' : 'final';
    result.percentage = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 10000) / 100 : 0;
    await result.save();

    res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyResults,
  getResultById,
  getExamResultsAndAnalytics,
  gradeSubjectiveAnswer
};
