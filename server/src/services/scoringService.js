const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const Result = require('../models/Result');

class ScoringService {
  async startAttempt(examId, studentId) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const err = new Error('Exam not found');
      err.statusCode = 404;
      throw err;
    }

    if (exam.status !== 'published') {
      const err = new Error('This exam is not available for taking');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    if (exam.startTime && now < new Date(exam.startTime)) {
      const err = new Error(`This exam has not started yet. Starts at ${new Date(exam.startTime).toLocaleString()}`);
      err.statusCode = 400;
      throw err;
    }

    if (exam.endTime && now > new Date(exam.endTime)) {
      const err = new Error(`This exam has expired. Ended at ${new Date(exam.endTime).toLocaleString()}`);
      err.statusCode = 400;
      throw err;
    }

    // Check for an ongoing active attempt (refresh recovery)
    const activeAttempt = await Attempt.findOne({
      examId,
      studentId,
      status: 'in-progress',
      deadline: { $gt: now }
    });

    if (activeAttempt) {
      // Return the ongoing attempt
      const questions = await Question.find({ examId })
        .select('-correctAnswer -modelAnswer -explanation')
        .sort({ order: 1 });

      return {
        attempt: activeAttempt,
        questions,
        isResumed: true
      };
    }

    // Check attempt limits
    const pastAttemptsCount = await Attempt.countDocuments({
      examId,
      studentId,
      status: { $in: ['submitted', 'expired'] }
    });

    if (pastAttemptsCount >= exam.maxAttempts) {
      const err = new Error(`You have reached the maximum allowed attempts (${exam.maxAttempts}) for this exam.`);
      err.statusCode = 403;
      throw err;
    }

    // Calculate authoritative deadline
    const startedAt = new Date();
    let calculatedDeadline = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000);

    // If exam has a hard endTime earlier than duration end, cap deadline
    if (exam.endTime && new Date(exam.endTime) < calculatedDeadline) {
      calculatedDeadline = new Date(exam.endTime);
    }

    const attemptNumber = pastAttemptsCount + 1;

    const attempt = await Attempt.create({
      studentId,
      examId,
      attemptNumber,
      startedAt,
      deadline: calculatedDeadline,
      status: 'in-progress',
      answers: []
    });

    // Sanitized questions (WITHOUT correct answers or explanations)
    const questions = await Question.find({ examId })
      .select('-correctAnswer -modelAnswer -explanation')
      .sort({ order: 1 });

    return {
      attempt,
      questions,
      isResumed: false
    };
  }

  async getAttempt(attemptId, studentId) {
    const attempt = await Attempt.findById(attemptId).populate('examId');
    if (!attempt) {
      const err = new Error('Attempt not found');
      err.statusCode = 404;
      throw err;
    }

    if (attempt.studentId.toString() !== studentId.toString()) {
      const err = new Error('Forbidden: You can only access your own exam attempt');
      err.statusCode = 403;
      throw err;
    }

    // Questions without correct answers
    const questions = await Question.find({ examId: attempt.examId._id })
      .select('-correctAnswer -modelAnswer -explanation')
      .sort({ order: 1 });

    return { attempt, questions };
  }

  async saveAnswers(attemptId, studentId, incomingAnswers) {
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      const err = new Error('Attempt not found');
      err.statusCode = 404;
      throw err;
    }

    if (attempt.studentId.toString() !== studentId.toString()) {
      const err = new Error('Forbidden: You can only update your own attempt');
      err.statusCode = 403;
      throw err;
    }

    if (attempt.status !== 'in-progress') {
      const err = new Error(`Cannot update answers for an attempt with status '${attempt.status}'`);
      err.statusCode = 400;
      throw err;
    }

    // Grace period for network latency (30 seconds)
    const gracePeriodMs = 30 * 1000;
    if (Date.now() > new Date(attempt.deadline).getTime() + gracePeriodMs) {
      attempt.status = 'expired';
      await attempt.save();
      const err = new Error('Exam deadline has passed. Answers can no longer be saved.');
      err.statusCode = 400;
      throw err;
    }

    // Merge or set answers
    const answerMap = new Map();
    // Existing answers
    for (const ans of attempt.answers) {
      if (ans.questionId) {
        answerMap.set(ans.questionId.toString(), {
          selectedOption: ans.selectedOption,
          answerText: ans.answerText || ''
        });
      }
    }
    // Update incoming answers
    for (const ans of incomingAnswers) {
      if (ans.questionId) {
        answerMap.set(ans.questionId.toString(), {
          selectedOption: ans.selectedOption || null,
          answerText: ans.answerText || ''
        });
      }
    }

    attempt.answers = Array.from(answerMap.entries()).map(([qId, answer]) => ({
      questionId: qId,
      selectedOption: answer.selectedOption,
      answerText: answer.answerText,
      savedAt: new Date()
    }));

    await attempt.save();
    return attempt;
  }

  async submitAttempt(attemptId, studentId) {
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      const err = new Error('Attempt not found');
      err.statusCode = 404;
      throw err;
    }

    if (attempt.studentId.toString() !== studentId.toString()) {
      const err = new Error('Forbidden: You can only submit your own attempt');
      err.statusCode = 403;
      throw err;
    }

    // Idempotent: If already submitted, return the existing result directly
    if (attempt.status === 'submitted') {
      const existingResult = await Result.findOne({ attemptId: attempt._id })
        .populate('examId', 'title description allowAnswerReview');
      if (existingResult) {
        return existingResult;
      }
    }

    const exam = await Exam.findById(attempt.examId);
    if (!exam) {
      const err = new Error('Exam not found');
      err.statusCode = 404;
      throw err;
    }

    // Mark attempt as submitted
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    await attempt.save();

    // Authoritative Server-Side Scoring
    const questions = await Question.find({ examId: attempt.examId }).sort({ order: 1 });

    let score = 0;
    let totalMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let hasPendingSubjective = false;
    const breakdown = [];

    // Map student submitted answers
    const studentAnswerMap = new Map();
    for (const ans of attempt.answers) {
      if (ans.questionId) {
        studentAnswerMap.set(ans.questionId.toString(), {
          selectedOption: ans.selectedOption,
          answerText: ans.answerText || ''
        });
      }
    }

    for (const question of questions) {
      const qMarks = question.marks || 1;
      totalMarks += qMarks;

      const studentAnswer = studentAnswerMap.get(question._id.toString()) || {};
      const selectedOption = studentAnswer.selectedOption || null;
      const answerText = studentAnswer.answerText || '';

      if (question.questionType === 'subjective') {
        if (!answerText.trim()) {
          unansweredCount++;
        } else {
          hasPendingSubjective = true;
        }
        breakdown.push({
          questionId: question._id,
          questionText: question.questionText,
          questionType: 'subjective',
          answerText,
          correctAnswer: '',
          isCorrect: null,
          gradingStatus: 'pending',
          marksAwarded: 0,
          maxMarks: qMarks,
          explanation: question.explanation || ''
        });
        continue;
      }

      if (!selectedOption) {
        unansweredCount++;
        breakdown.push({
          questionId: question._id,
          questionText: question.questionText,
          questionType: 'mcq',
          selectedOption: null,
          correctAnswer: question.correctAnswer,
          isCorrect: false,
          marksAwarded: 0,
          maxMarks: qMarks,
          explanation: question.explanation || ''
        });
      } else if (selectedOption === question.correctAnswer) {
        correctCount++;
        score += qMarks;
        breakdown.push({
          questionId: question._id,
          questionText: question.questionText,
          questionType: 'mcq',
          selectedOption,
          correctAnswer: question.correctAnswer,
          isCorrect: true,
          marksAwarded: qMarks,
          maxMarks: qMarks,
          explanation: question.explanation || ''
        });
      } else {
        incorrectCount++;
        breakdown.push({
          questionId: question._id,
          questionText: question.questionText,
          questionType: 'mcq',
          selectedOption,
          correctAnswer: question.correctAnswer,
          isCorrect: false,
          marksAwarded: 0,
          maxMarks: qMarks,
          explanation: question.explanation || ''
        });
      }
    }

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;

    // Save or update result (unique on attemptId)
    const result = await Result.findOneAndUpdate(
      { attemptId: attempt._id },
      {
        attemptId: attempt._id,
        studentId: attempt.studentId,
        examId: attempt.examId,
        score,
        totalMarks,
        percentage,
        correctCount,
        incorrectCount,
        unansweredCount,
        breakdown,
        gradingStatus: hasPendingSubjective ? 'provisional' : 'final'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('examId', 'title description allowAnswerReview');

    return result;
  }
}

module.exports = new ScoringService();
