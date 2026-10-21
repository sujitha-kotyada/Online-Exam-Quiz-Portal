import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import { attemptApi } from '../../api/attemptApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const ExamDetails = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await examApi.getExamById(examId);
        setExam(res.exam);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load exam details');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const handleStartExam = async () => {
    setStarting(true);
    setError('');

    try {
      const res = await attemptApi.startExam(examId);
      // Navigate directly into exam attempt session
      navigate(`/student/attempts/${res.attempt._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start examination attempt');
      setStarting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading exam rules and instructions..." />;
  }

  if (error && !exam) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="alert alert-danger">{error}</div>
        <Link to="/student/exams" className="btn btn-secondary">
          &larr; Back to Available Exams
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <Link to="/student/exams" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
        &larr; Back to Available Exams
      </Link>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>Official Assessment</span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--secondary)' }}>
              {exam.title}
            </h1>
          </div>
          <span className="badge badge-success">Available</span>
        </div>

        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {exam.description || 'No description provided.'}
        </p>

        {/* Specifications Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Duration</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary)' }}>{exam.durationMinutes} Mins</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Questions</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary)' }}>{exam.questionCount || 0} MCQs</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Marks</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary)' }}>{exam.totalMarks || 0} Marks</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Max Attempts</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary)' }}>{exam.maxAttempts || 1} Allowed</div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.75rem' }}>
            Candidate Instructions
          </h2>
          <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', whiteSpace: 'pre-line', fontSize: '0.925rem', lineHeight: 1.6 }}>
            {exam.instructions || 'Read each question carefully before selecting an answer.'}
          </div>
        </div>

        {/* Security & Timing Checklist */}
        <div className="alert alert-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
          <strong>Important Examination Rules:</strong>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
            <li>The countdown timer starts as soon as you click <strong>Start Assessment</strong>.</li>
            <li>The server maintains the authoritative deadline. Refreshing your browser will <strong>not</strong> reset the clock.</li>
            <li>Your answers are automatically saved as you select them.</li>
            <li>When time expires, your exam will automatically submit and calculate your grade.</li>
          </ul>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Link to="/student/exams" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handleStartExam}
            disabled={starting}
          >
            {starting ? 'Initiating Attempt...' : 'Start Assessment Now →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamDetails;
