const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const questionRoutes = require('./routes/questionRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const resultRoutes = require('./routes/resultRoutes');

const attemptController = require('./controllers/attemptController');
const resultController = require('./controllers/resultController');

const { protect } = require('./middleware/authMiddleware');
const { authorize } = require('./middleware/roleMiddleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { connectDB } = require('./config/db');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman, vitest)
      if (!origin || origin === allowedOrigin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for development/testing flexibility
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Rate Limiting (disabled or relaxed in test mode)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address, please try again after 15 minutes.'
  }
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Ensure database connection is active before processing any API requests
app.use('/api', async (req, res, next) => {
  // Allow vitest integration tests with mocked or memory DBs to proceed
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('[API Database Connection Error]:', error.message);
    return res.status(503).json({
      success: false,
      message: `Database connection error: ${error.message}. Please check MONGODB_URI in Vercel project settings and ensure MongoDB Atlas Network Access whitelist contains 0.0.0.0/0.`
    });
  }
});

// Nested routes and direct routes required by spec
app.use('/api/auth', authRoutes);
app.post('/api/exams/:examId/start', protect, authorize('student'), attemptController.startExam);
app.get('/api/exams/:examId/results', protect, authorize('teacher'), resultController.getExamResultsAndAnalytics);
app.use('/api/exams/:examId/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/results', resultRoutes);

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
