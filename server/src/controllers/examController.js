const examService = require('../services/examService');

const getExams = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'teacher') {
      const exams = await examService.getTeacherExams(req.user._id);
      return res.status(200).json({ success: true, exams });
    }

    const exams = await examService.getPublishedExams();
    res.status(200).json({ success: true, exams });
  } catch (error) {
    next(error);
  }
};

const getExamById = async (req, res, next) => {
  try {
    const exam = await examService.getExamById(req.params.examId, req.user);
    res.status(200).json({ success: true, exam });
  } catch (error) {
    next(error);
  }
};

const createExam = async (req, res, next) => {
  try {
    const exam = await examService.createExam(req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Exam created successfully in draft mode',
      exam
    });
  } catch (error) {
    next(error);
  }
};

const updateExam = async (req, res, next) => {
  try {
    const exam = await examService.updateExam(req.params.examId, req.body, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      exam
    });
  } catch (error) {
    next(error);
  }
};

const deleteExam = async (req, res, next) => {
  try {
    const result = await examService.deleteExam(req.params.examId, req.user._id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

const togglePublish = async (req, res, next) => {
  try {
    const exam = await examService.togglePublish(req.params.examId, req.user._id);
    res.status(200).json({
      success: true,
      message: `Exam status successfully updated to ${exam.status}`,
      exam
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  togglePublish
};
