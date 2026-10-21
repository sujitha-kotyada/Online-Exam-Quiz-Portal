const Question = require('../models/Question');
const Exam = require('../models/Exam');

const getQuestionsByExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (req.user.role === 'teacher') {
      if (exam.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only view questions for your own exams'
        });
      }
      // Teachers see full questions including correct answers
      const questions = await Question.find({ examId }).sort({ order: 1 });
      return res.status(200).json({ success: true, questions });
    }

    // If student: hide correct answers and explanations
    const questions = await Question.find({ examId })
      .select('-correctAnswer -modelAnswer -explanation')
      .sort({ order: 1 });

    res.status(200).json({ success: true, questions });
  } catch (error) {
    next(error);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only add questions to your own exams'
      });
    }

    const count = await Question.countDocuments({ examId });
    const order = req.body.order !== undefined ? req.body.order : count + 1;

    const question = await Question.create({
      ...req.body,
      options: req.body.questionType === 'subjective' ? [] : req.body.options,
      correctAnswer: req.body.questionType === 'subjective' ? undefined : req.body.correctAnswer,
      examId,
      order
    });

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      question
    });
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const { examId, questionId } = req.params;
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only update questions for your own exams'
      });
    }

    const question = await Question.findOne({ _id: questionId, examId });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found for this exam' });
    }

    Object.assign(question, {
      ...req.body,
      options: req.body.questionType === 'subjective' ? [] : req.body.options,
      correctAnswer: req.body.questionType === 'subjective' ? undefined : req.body.correctAnswer
    });
    await question.save();

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const { examId, questionId } = req.params;
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete questions from your own exams'
      });
    }

    const question = await Question.findOneAndDelete({ _id: questionId, examId });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found for this exam' });
    }

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuestionsByExam,
  createQuestion,
  updateQuestion,
  deleteQuestion
};
