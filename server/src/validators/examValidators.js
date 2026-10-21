const { body } = require('express-validator');

const createExamValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Exam title is required')
    .isLength({ max: 200 })
    .withMessage('Exam title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim(),
  body('instructions')
    .optional()
    .trim(),
  body('durationMinutes')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 1, max: 300 })
    .withMessage('Duration must be between 1 and 300 minutes'),
  body('maxAttempts')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max attempts must be an integer of at least 1'),
  body('startTime')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  body('endTime')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date'),
  body('allowAnswerReview')
    .optional()
    .isBoolean()
    .withMessage('allowAnswerReview must be a boolean')
];

const updateExamValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Exam title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Exam title cannot exceed 200 characters'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1, max: 300 })
    .withMessage('Duration must be between 1 and 300 minutes'),
  body('maxAttempts')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max attempts must be an integer of at least 1'),
  body('allowAnswerReview')
    .optional()
    .isBoolean()
    .withMessage('allowAnswerReview must be a boolean')
];

module.exports = {
  createExamValidator,
  updateExamValidator
};
