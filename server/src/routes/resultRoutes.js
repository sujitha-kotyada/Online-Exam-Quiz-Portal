const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/my', protect, authorize('student'), resultController.getMyResults);
router.patch('/:resultId/breakdown/:questionId', protect, authorize('teacher'), resultController.gradeSubjectiveAnswer);
router.get('/:resultId', protect, resultController.getResultById);

module.exports = router;
