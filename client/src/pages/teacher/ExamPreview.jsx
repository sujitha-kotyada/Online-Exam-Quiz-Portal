import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const ExamPreview = () => {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showAnswerKeys, setShowAnswerKeys] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const [examRes, questionsRes] = await Promise.all([
          examApi.getExamById(examId),
          examApi.getQuestions(examId)
        ]);
        setExam(examRes.exam);
        setQuestions(questionsRes.questions || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading exam preview simulation..." />;
  }

  if (error || !exam) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="alert alert-danger">{error || 'Exam not found'}</div>
        <Link to="/teacher/exams" className="btn btn-secondary">
          &larr; Back to Exams
        </Link>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const selectedOpt = currentQ ? selectedOptions[currentQ._id] : null;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Simulation Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#312e81', color: '#ffffff', padding: '0.85rem 1.5rem', borderRadius: 'var(--radius-md)', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.25rem' }}>👁️</span>
          <div>
            <strong>Student View Simulation Mode</strong>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>Previewing "{exam.title}" &bull; Responses are not recorded</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showAnswerKeys}
              onChange={(e) => setShowAnswerKeys(e.target.checked)}
              style={{ accentColor: '#10b981' }}
            />
            Highlight Correct Answers
          </label>
          <Link to={`/teacher/exams/${examId}/questions`} className="btn btn-secondary btn-sm" style={{ color: '#0f172a' }}>
            Exit Preview
          </Link>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
          <p>No questions have been added yet to preview.</p>
          <Link to={`/teacher/exams/${examId}/questions`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Add Questions First
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <span className="badge badge-primary">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Marks: {currentQ?.marks || 1} &bull; Topic: {currentQ?.topic || 'General'}
            </span>
          </div>

          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            {currentQ?.questionText}
          </div>

          {currentQ?.questionType === 'subjective' ? (
            <textarea
              className="form-textarea"
              rows={8}
              placeholder="Student written answer area"
              value={selectedOpt || ''}
              onChange={(e) => setSelectedOptions((prev) => ({ ...prev, [currentQ._id]: e.target.value }))}
            />
          ) : <div className="options-list">
            {(currentQ?.options || []).map((opt) => {
              const isSelected = selectedOpt === opt.id;
              const isCorrect = showAnswerKeys && opt.id === currentQ.correctAnswer;

              return (
                <div
                  key={opt.id}
                  className={`option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedOptions((prev) => ({ ...prev, [currentQ._id]: opt.id }))}
                  style={isCorrect ? { borderColor: 'var(--success)', background: 'var(--success-light)' } : {}}
                >
                  <input
                    type="radio"
                    name={`preview_opt_${currentQ._id}`}
                    id={`prev_${opt.id}`}
                    className="option-radio"
                    checked={isSelected}
                    onChange={() => setSelectedOptions((prev) => ({ ...prev, [currentQ._id]: opt.id }))}
                  />
                  <label htmlFor={`prev_${opt.id}`} style={{ cursor: 'pointer', flex: 1, fontSize: '0.975rem' }}>
                    {opt.text}
                  </label>
                  {isCorrect && (
                    <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                      Correct Key
                    </span>
                  )}
                </div>
              );
            })}
          </div>}

          {showAnswerKeys && currentQ?.questionType === 'subjective' && currentQ?.modelAnswer && (
            <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '1.5rem', fontSize: '0.9rem' }}>
              <strong>Model Answer / Grading Guidance:</strong> {currentQ.modelAnswer}
            </div>
          )}

          {showAnswerKeys && currentQ?.explanation && (
            <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '1.5rem', fontSize: '0.9rem' }}>
              <strong>Instructor Explanation:</strong> {currentQ.explanation}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              &larr; Previous Question
            </button>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {questions.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: i === currentIndex ? 'var(--primary)' : selectedOptions[questions[i]._id] ? 'var(--success)' : '#ffffff',
                    color: i === currentIndex || selectedOptions[questions[i]._id] ? '#ffffff' : 'var(--text-main)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
            >
              Next Question &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPreview;
