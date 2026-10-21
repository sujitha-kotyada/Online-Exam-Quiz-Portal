const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const Result = require('../models/Result');

class ExamService {
  async getPublishedExams() {
    const now = new Date();
    // Fetch published exams
    const exams = await Exam.find({
      status: 'published'
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Attach summary stats (question count and total marks)
    const examsWithDetails = await Promise.all(
      exams.map(async (exam) => {
        const questions = await Question.find({ examId: exam._id });
        const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
        return {
          ...exam.toObject(),
          questionCount: questions.length,
          totalMarks,
          isAvailable: (!exam.startTime || new Date(exam.startTime) <= now) &&
                       (!exam.endTime || new Date(exam.endTime) >= now)
        };
      })
    );

    return examsWithDetails;
  }

  async getTeacherExams(teacherId) {
    const exams = await Exam.find({ createdBy: teacherId }).sort({ createdAt: -1 });

    const examsWithStats = await Promise.all(
      exams.map(async (exam) => {
        const questions = await Question.find({ examId: exam._id });
        const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
        const attemptCount = await Attempt.countDocuments({ examId: exam._id, status: 'submitted' });

        return {
          ...exam.toObject(),
          questionCount: questions.length,
          totalMarks,
          attemptCount
        };
      })
    );

    return examsWithStats;
  }

  async getExamById(examId, user) {
    const exam = await Exam.findById(examId).populate('createdBy', 'name email');
    if (!exam) {
      const err = new Error('Exam not found');
      err.statusCode = 404;
      throw err;
    }

    // Role and ownership check
    if (user.role === 'teacher') {
      if (exam.createdBy._id.toString() !== user._id.toString()) {
        const err = new Error('Forbidden: You can only access your own exams');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'student') {
      if (exam.status !== 'published') {
        const err = new Error('Forbidden: This exam is not currently available');
        err.statusCode = 403;
        throw err;
      }
    }

    const questions = await Question.find({ examId: exam._id }).sort({ order: 1 });
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    return {
      ...exam.toObject(),
      questionCount: questions.length,
      totalMarks
    };
  }

  async createExam(examData, teacherId) {
    const exam = await Exam.create({
      ...examData,
      createdBy: teacherId,
      status: 'draft'
    });
    return exam;
  }

  async updateExam(examId, updateData, teacherId) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const err = new Error('Exam not found');
      err.statusCode = 404;
      throw err;
    }

    if (exam.createdBy.toString() !== teacherId.toString()) {
      const err = new Error('Forbidden: You can only update your own exams');
      err.statusCode = 403;
      throw err;
    }

    // Protect against overwriting createdBy
    delete updateData.createdBy;

    Object.assign(exam, updateData);
    await exam.save();
    return exam;
  }

  async deleteExam(examId, teacherId) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const err = new Error('Exam not found');
      err.statusCode = 404;
      throw err;
    }

    if (exam.createdBy.toString() !== teacherId.toString()) {
      const err = new Error('Forbidden: You can only delete your own exams');
      err.statusCode = 403;
      throw err;
    }

    // Cascade delete questions, attempts, and results
    await Question.deleteMany({ examId });
    await Attempt.deleteMany({ examId });
    await Result.deleteMany({ examId });
    await Exam.findByIdAndDelete(examId);

    return { message: 'Exam and all associated data deleted successfully' };
  }

  async togglePublish(examId, teacherId) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      const err = new Error('Exam not found');
      err.statusCode = 404;
      throw err;
    }

    if (exam.createdBy.toString() !== teacherId.toString()) {
      const err = new Error('Forbidden: You can only publish/unpublish your own exams');
      err.statusCode = 403;
      throw err;
    }

    if (exam.status === 'draft') {
      // Must have at least 1 question to publish
      const questionCount = await Question.countDocuments({ examId });
      if (questionCount === 0) {
        const err = new Error('Cannot publish an exam without questions. Please add at least one question first.');
        err.statusCode = 400;
        throw err;
      }
      exam.status = 'published';
    } else {
      exam.status = 'draft';
    }

    await exam.save();
    return exam;
  }
}

module.exports = new ExamService();
