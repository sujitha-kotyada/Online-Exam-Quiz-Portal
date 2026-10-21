const mongoose = require('mongoose');

const resultItemSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    questionText: {
      type: String,
      default: ''
    },
    questionType: {
      type: String,
      enum: ['mcq', 'subjective'],
      default: 'mcq'
    },
    selectedOption: {
      type: String,
      default: null
    },
    answerText: {
      type: String,
      default: ''
    },
    correctAnswer: {
      type: String,
      default: ''
    },
    isCorrect: {
      type: Boolean,
      default: null
    },
    gradingStatus: {
      type: String,
      enum: ['auto-graded', 'pending', 'manually-graded'],
      default: 'auto-graded'
    },
    graderFeedback: {
      type: String,
      default: ''
    },
    marksAwarded: {
      type: Number,
      default: 0
    },
    maxMarks: {
      type: Number,
      default: 1
    },
    explanation: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      required: true,
      unique: true,
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    correctCount: {
      type: Number,
      required: true,
      min: 0
    },
    incorrectCount: {
      type: Number,
      required: true,
      min: 0
    },
    unansweredCount: {
      type: Number,
      required: true,
      min: 0
    },
    breakdown: [resultItemSchema]
    ,
    gradingStatus: {
      type: String,
      enum: ['provisional', 'final'],
      default: 'final'
    }
  },
  {
    timestamps: true
  }
);

resultSchema.index({ examId: 1, studentId: 1 });
resultSchema.index({ studentId: 1, createdAt: -1 });

const Result = mongoose.model('Result', resultSchema);
module.exports = Result;
