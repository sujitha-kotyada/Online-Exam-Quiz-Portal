import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { examApi } from '../../api/examApi';
import { resultApi } from '../../api/resultApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, resultsRes] = await Promise.all([
          examApi.getExams(),
          resultApi.getMyResults()
        ]);
        setExams(examsRes.exams || []);
        setResults(resultsRes.results || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading student metrics and exams..." />;
  }

  // Calculate student statistics
  const totalAttempts = results.length;
  const avgPercentage =
    totalAttempts > 0
      ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalAttempts)
      : 0;
  const highestPercentage =
    totalAttempts > 0 ? Math.max(...results.map((r) => r.percentage)) : 0;
  const passedCount = results.filter((r) => r.percentage >= 50).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>
            Welcome back, {user?.name}! 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Track your performance, review test scores, and take active assessments.
          </p>
        </div>
        <div>
          <Link to="/student/exams" className="btn btn-primary">
            Explore Available Exams &rarr;
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div>
            <div className="stat-value">{exams.length}</div>
            <div className="stat-label">Available Assessments</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div>
            <div className="stat-value">{totalAttempts}</div>
            <div className="stat-label">Tests Completed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div>
            <div className="stat-value">{avgPercentage}%</div>
            <div className="stat-label">Average Performance</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div>
            <div className="stat-value">{highestPercentage}%</div>
            <div className="stat-label">Top Score Achieved</div>
          </div>
        </div>
      </div>

      {/* Available Exams Spotlight */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Available Assessments</h2>
          <Link to="/student/exams" className="btn btn-secondary btn-sm">
            View All ({exams.length})
          </Link>
        </div>

        {exams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <p>No exams are currently published. Check back later!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {exams.slice(0, 3).map((exam) => (
              <div
                key={exam._id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: '#ffffff'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span className="badge badge-primary">{exam.durationMinutes} Mins</span>
                    <span className="badge badge-success">Active</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--secondary)' }}>
                    {exam.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {exam.description || 'No description provided.'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    {exam.questionCount || 0} Questions &bull; {exam.totalMarks || 0} Marks
                  </span>
                  <Link to={`/student/exams/${exam._id}`} className="btn btn-primary btn-sm">
                    View Instructions &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Submissions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Exam Submissions</h2>
          <Link to="/student/results" className="btn btn-secondary btn-sm">
            Full Attempt History
          </Link>
        </div>

        {results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <p>You have not completed any exam attempts yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Result</th>
                  <th>Submitted At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 5).map((r) => (
                  <tr key={r._id}>
                    <td>
                      <strong>{r.examId?.title || 'Exam'}</strong>
                    </td>
                    <td>
                      {r.score} / {r.totalMarks}
                    </td>
                    <td>
                      <strong>{r.percentage}%</strong>
                    </td>
                    <td>
                      <span className={`badge ${r.percentage >= 50 ? 'badge-success' : 'badge-danger'}`}>
                        {r.percentage >= 50 ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/student/results/${r._id}`} className="btn btn-secondary btn-sm">
                        View Report
                      </Link>
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

export default StudentDashboard;
