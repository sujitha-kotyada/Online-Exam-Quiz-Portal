const express = require('express');
const router = express.Router({ mergeParams: true });
const questionController = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { questionValidator } = require('../validators/questionValidators');

router.get('/', protect, questionController.getQuestionsByExam);
router.post('/', protect, authorize('teacher'), questionValidator, validate, questionController.createQuestion);
router.put('/:questionId', protect, authorize('teacher'), questionValidator, validate, questionController.updateQuestion);
router.delete('/:questionId', protect, authorize('teacher'), questionController.deleteQuestion);

module.exports = router;
