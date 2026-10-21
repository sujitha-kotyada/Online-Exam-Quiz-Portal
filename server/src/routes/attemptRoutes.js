const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { saveAnswersValidator } = require('../validators/attemptValidators');

router.get('/:attemptId', protect, authorize('student'), attemptController.getAttempt);
router.put('/:attemptId/answers', protect, authorize('student'), saveAnswersValidator, validate, attemptController.saveAnswers);
router.post('/:attemptId/submit', protect, authorize('student'), attemptController.submitAttempt);

module.exports = router;
