import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { examApi } from '../../api/examApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExams = async () => {
    try {
      const res = await examApi.getExams();
      setExams(res.exams || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teacher dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleTogglePublish = async (examId) => {
    try {
      await examApi.togglePublish(examId);
      await fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading faculty portal and exams..." />;
  }

  // Calculate teacher dashboard metrics
  const totalExams = exams.length;
  const publishedCount = exams.filter((e) => e.status === 'published').length;
  const totalQuestions = exams.reduce((sum, e) => sum + (e.questionCount || 0), 0);
  const totalSubmissions = exams.reduce((sum, e) => sum + (e.attemptCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Faculty Greeting & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>
            Faculty Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Welcome, {user?.name}. Author assessments, manage question banks, and analyze student outcomes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/teacher/exams/create" className="btn btn-primary">
            + Create New Exam
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div>
            <div className="stat-value">{totalExams}</div>
            <div className="stat-label">Total Exams Authored</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚀</div>
          <div>
            <div className="stat-value">{publishedCount}</div>
            <div className="stat-label">Published &amp; Live</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">❓</div>
          <div>
            <div className="stat-value">{totalQuestions}</div>
            <div className="stat-label">Total Questions Authored</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div>
            <div className="stat-value">{totalSubmissions}</div>
            <div className="stat-label">Total Submissions Received</div>
          </div>
        </div>
      </div>

      {/* Recent Exams & Management */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">My Created Examinations</h2>
          <Link to="/teacher/exams" className="btn btn-secondary btn-sm">
            View All Exams ({exams.length})
          </Link>
        </div>

        {exams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✍️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)' }}>
              No exams created yet
            </h3>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
              Begin by creating your first course examination or quiz.
            </p>
            <Link to="/teacher/exams/create" className="btn btn-primary">
              Create Your First Exam
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Questions</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Submissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.slice(0, 5).map((exam) => (
                  <tr key={exam._id}>
                    <td>
                      <strong>{exam.title}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Created: {new Date(exam.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>{exam.questionCount || 0}</td>
                    <td>{exam.durationMinutes} mins</td>
                    <td>
                      <span className={`badge ${exam.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{exam.attemptCount || 0}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <Link to={`/teacher/exams/${exam._id}/questions`} className="btn btn-secondary btn-sm" title="Edit Questions">
                          Questions ({exam.questionCount || 0})
                        </Link>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleTogglePublish(exam._id)}
                          title={exam.status === 'published' ? 'Unpublish to draft' : 'Publish to students'}
                        >
                          {exam.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>

                        <Link to={`/teacher/exams/${exam._id}/results`} className="btn btn-secondary btn-sm" title="View Student Submissions">
                          Analytics
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
