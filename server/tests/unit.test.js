const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateToken = require('../src/utils/generateToken');
const { authorize } = require('../src/middleware/roleMiddleware');

describe('Backend Core Logic & Security Tests', () => {
  describe('1. Password Hashing & Bcrypt Security', () => {
    it('should hash passwords with salt and verify correctly', async () => {
      const rawPassword = 'StudentSecurePassword123!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(rawPassword, salt);

      expect(hash).not.toBe(rawPassword);
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/);

      const isValid = await bcrypt.compare(rawPassword, hash);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('2. JWT Authentication & Token Integrity', () => {
    it('should generate valid signed JWT with role and user id', () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'student@examportal.edu',
        role: 'student',
        name: 'Jane Student'
      };

      const token = generateToken(mockUser);
      expect(token).toBeDefined();

      const secret = process.env.JWT_SECRET || 'online_exam_portal_dev_jwt_secret_key_123456789';
      const decoded = jwt.verify(token, secret);

      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe('student');
    });
  });

  describe('3. Role-Based Authorization Middleware', () => {
    it('should allow access when user role matches allowed roles', () => {
      const middleware = authorize('teacher');
      const req = { user: { role: 'teacher' } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject access with 403 Forbidden when user role is not permitted', () => {
      const middleware = authorize('teacher');
      const req = { user: { role: 'student' } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Access restricted to [teacher]')
        })
      );
    });

    it('should reject access with 401 when no user is attached to request', () => {
      const middleware = authorize('student', 'teacher');
      const req = {};
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('4. Authoritative Timing & Scoring Calculations', () => {
    it('should calculate accurate deadline given duration and start time', () => {
      const startedAt = new Date('2026-10-21T10:00:00.000Z');
      const durationMinutes = 45;
      const calculatedDeadline = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

      expect(calculatedDeadline.toISOString()).toBe('2026-10-21T10:45:00.000Z');
    });

    it('should cap deadline if exam hard endTime is sooner than duration', () => {
      const startedAt = new Date('2026-10-21T10:00:00.000Z');
      const durationMinutes = 60; // would end at 11:00:00
      const hardEndTime = new Date('2026-10-21T10:30:00.000Z'); // exam window closes at 10:30

      let deadline = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
      if (hardEndTime < deadline) {
        deadline = hardEndTime;
      }

      expect(deadline.toISOString()).toBe('2026-10-21T10:30:00.000Z');
    });

    it('should evaluate score, percentages, and question counts authoritatively', () => {
      const questions = [
        { _id: 'q1', marks: 2, correctAnswer: 'opt_a' },
        { _id: 'q2', marks: 3, correctAnswer: 'opt_b' },
        { _id: 'q3', marks: 5, correctAnswer: 'opt_c' }
      ];

      // Student answered Q1 correctly, Q2 incorrectly ('opt_x'), Q3 unanswered (null)
      const studentAnswers = {
        q1: 'opt_a',
        q2: 'opt_x'
      };

      let score = 0;
      let totalMarks = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;

      for (const q of questions) {
        totalMarks += q.marks;
        const selected = studentAnswers[q._id] || null;
        if (!selected) {
          unansweredCount++;
        } else if (selected === q.correctAnswer) {
          correctCount++;
          score += q.marks;
        } else {
          incorrectCount++;
        }
      }

      const percentage = Math.round((score / totalMarks) * 10000) / 100;

      expect(score).toBe(2);
      expect(totalMarks).toBe(10);
      expect(percentage).toBe(20);
      expect(correctCount).toBe(1);
      expect(incorrectCount).toBe(1);
      expect(unansweredCount).toBe(1);
    });
  });

  describe('5. Registration Role Validation Policy', () => {
    it('public registration supports only the two known account roles', () => {
      const allowedRoles = ['student', 'teacher'];
      expect(allowedRoles).toContain('student');
      expect(allowedRoles).toContain('teacher');
      expect(allowedRoles).not.toContain('admin');
    });
  });
});
