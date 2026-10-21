const { body } = require('express-validator');

const saveAnswersValidator = [
  body('answers')
    .isArray()
    .withMessage('Answers must be provided as an array'),
  body('answers.*.questionId')
    .notEmpty()
    .withMessage('Each answer must reference a valid questionId'),
  body('answers.*.selectedOption')
    .optional({ nullable: true })
    .isString()
    .withMessage('Selected option must be text'),
  body('answers.*.answerText')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 10000 })
    .withMessage('Written answers must be 10,000 characters or fewer')
];

module.exports = {
  saveAnswersValidator
};
