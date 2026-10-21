import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resultApi } from '../../api/resultApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const AttemptHistory = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await resultApi.getMyResults();
        setResults(res.results || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load past attempt history');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading past assessment results..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>
            My Examination History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Review all completed assessments, scores, and evaluation breakdowns.
          </p>
        </div>
        <Link to="/student/exams" className="btn btn-primary">
          Take An Assessment &rarr;
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        {results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)' }}>
              No past examinations recorded
            </h3>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
              You have not submitted any exam attempts yet.
            </p>
            <Link to="/student/exams" className="btn btn-primary">
              Browse Available Exams
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Completed Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const isPassed = r.percentage >= 50;
                  return (
                    <tr key={r._id}>
                      <td>
                        <strong>{r.examId?.title || 'Exam'}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Duration: {r.examId?.durationMinutes || 0} mins
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{r.score}</span> / {r.totalMarks}
                      </td>
                      <td>
                        <strong style={{ color: isPassed ? 'var(--success)' : 'var(--danger)' }}>
                          {r.percentage}%
                        </strong>
                      </td>
                      <td>
                        <span className={`badge ${isPassed ? 'badge-success' : 'badge-danger'}`}>
                          {isPassed ? 'PASSED' : 'FAILED'}
                        </span>
                      </td>
                      <td>{new Date(r.createdAt).toLocaleString()}</td>
                      <td>
                        <Link to={`/student/results/${r._id}`} className="btn btn-secondary btn-sm">
                          View Report &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttemptHistory;
