import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptApi } from '../../api/attemptApi';
import Timer from '../../components/Timer';
import QuestionPalette from '../../components/QuestionPalette';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const ExamAttempt = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: selected option or written answer }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving' | 'saved' | 'error'
  const [error, setError] = useState('');

  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    const fetchAttemptData = async () => {
      try {
        const res = await attemptApi.getAttempt(attemptId);
        setAttempt(res.attempt);
        setQuestions(res.questions || []);

        // Populate already saved answers (refresh resilience)
        const initialAnswers = {};
        if (res.attempt.answers && Array.isArray(res.attempt.answers)) {
          res.attempt.answers.forEach((ans) => {
            if (ans.questionId) {
              initialAnswers[ans.questionId] = ans.answerText || ans.selectedOption || null;
            }
          });
        }
        setAnswers(initialAnswers);

        // If already submitted, redirect to result
        if (res.attempt.status === 'submitted') {
          // Check if we can find result or go to history
          navigate('/student/results', { replace: true });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load exam attempt');
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptData();
  }, [attemptId, navigate]);

  // Save answer to server
  const saveAnswerToServer = async (newAnswers) => {
    setSaveStatus('saving');
    try {
      const payload = Object.entries(newAnswers).map(([qId, answer]) => ({
        questionId: qId,
        selectedOption: typeof answer === 'string' && questions.find((q) => q._id === qId)?.questionType !== 'subjective' ? answer : null,
        answerText: questions.find((q) => q._id === qId)?.questionType === 'subjective' ? answer : ''
      }));
      await attemptApi.saveAnswers(attemptId, payload);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to save answers to server:', err);
      setSaveStatus('error');
    }
  };

  const handleOptionSelect = (optionId) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const updated = {
      ...answers,
      [currentQ._id]: optionId
    };

    const handleWrittenAnswerChange = (answerText) => {
      const currentQ = questions[currentIndex];
      if (!currentQ) return;
      const updated = { ...answers, [currentQ._id]: answerText };
      setAnswers(updated);
      saveAnswerToServer(updated);
    };
    setAnswers(updated);
    saveAnswerToServer(updated);
  };

  const handleClearAnswer = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const updated = {
      ...answers,
      [currentQ._id]: null
    };
    setAnswers(updated);
    saveAnswerToServer(updated);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setIsSubmitModalOpen(false);

    try {
      // First ensure latest answers are persisted
      const payload = Object.entries(answersRef.current).map(([qId, answer]) => ({
        questionId: qId,
        selectedOption: questions.find((q) => q._id === qId)?.questionType === 'subjective' ? null : answer,
        answerText: questions.find((q) => q._id === qId)?.questionType === 'subjective' ? answer : ''
      }));
      await attemptApi.saveAnswers(attemptId, payload);

      // Perform final server-side evaluation & submission
      const res = await attemptApi.submitAttempt(attemptId);
      navigate(`/student/results/${res.result._id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting exam');
      setSubmitting(false);
    }
  };

  // Timer auto-expire callback
  const handleTimeExpired = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await attemptApi.submitAttempt(attemptId);
      navigate(`/student/results/${res.result._id}`, { replace: true });
    } catch {
      navigate('/student/results', { replace: true });
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading exam assessment session..." />;
  }

  if (error && !attempt) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto' }}>
        <div className="alert alert-danger">{error}</div>
        <button onClick={() => navigate('/student/exams')} className="btn btn-primary">
          Back to Exams
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const selectedOption = currentQuestion ? answers[currentQuestion._id] : null;
  const answeredCount = questions.filter((q) => typeof answers[q._id] === 'string' && answers[q._id].trim()).length;

  return (
    <div className="exam-layout">
      {/* Sticky Exam Top Bar */}
      <header className="exam-header">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary)' }}>
            {attempt?.examId?.title || 'Examination Assessment'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>&bull;</span>
            <span style={{ color: saveStatus === 'error' ? 'var(--danger)' : 'var(--success)' }}>
              {saveStatus === 'saving' && 'Syncing answers...'}
              {saveStatus === 'saved' && 'All changes saved to cloud'}
              {saveStatus === 'error' && 'Sync failed (will retry)'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Timer deadline={attempt?.deadline} onExpire={handleTimeExpired} />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={submitting}
          >
            Finish &amp; Submit
          </button>
        </div>
      </header>

      {/* Main Examination View */}
      <div className="exam-body">
        {/* Question Panel */}
        <div className="exam-question-area">
          {error && <div className="alert alert-danger">{error}</div>}

          {currentQuestion ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="badge badge-primary">
                  Question {currentIndex + 1}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Marks: {currentQuestion.marks || 1} &bull; Topic: {currentQuestion.topic || 'General'}
                </span>
              </div>

              <div className="question-text">
                {currentQuestion.questionText}
              </div>

              {currentQuestion.questionType === 'subjective' ? (
                <div className="form-group">
                  <label className="form-label" htmlFor={`answer_${currentQuestion._id}`}>Written answer</label>
                  <textarea
                    id={`answer_${currentQuestion._id}`}
                    className="form-textarea"
                    rows={10}
                    maxLength={10000}
                    placeholder="Write your answer here..."
                    value={selectedOption || ''}
                    onChange={(e) => handleWrittenAnswerChange(e.target.value)}
                  />
                  <small style={{ color: 'var(--text-muted)' }}>{(selectedOption || '').length}/10000 characters</small>
                </div>
              ) : <div className="options-list">
                {(currentQuestion.options || []).map((option) => {
                  const isSelected = selectedOption === option.id;
                  return (
                    <div
                      key={option.id}
                      className={`option-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect(option.id)}
                    >
                      <input
                        type="radio"
                        name={`question_${currentQuestion._id}`}
                        id={`opt_${option.id}`}
                        className="option-radio"
                        checked={isSelected}
                        onChange={() => handleOptionSelect(option.id)}
                      />
                      <label
                        htmlFor={`opt_${option.id}`}
                        style={{ cursor: 'pointer', flex: 1, fontSize: '0.975rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)', fontWeight: isSelected ? 600 : 400 }}
                      >
                        {option.text}
                      </label>
                    </div>
                  );
                })}
              </div>}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                >
                  &larr; Previous Question
                </button>

                {selectedOption && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleClearAnswer}
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                  >
                    Clear Selection
                  </button>
                )}

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  >
                    Next Question &rarr;
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsSubmitModalOpen(true)}
                  >
                    Review &amp; Submit &rarr;
                  </button>
                )}
              </div>
            </>
          ) : (
            <p>No questions available for this assessment.</p>
          )}
        </div>

        {/* Sidebar: Question Palette & Instructions */}
        <aside className="exam-sidebar">
          <QuestionPalette
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            onSelectQuestion={(idx) => setCurrentIndex(idx)}
          />

          <div className="card" style={{ padding: '1.25rem', fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--secondary)', display: 'block', marginBottom: '0.4rem' }}>
              Summary Progress
            </strong>
            <div>Total Questions: {questions.length}</div>
            <div style={{ color: 'var(--success)', fontWeight: 600 }}>Answered: {answeredCount}</div>
            <div style={{ color: 'var(--warning)', fontWeight: 600 }}>Unanswered: {questions.length - answeredCount}</div>
          </div>
        </aside>
      </div>

      {/* Submission Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Examination Attempt?"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={submitting}
            >
              Continue Test
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleFinalSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting & Evaluating...' : 'Confirm Submission'}
            </button>
          </>
        }
      >
        <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
          Are you sure you want to finish and submit your exam? Once submitted, you will not be able to change your answers.
        </p>

        <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)' }}>{questions.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Questions</div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>{answeredCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Answered</div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>{questions.length - answeredCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unanswered</div>
          </div>
        </div>

        {questions.length - answeredCount > 0 && (
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--warning)', fontWeight: 500 }}>
            ⚠️ Notice: You still have {questions.length - answeredCount} unanswered question(s). Unanswered questions receive 0 marks.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default ExamAttempt;
