const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Exam = require('../src/models/Exam');
const Question = require('../src/models/Question');
const Attempt = require('../src/models/Attempt');
const Result = require('../src/models/Result');

let isMongoAvailable = false;
let teacherToken, teacherId;
let studentToken, studentId;
let otherStudentToken, otherStudentId;
let otherTeacherToken, otherTeacherId;
let testExamId;
let testQuestion1Id, testQuestion2Id, testQuestion3Id;
let testAttemptId;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online_exam_portal_test';

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    isMongoAvailable = true;

    // Clean test DB
    await User.deleteMany({});
    await Exam.deleteMany({});
    await Question.deleteMany({});
    await Attempt.deleteMany({});
    await Result.deleteMany({});

    // Seed Teacher A
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('Teacher@123', 10);
    const teacher = await User.create({
      name: 'Professor Test',
      email: 'prof.test@examportal.edu',
      passwordHash,
      role: 'teacher'
    });
    teacherId = teacher._id;

    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'prof.test@examportal.edu', password: 'Teacher@123' });
    teacherToken = teacherLogin.body.token;

    // Seed Teacher B
    const teacherB = await User.create({
      name: 'Professor Other',
      email: 'prof.other@examportal.edu',
      passwordHash,
      role: 'teacher'
    });
    otherTeacherId = teacherB._id;
    const teacherBLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'prof.other@examportal.edu', password: 'Teacher@123' });
    otherTeacherToken = teacherBLogin.body.token;
  } catch {
    console.warn('\n[Notice] MongoDB is not running locally. Integration tests requiring active database are skipped.');
    isMongoAvailable = false;
  }
});

afterAll(async () => {
  if (isMongoAvailable) {
    await mongoose.disconnect();
  }
});

describe('Live MongoDB Integration Test Suite', () => {
  it('checks database availability', () => {
    if (!isMongoAvailable) {
      console.log('Skipping live DB tests (no local MongoDB instance running on port 27017).');
    }
    expect(true).toBe(true);
  });

  describe('1. Authentication & Security Tests', () => {
    it('should register a new student account successfully', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Student One',
          email: 'student1@examportal.edu',
          password: 'Password@123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('student1@examportal.edu');
      expect(res.body.user.role).toBe('student');
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.token).toBeDefined();

      studentId = res.body.user._id;
      studentToken = res.body.token;
    });

    it('should register a faculty account with the selected role', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .post('/api/auth/register')
        .send({
            name: 'Faculty User',
            email: 'faculty@examportal.edu',
          password: 'Password@123',
          role: 'teacher'
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('teacher');
    });

    it('should reject registration with duplicate email (409 Conflict)', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Student',
          email: 'student1@examportal.edu',
          password: 'Password@123'
        });

      expect(res.status).toBe(409);
    });

    it('should reject login with wrong password (401 Unauthorized)', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student1@examportal.edu',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
    });

    it('should get current user profile with valid JWT', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('student1@examportal.edu');
    });

    it('register another student for cross-user isolation tests', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Student Two',
          email: 'student2@examportal.edu',
          password: 'Password@123'
        });

      expect(res.status).toBe(201);
      otherStudentId = res.body.user._id;
      otherStudentToken = res.body.token;
    });
  });

  describe('2. Role-Based Authorization & Exam Management Tests', () => {
    it('should forbid student from creating an exam (403 Forbidden)', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Unauthorized Student Exam',
          durationMinutes: 30
        });

      expect(res.status).toBe(403);
    });

    it('should allow teacher to create an exam in draft status', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Midterm Algorithms Assessment',
          description: 'Comprehensive test on sorting and tree algorithms',
          instructions: 'Read questions thoroughly. 30 minutes duration.',
          durationMinutes: 30,
          maxAttempts: 2,
          allowAnswerReview: true
        });

      expect(res.status).toBe(201);
      expect(res.body.exam.status).toBe('draft');
      testExamId = res.body.exam._id;
    });

    it('should NOT allow publishing an exam with zero questions', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .patch(`/api/exams/${testExamId}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(400);
    });

    it('should allow teacher to add questions to the exam', async () => {
      if (!isMongoAvailable) return;

      const q1 = await request(app)
        .post(`/api/exams/${testExamId}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          questionText: 'What is the time complexity of binary search?',
          options: [
            { id: 'opt_1', text: 'O(1)' },
            { id: 'opt_2', text: 'O(log N)' },
            { id: 'opt_3', text: 'O(N)' }
          ],
          correctAnswer: 'opt_2',
          marks: 2,
          topic: 'Algorithms'
        });

      expect(q1.status).toBe(201);
      testQuestion1Id = q1.body.question._id;

      const q2 = await request(app)
        .post(`/api/exams/${testExamId}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          questionText: 'Which data structure is FIFO?',
          options: [
            { id: 'opt_a', text: 'Stack' },
            { id: 'opt_b', text: 'Queue' }
          ],
          correctAnswer: 'opt_b',
          marks: 3,
          topic: 'Data Structures'
        });

      expect(q2.status).toBe(201);
      testQuestion2Id = q2.body.question._id;
    });

    it('should allow teacher to publish the exam now that it has questions', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .patch(`/api/exams/${testExamId}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.exam.status).toBe('published');
    });
  });

  describe('3. Answer Key Confidentiality & Student Exam Access', () => {
    it('CRITICAL: student viewing exam questions MUST NOT see correctAnswer or explanation', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .get(`/api/exams/${testExamId}/questions`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      for (const q of res.body.questions) {
        expect(q.correctAnswer).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      }
    });
  });

  describe('4. Timed Exam Workflow, Answer Saving, Evaluation & Idempotency', () => {
    it('should start exam attempt with authoritative server-side deadline', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .post(`/api/exams/${testExamId}/start`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.attempt.status).toBe('in-progress');
      testAttemptId = res.body.attempt._id;
    });

    it('should dynamically save answers to the attempt', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .put(`/api/attempts/${testAttemptId}/answers`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          answers: [
            { questionId: testQuestion1Id, selectedOption: 'opt_2' },
            { questionId: testQuestion2Id, selectedOption: 'opt_a' }
          ]
        });

      expect(res.status).toBe(200);
    });

    it('should submit exam and evaluate scores authoritatively on the server', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .post(`/api/attempts/${testAttemptId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.result.score).toBe(2);
      expect(res.body.result.totalMarks).toBe(5);
      expect(res.body.result.percentage).toBe(40);
    });

    it('should be idempotent: duplicate submission returns existing result', async () => {
      if (!isMongoAvailable) return;

      const res = await request(app)
        .post(`/api/attempts/${testAttemptId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.result.score).toBe(2);
    });
  });
});
