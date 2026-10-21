const { body } = require('express-validator');

const questionValidator = [
  body('questionType')
    .optional()
    .isIn(['mcq', 'subjective'])
    .withMessage('Question type must be mcq or subjective'),
  body('questionText')
    .trim()
    .notEmpty()
    .withMessage('Question text is required'),
  body('options')
    .custom((options, { req }) => {
      if ((req.body.questionType || 'mcq') === 'subjective') return true;
      if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
        throw new Error('A multiple-choice question must have between 2 and 6 options');
      }
      return true;
    }),
  body('options.*.id')
    .if((value, { req }) => (req.body.questionType || 'mcq') === 'mcq')
    .notEmpty()
    .withMessage('Each option must have an identifier'),
  body('options.*.text')
    .if((value, { req }) => (req.body.questionType || 'mcq') === 'mcq')
    .trim()
    .notEmpty()
    .withMessage('Each option must have non-empty text'),
  body('correctAnswer')
    .if((value, { req }) => (req.body.questionType || 'mcq') === 'mcq')
    .trim()
    .notEmpty()
    .withMessage('Correct answer identifier is required')
    .custom((val, { req }) => {
      const optionIds = (req.body.options || []).map((o) => o.id);
      if (optionIds.length > 0 && !optionIds.includes(val)) {
        throw new Error('Correct answer must match one of the provided option IDs');
      }
      return true;
    }),
  body('modelAnswer')
    .optional()
    .isString()
    .withMessage('Model answer must be text'),
  body('marks')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Marks must be at least 1'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  body('topic')
    .optional()
    .trim(),
  body('explanation')
    .optional()
    .trim()
];

module.exports = {
  questionValidator
};
