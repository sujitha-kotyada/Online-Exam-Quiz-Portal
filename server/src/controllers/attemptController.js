const scoringService = require('../services/scoringService');

const startExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const result = await scoringService.startAttempt(examId, req.user._id);

    res.status(200).json({
      success: true,
      message: result.isResumed ? 'Active exam attempt resumed' : 'Exam started successfully',
      attempt: result.attempt,
      questions: result.questions,
      isResumed: result.isResumed
    });
  } catch (error) {
    next(error);
  }
};

const getAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { attempt, questions } = await scoringService.getAttempt(attemptId, req.user._id);

    res.status(200).json({
      success: true,
      attempt,
      questions
    });
  } catch (error) {
    next(error);
  }
};

const saveAnswers = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const attempt = await scoringService.saveAnswers(attemptId, req.user._id, answers);

    res.status(200).json({
      success: true,
      message: 'Answers saved successfully',
      attempt
    });
  } catch (error) {
    next(error);
  }
};

const submitAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const result = await scoringService.submitAttempt(attemptId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Exam submitted and evaluated successfully',
      result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startExam,
  getAttempt,
  saveAnswers,
  submitAttempt
};
