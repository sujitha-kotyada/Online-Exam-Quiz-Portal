import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resultApi } from '../../api/resultApi';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const ExamSubmissions = () => {
  const { examId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [grading, setGrading] = useState({});
  const [savingGrade, setSavingGrade] = useState('');

  useEffect(() => {
    const fetchResultsAndAnalytics = async () => {
      try {
        const res = await resultApi.getExamResultsAndAnalytics(examId);
        setData(res);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load submissions and analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchResultsAndAnalytics();
  }, [examId]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Computing cohort analytics and student submissions..." />;
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="alert alert-danger">{error || 'Unable to retrieve exam data'}</div>
        <Link to="/teacher/exams" className="btn btn-secondary">
          &larr; Back to My Exams
        </Link>
      </div>
    );
  }

  const { exam, analytics, results } = data;

  const handleGrade = async (item) => {
    const values = grading[item.questionId] || {};
    setSavingGrade(`${selectedSubmission._id}:${item.questionId}`);
    try {
      const response = await resultApi.gradeSubjectiveAnswer(selectedSubmission._id, item.questionId, {
        marksAwarded: values.marksAwarded ?? item.marksAwarded,
        feedback: values.feedback ?? item.graderFeedback ?? ''
      });
      setSelectedSubmission((current) => ({ ...current, ...response.result }));
      setData((prev) => ({
        ...prev,
        results: prev.results.map((result) => result._id === response.result._id ? response.result : result)
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save subjective grade');
    } finally {
      setSavingGrade('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/teacher/exams" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            &larr; Back to My Exams
          </Link>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--secondary)' }}>
            Results &amp; Analytics: {exam?.title}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Authoritative submission metrics, grade distribution, and question accuracy diagnostics.
          </p>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div>
            <div className="stat-value">{analytics.totalSubmissions}</div>
            <div className="stat-label">Total Submissions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div>
            <div className="stat-value">{analytics.averagePercentage}%</div>
            <div className="stat-label">Average Score ({analytics.averageScore} pts)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div>
            <div className="stat-value">{analytics.highestScore}</div>
            <div className="stat-label">Highest Score Achieved</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div>
            <div className="stat-value">{analytics.passRate}%</div>
            <div className="stat-label">Pass Rate ({analytics.passCount} passed)</div>
          </div>
        </div>
      </div>

      {/* Question Accuracy Diagnostics */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Question-Level Performance Diagnostics</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Pinpoint challenging concepts based on student accuracy
          </span>
        </div>

        {analytics.questionAccuracy?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
            No question accuracy data available.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {analytics.questionAccuracy.map((qa, index) => {
              const accuracy = qa.accuracyPercentage;
              let barColor = 'var(--success)';
              if (accuracy < 40) barColor = 'var(--danger)';
              else if (accuracy < 70) barColor = 'var(--warning)';

              return (
                <div key={qa.questionId || index} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem', background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.95rem' }}>
                      <span className="badge badge-subtle" style={{ marginRight: '0.5rem' }}>Q{index + 1}</span>
                      {qa.questionText}
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '90px' }}>
                      <strong style={{ fontSize: '1.1rem', color: barColor }}>{accuracy}%</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{qa.correctAnswers}/{analytics.totalSubmissions} correct</div>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${accuracy}%`,
                        height: '100%',
                        background: barColor,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Student Submissions List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Candidate Submission Records ({results.length})</h2>
        </div>

        {results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
            <p>No student submissions have been recorded for this assessment yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Result</th>
                  <th>Submitted At</th>
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {results.map((sub) => {
                  const isPassed = sub.percentage >= 50;
                  return (
                    <tr key={sub._id}>
                      <td>
                        <strong>{sub.studentId?.name || 'Student'}</strong>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {sub.studentId?.email}
                      </td>
                      <td>
                        <strong>{sub.score}</strong> / {sub.totalMarks}
                      </td>
                      <td>
                        <strong>{sub.percentage}%</strong>
                      </td>
                      <td>
                        <span className={`badge ${isPassed ? 'badge-success' : 'badge-danger'}`}>
                          {isPassed ? 'PASSED' : 'FAILED'}
                        </span>
                      </td>
                      <td>{new Date(sub.createdAt).toLocaleString()}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedSubmission(sub)}
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submission Breakdown Modal for Faculty Review */}
      <Modal
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        title={`Candidate Submission: ${selectedSubmission?.studentId?.name}`}
        size="lg"
      >
        {selectedSubmission && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Final Score</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)' }}>
                  {selectedSubmission.score} / {selectedSubmission.totalMarks} ({selectedSubmission.percentage}%)
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Outcome</div>
                <span className={`badge ${selectedSubmission.percentage >= 50 ? 'badge-success' : 'badge-danger'}`}>
                  {selectedSubmission.percentage >= 50 ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Breakdown</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {selectedSubmission.correctCount} Correct &bull; {selectedSubmission.incorrectCount} Incorrect &bull; {selectedSubmission.unansweredCount} Empty
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto' }}>
              {selectedSubmission.breakdown?.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                    borderLeft: `4px solid ${item.gradingStatus === 'pending' ? 'var(--warning)' : item.isCorrect ? 'var(--success)' : item.selectedOption ? 'var(--danger)' : 'var(--warning)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    <span className="badge badge-subtle">Question {idx + 1}</span>
                    <strong style={{ color: item.gradingStatus === 'pending' ? 'var(--warning)' : item.isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                      Marks: {item.marksAwarded} / {item.maxMarks}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {item.questionText}
                  </div>
                  {item.questionType === 'subjective' ? (
                    <div>
                      <div style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                        <strong>Written answer:</strong><br />{item.answerText || 'None (Unanswered)'}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="number"
                          min="0"
                          max={item.maxMarks}
                          className="form-input"
                          style={{ width: '110px' }}
                          value={grading[item.questionId]?.marksAwarded ?? item.marksAwarded}
                          onChange={(e) => setGrading((prev) => ({ ...prev, [item.questionId]: { ...prev[item.questionId], marksAwarded: e.target.value } }))}
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Feedback (optional)"
                          value={grading[item.questionId]?.feedback ?? item.graderFeedback ?? ''}
                          onChange={(e) => setGrading((prev) => ({ ...prev, [item.questionId]: { ...prev[item.questionId], feedback: e.target.value } }))}
                        />
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handleGrade(item)} disabled={savingGrade === `${selectedSubmission._id}:${item.questionId}`}>
                          {savingGrade === `${selectedSubmission._id}:${item.questionId}` ? 'Saving...' : 'Save Grade'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem', background: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <strong>Student Chose:</strong>{' '}
                        <span style={{ color: item.isCorrect ? 'var(--success)' : item.selectedOption ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                          {item.selectedOptionText || (item.options?.find((o) => o.id === item.selectedOption)?.text) || item.selectedOption || 'None (Unanswered)'}
                        </span>
                      </div>
                      <div>
                        <strong>Correct Answer:</strong>{' '}
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                          {item.correctAnswerText || (item.options?.find((o) => o.id === item.correctAnswer)?.text) || item.correctAnswer}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExamSubmissions;
