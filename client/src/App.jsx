import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import AvailableExams from './pages/student/AvailableExams';
import ExamDetails from './pages/student/ExamDetails';
import ExamAttempt from './pages/student/ExamAttempt';
import ResultDetails from './pages/student/ResultDetails';
import AttemptHistory from './pages/student/AttemptHistory';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import MyExams from './pages/teacher/MyExams';
import CreateEditExam from './pages/teacher/CreateEditExam';
import QuestionEditor from './pages/teacher/QuestionEditor';
import ExamPreview from './pages/teacher/ExamPreview';
import ExamSubmissions from './pages/teacher/ExamSubmissions';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with standard Layout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Student Protected Routes with standard Layout */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="exams" element={<AvailableExams />} />
            <Route path="exams/:examId" element={<ExamDetails />} />
            <Route path="results" element={<AttemptHistory />} />
            <Route path="results/:resultId" element={<ResultDetails />} />
          </Route>

          {/* Student Exam Attempt Screen (Distraction-Minimized Layout) */}
          <Route
            path="/student/attempts/:attemptId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamAttempt />
              </ProtectedRoute>
            }
          />

          {/* Teacher Protected Routes with standard Layout */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <MainLayout wide />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="exams" element={<MyExams />} />
            <Route path="exams/create" element={<CreateEditExam />} />
            <Route path="exams/:examId/edit" element={<CreateEditExam />} />
            <Route path="exams/:examId/questions" element={<QuestionEditor />} />
            <Route path="exams/:examId/preview" element={<ExamPreview />} />
            <Route path="exams/:examId/results" element={<ExamSubmissions />} />
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<MainLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
