import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const QuestionEditor = () => {
  const { examId } = useParams();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State for adding/editing questions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [modalForm, setModalForm] = useState({
    questionType: 'mcq',
    questionText: '',
    marks: 1,
    topic: 'General',
    explanation: '',
    modelAnswer: '',
    options: [
      { id: 'opt_1', text: '' },
      { id: 'opt_2', text: '' },
      { id: 'opt_3', text: '' },
      { id: 'opt_4', text: '' }
    ],
    correctAnswer: 'opt_1'
  });
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchExamAndQuestions = async () => {
    try {
      const [examRes, questionsRes] = await Promise.all([
        examApi.getExamById(examId),
        examApi.getQuestions(examId)
      ]);
      setExam(examRes.exam);
      setQuestions(questionsRes.questions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamAndQuestions();
  }, [examId]);

  const handleOpenAddModal = () => {
    setEditingQuestionId(null);
    setModalForm({
      questionType: 'mcq',
      questionText: '',
      marks: 1,
      topic: 'General',
      explanation: '',
      modelAnswer: '',
      options: [
        { id: 'opt_1', text: '' },
        { id: 'opt_2', text: '' },
        { id: 'opt_3', text: '' },
        { id: 'opt_4', text: '' }
      ],
      correctAnswer: 'opt_1'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (q) => {
    setEditingQuestionId(q._id);
    setModalForm({
      questionType: q.questionType || 'mcq',
      questionText: q.questionText,
      marks: q.marks || 1,
      topic: q.topic || 'General',
      explanation: q.explanation || '',
      modelAnswer: q.modelAnswer || '',
      options: (q.options || []).map((o) => ({ id: o.id, text: o.text })),
      correctAnswer: q.correctAnswer
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOptionChange = (idx, text) => {
    const updated = [...modalForm.options];
    updated[idx].text = text;
    setModalForm((prev) => ({ ...prev, options: updated }));
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setModalError('');

    if (modalForm.questionType === 'mcq' && modalForm.options.some((o) => !o.text.trim())) {
      setModalError('All 4 option fields must be provided with text');
      return;
    }

    setSavingQuestion(true);
    try {
      if (editingQuestionId) {
        await examApi.updateQuestion(examId, editingQuestionId, modalForm);
      } else {
        await examApi.createQuestion(examId, modalForm);
      }
      setIsModalOpen(false);
      await fetchExamAndQuestions();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await examApi.deleteQuestion(examId, qId);
      await fetchExamAndQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const handleTogglePublish = async () => {
    try {
      await examApi.togglePublish(examId);
      await fetchExamAndQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update publish state');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading question bank..." />;
  }

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Breadcrumb & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/teacher/exams" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            &larr; Back to My Exams
          </Link>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--secondary)' }}>
            Question Bank: {exam?.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
            <span className={`badge ${exam?.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
              Status: {exam?.status}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {questions.length} Questions &bull; {totalMarks} Total Marks &bull; {exam?.durationMinutes} Mins
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to={`/teacher/exams/${examId}/preview`} className="btn btn-secondary">
            Preview Student Exam
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTogglePublish}
          >
            {exam?.status === 'published' ? 'Unpublish to Draft' : 'Publish Exam'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAddModal}
          >
            + Add Question
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Questions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {questions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>❓</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)' }}>
              No questions in this assessment
            </h3>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
              Add at least one question before this examination can be published for students.
            </p>
            <button type="button" className="btn btn-primary" onClick={handleOpenAddModal}>
              + Add First Question
            </button>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q._id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-primary">Q{idx + 1}</span>
                  <span className="badge badge-subtle">{q.topic || 'General'}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Marks: {q.marks || 1}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEditModal(q)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDeleteQuestion(q._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                {q.questionText}
              </div>

              {/* Options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {(q.options || []).map((opt) => {
                  const isCorrect = opt.id === q.correctAnswer;
                  return (
                    <div
                      key={opt.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: isCorrect ? '2px solid var(--success)' : '1px solid var(--border)',
                        background: isCorrect ? 'var(--success-light)' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.925rem'
                      }}
                    >
                      <span style={{ color: isCorrect ? '#065f46' : 'var(--text-main)', fontWeight: isCorrect ? 600 : 400 }}>
                        {opt.text}
                      </span>
                      {isCorrect && (
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                          Correct Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Question Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuestionId ? 'Edit Question' : 'Add New Question'}
        size="lg"
      >
        {modalError && <div className="alert alert-danger">{modalError}</div>}

        <form onSubmit={handleSaveQuestion}>
          <div className="form-group">
            <label className="form-label" htmlFor="questionText">Question Text *</label>
            <textarea
              id="questionText"
              className="form-textarea"
              placeholder="Enter your multiple-choice question here..."
              value={modalForm.questionText}
              onChange={(e) => setModalForm((prev) => ({ ...prev, questionText: e.target.value }))}
              required
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="marks">Marks *</label>
              <input
                id="marks"
                type="number"
                min="1"
                max="50"
                className="form-input"
                value={modalForm.marks}
                onChange={(e) => setModalForm((prev) => ({ ...prev, marks: parseInt(e.target.value, 10) || 1 }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="topic">Topic / Category</label>
              <input
                id="topic"
                type="text"
                className="form-input"
                placeholder="e.g. Trees, Closures, Algorithms"
                value={modalForm.topic}
                onChange={(e) => setModalForm((prev) => ({ ...prev, topic: e.target.value }))}
              />
            </div>
          </div>

          {/* Options with Correct Answer Selector */}
          <div style={{ margin: '1rem 0' }}>
            <label className="form-label" htmlFor="questionType">Question Type *</label>
            <select
              id="questionType"
              className="form-input"
              value={modalForm.questionType}
              onChange={(e) => setModalForm((prev) => ({ ...prev, questionType: e.target.value }))}
            >
              <option value="mcq">Multiple choice</option>
              <option value="subjective">Subjective written answer</option>
            </select>
          </div>

          {modalForm.questionType === 'mcq' && <div style={{ margin: '1rem 0' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Options (Select radio for correct answer) *
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {modalForm.options.map((opt, idx) => {
                const isCorrect = modalForm.correctAnswer === opt.id;
                return (
                  <div
                    key={opt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: isCorrect ? 'var(--success-light)' : 'var(--bg-subtle)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: isCorrect ? '1px solid var(--success-border)' : '1px solid var(--border)'
                    }}
                  >
                    <input
                      type="radio"
                      name="correctAnswerSelect"
                      id={`correct_${opt.id}`}
                      checked={isCorrect}
                      onChange={() => setModalForm((prev) => ({ ...prev, correctAnswer: opt.id }))}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--success)', cursor: 'pointer' }}
                      title="Mark as correct answer"
                    />
                    <label htmlFor={`correct_${opt.id}`} style={{ fontWeight: 700, fontSize: '0.85rem', width: '24px', cursor: 'pointer' }}>
                      {String.fromCharCode(65 + idx)}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Enter text for Option ${String.fromCharCode(65 + idx)}`}
                      value={opt.text}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      required
                    />
                  </div>
                );
              })}
            </div>
          </div>}

          {modalForm.questionType === 'subjective' && (
            <div className="form-group">
              <label className="form-label" htmlFor="modelAnswer">Model Answer / Grading Guidance (Optional)</label>
              <textarea
                id="modelAnswer"
                className="form-textarea"
                placeholder="Keep a reference answer or grading guidance for faculty review."
                value={modalForm.modelAnswer || ''}
                onChange={(e) => setModalForm((prev) => ({ ...prev, modelAnswer: e.target.value }))}
                rows={3}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="explanation">Explanation &amp; Justification (Optional)</label>
            <textarea
              id="explanation"
              className="form-textarea"
              placeholder="Why is this answer correct? Displayed to students after submission if review is permitted."
              value={modalForm.explanation}
              onChange={(e) => setModalForm((prev) => ({ ...prev, explanation: e.target.value }))}
              rows={2}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={savingQuestion}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingQuestion}
            >
              {savingQuestion ? 'Saving Question...' : editingQuestionId ? 'Update Question' : 'Add Question'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuestionEditor;
