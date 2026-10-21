const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createExamValidator, updateExamValidator } = require('../validators/examValidators');

// Public or Student/Teacher list
router.get('/', protect, examController.getExams);
router.get('/:examId', protect, examController.getExamById);

// Teacher-only operations
router.post('/', protect, authorize('teacher'), createExamValidator, validate, examController.createExam);
router.put('/:examId', protect, authorize('teacher'), updateExamValidator, validate, examController.updateExam);
router.delete('/:examId', protect, authorize('teacher'), examController.deleteExam);
router.patch('/:examId/publish', protect, authorize('teacher'), examController.togglePublish);

module.exports = router;
