const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedOption: {
      type: String,
      default: null
    },
    answerText: {
      type: String,
      trim: true,
      default: ''
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
      index: true
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    deadline: {
      type: Date,
      required: true
    },
    submittedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ['in-progress', 'submitted', 'expired'],
        message: 'Status must be in-progress, submitted, or expired'
      },
      default: 'in-progress',
      index: true
    },
    answers: [answerSchema]
  },
  {
    timestamps: true
  }
);

attemptSchema.index({ studentId: 1, examId: 1, attemptNumber: 1 });
attemptSchema.index({ studentId: 1, examId: 1, status: 1 });

const Attempt = mongoose.model('Attempt', attemptSchema);
module.exports = Attempt;
