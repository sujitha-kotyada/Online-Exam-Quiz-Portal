import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const CreateEditExam = () => {
  const { examId } = useParams();
  const isEditing = Boolean(examId);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '1. Read each question carefully before answering.\n2. You must complete the exam within the allocated duration.\n3. Your answers are saved automatically as you make choices.\n4. Ensure you submit before time expires.',
    durationMinutes: 30,
    maxAttempts: 1,
    allowAnswerReview: true,
    startTime: '',
    endTime: ''
  });

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchExam = async () => {
        try {
          const res = await examApi.getExamById(examId);
          const e = res.exam;
          setFormData({
            title: e.title || '',
            description: e.description || '',
            instructions: e.instructions || '',
            durationMinutes: e.durationMinutes || 30,
            maxAttempts: e.maxAttempts || 1,
            allowAnswerReview: e.allowAnswerReview !== undefined ? e.allowAnswerReview : true,
            startTime: e.startTime ? new Date(e.startTime).toISOString().slice(0, 16) : '',
            endTime: e.endTime ? new Date(e.endTime).toISOString().slice(0, 16) : ''
          });
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to load exam for editing');
        } finally {
          setLoading(false);
        }
      };

      fetchExam();
    }
  }, [isEditing, examId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        instructions: formData.instructions.trim(),
        durationMinutes: parseInt(formData.durationMinutes, 10),
        maxAttempts: parseInt(formData.maxAttempts, 10),
        allowAnswerReview: formData.allowAnswerReview,
        startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null
      };

      if (isEditing) {
        await examApi.updateExam(examId, payload);
        navigate('/teacher/exams');
      } else {
        const res = await examApi.createExam(payload);
        // After creating, redirect directly to add questions!
        navigate(`/teacher/exams/${res.exam._id}/questions`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading exam settings..." />;
  }

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--secondary)' }}>
            {isEditing ? 'Edit Examination' : 'Author New Examination'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isEditing ? 'Update assessment specifications and review policies.' : 'Configure parameters before populating questions.'}
          </p>
        </div>
        <Link to="/teacher/exams" className="btn btn-secondary btn-sm">
          Cancel &amp; Return
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Exam Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              className="form-input"
              placeholder="e.g. CS301 — Data Structures &amp; Algorithms Midterm"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description &amp; Syllabus Overview</label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              placeholder="Brief summary of topics covered in this examination..."
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="durationMinutes">Duration (Minutes) *</label>
              <input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="1"
                max="300"
                className="form-input"
                value={formData.durationMinutes}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="maxAttempts">Maximum Allowed Attempts *</label>
              <input
                id="maxAttempts"
                name="maxAttempts"
                type="number"
                min="1"
                max="10"
                className="form-input"
                value={formData.maxAttempts}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="startTime">Scheduled Start Time (Optional)</label>
              <input
                id="startTime"
                name="startTime"
                type="datetime-local"
                className="form-input"
                value={formData.startTime}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="endTime">Scheduled End Time (Optional)</label>
              <input
                id="endTime"
                name="endTime"
                type="datetime-local"
                className="form-input"
                value={formData.endTime}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="instructions">Candidate Instructions</label>
            <textarea
              id="instructions"
              name="instructions"
              className="form-textarea"
              value={formData.instructions}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <input
              id="allowAnswerReview"
              name="allowAnswerReview"
              type="checkbox"
              checked={formData.allowAnswerReview}
              onChange={handleChange}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <label htmlFor="allowAnswerReview" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
              <strong>Permit Post-Submission Answer Key &amp; Explanations Review</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                When enabled, students can see correct answers and explanations after submitting. If unchecked, students only see their numerical score and percentage.
              </div>
            </label>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Link to="/teacher/exams" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
            >
              {submitting ? 'Saving Configuration...' : isEditing ? 'Update Exam Settings' : 'Create Exam & Add Questions →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEditExam;
