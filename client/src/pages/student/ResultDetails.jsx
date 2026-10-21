import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resultApi } from '../../api/resultApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const ResultDetails = () => {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await resultApi.getResultById(resultId);
        setResult(res.result);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load exam result details');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading detailed score report..." />;
  }

  if (error || !result) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="alert alert-danger">{error || 'Result not found'}</div>
        <Link to="/student/results" className="btn btn-primary">
          &larr; Back to My Results
        </Link>
      </div>
    );
  }

  const isPassed = result.percentage >= 50;
  const hasPendingReview = result.gradingStatus === 'provisional' || result.breakdown?.some((item) => item.gradingStatus === 'pending');

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/student/results" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          &larr; Back to Result History
        </Link>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Evaluated On: {new Date(result.createdAt).toLocaleString()}
        </span>
      </div>

      {/* Main Score Card Banner */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          background: isPassed ? 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
          borderTop: `5px solid ${isPassed ? 'var(--success)' : 'var(--danger)'}`
        }}
      >
        <span className={`badge ${isPassed ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', marginBottom: '1rem' }}>
          {hasPendingReview ? 'SUBMITTED — AWAITING REVIEW' : isPassed ? 'CONGRATULATIONS — PASSED' : 'NEEDS IMPROVEMENT — FAILED'}
        </span>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '0.5rem' }}>
          {result.examId?.title || 'Examination Assessment'}
        </h1>

        <div style={{ fontSize: '3.75rem', fontWeight: 900, color: isPassed ? 'var(--success)' : 'var(--danger)', lineHeight: 1.1, margin: '1rem 0' }}>
          {result.percentage}%{hasPendingReview ? '*' : ''}
        </div>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          You scored <strong>{result.score}</strong> out of <strong>{result.totalMarks}</strong> total marks
        </p>
        {hasPendingReview && <p style={{ color: 'var(--warning)', fontWeight: 600 }}>Subjective answers are awaiting faculty review. Your score is provisional.</p>}

        {/* Breakdown Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', maxWidth: '650px', margin: '0 auto' }}>
          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{result.correctCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Correct</div>
          </div>
          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{result.incorrectCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Incorrect</div>
          </div>
          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)' }}>{result.unansweredCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unanswered</div>
          </div>
          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
              {result.breakdown?.length || (result.correctCount + result.incorrectCount + result.unansweredCount)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Questions</div>
          </div>
        </div>
      </div>

      {/* Question Breakdown Review */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Detailed Question Review</h2>
          {result.examId?.allowAnswerReview ? (
            <span className="badge badge-primary">Answer Key &amp; Explanations Enabled</span>
          ) : (
            <span className="badge badge-warning">Review Restricted</span>
          )}
        </div>

        {!result.examId?.allowAnswerReview ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
            <p style={{ fontWeight: 600 }}>The instructor has disabled question-level review for this assessment.</p>
            <p style={{ fontSize: '0.875rem' }}>Your overall marks and percentages above are certified final.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0' }}>
            {result.breakdown?.map((item, index) => (
              <div
                key={item.questionId || index}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  borderLeft: `5px solid ${item.gradingStatus === 'pending' ? 'var(--warning)' : item.isCorrect ? 'var(--success)' : item.selectedOption ? 'var(--danger)' : 'var(--warning)'}`,
                  background: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge badge-subtle">Question {index + 1}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: item.gradingStatus === 'pending' ? 'var(--warning)' : item.isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                    Marks Awarded: {item.marksAwarded} / {item.maxMarks}
                  </span>
                </div>

                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {item.questionText}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ background: item.gradingStatus === 'pending' ? 'var(--warning-light)' : item.selectedOption ? (item.isCorrect ? 'var(--success-light)' : 'var(--danger-light)') : 'var(--warning-light)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>YOUR ANSWER:</div>
                    <div style={{ fontWeight: 700, color: item.gradingStatus === 'pending' ? '#92400e' : item.selectedOption ? (item.isCorrect ? '#065f46' : '#991b1b') : '#92400e', whiteSpace: 'pre-wrap' }}>
                      {item.questionType === 'subjective' ? (item.answerText || 'Not Answered') : item.selectedOption ? `Option ID: ${item.selectedOption}` : 'Not Answered'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--success-light)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>CORRECT ANSWER:</div>
                    <div style={{ fontWeight: 700, color: '#065f46' }}>
                      Option ID: {item.correctAnswer}
                    </div>
                  </div>
                </div>

                {item.explanation && (
                  <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    <strong>Explanation:</strong> {item.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
        <Link to="/student/results" className="btn btn-secondary">
          View All Previous Attempts
        </Link>
        <Link to="/student/exams" className="btn btn-primary">
          Take Another Exam
        </Link>
      </div>
    </div>
  );
};

export default ResultDetails;
