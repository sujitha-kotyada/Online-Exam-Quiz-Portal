const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
      index: true
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true
    },
    questionType: {
      type: String,
      enum: ['mcq', 'subjective'],
      default: 'mcq',
      required: true
    },
    options: {
      type: [
        {
          id: {
            type: String,
            required: true
          },
          text: {
            type: String,
            required: [true, 'Option text is required'],
            trim: true
          }
        }
      ],
      validate: {
        validator: function (opts) {
          return this.questionType === 'subjective' || (Array.isArray(opts) && opts.length >= 2 && opts.length <= 6);
        },
        message: 'A question must have between 2 and 6 options'
      }
    },
    correctAnswer: {
      type: String,
      required: function () {
        return this.questionType === 'mcq';
      },
      trim: true
    },
    modelAnswer: {
      type: String,
      trim: true,
      default: ''
    },
    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      min: [1, 'Marks must be at least 1'],
      default: 1
    },
    order: {
      type: Number,
      default: 0
    },
    topic: {
      type: String,
      trim: true,
      default: 'General'
    },
    explanation: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

questionSchema.index({ examId: 1, order: 1 });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
