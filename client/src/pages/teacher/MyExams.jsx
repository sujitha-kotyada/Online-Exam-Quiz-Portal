import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const MyExams = () => {
  const [exams, setExams] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'published' | 'draft'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModalExam, setDeleteModalExam] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const fetchExams = async () => {
    try {
      const res = await examApi.getExams();
      setExams(res.exams || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exams');
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

  const handleDeleteExam = async () => {
    if (!deleteModalExam) return;
    setDeleting(true);
    try {
      await examApi.deleteExam(deleteModalExam._id);
      setDeleteModalExam(null);
      await fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete exam');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading authored exams..." />;
  }

  const filteredExams = exams.filter((exam) => {
    const matchesFilter = filter === 'all' || exam.status === filter;
    const matchesSearch =
      exam.title.toLowerCase().includes(search.toLowerCase()) ||
      (exam.description && exam.description.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>
            My Authored Examinations
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage exam settings, author questions, monitor attempts, and view submission analytics.
          </p>
        </div>
        <Link to="/teacher/exams/create" className="btn btn-primary">
          + Create New Exam
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter and Search Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All ({exams.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'published' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('published')}
          >
            Published ({exams.filter((e) => e.status === 'published').length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'draft' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('draft')}
          >
            Drafts ({exams.filter((e) => e.status === 'draft').length})
          </button>
        </div>

        <div style={{ maxWidth: '300px', width: '100%' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search exams by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Exams Table */}
      <div className="card">
        {filteredExams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
            <p>No exams match the selected criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title &amp; Info</th>
                  <th>Questions</th>
                  <th>Duration</th>
                  <th>Max Attempts</th>
                  <th>Status</th>
                  <th>Submissions</th>
                  <th>Operations</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((exam) => (
                  <tr key={exam._id}>
                    <td>
                      <strong style={{ fontSize: '1rem', color: 'var(--secondary)' }}>{exam.title}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Created: {new Date(exam.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{exam.questionCount || 0}</span> questions
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exam.totalMarks || 0} marks</div>
                    </td>
                    <td>{exam.durationMinutes} mins</td>
                    <td>{exam.maxAttempts || 1}</td>
                    <td>
                      <span className={`badge ${exam.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{exam.attemptCount || 0}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <Link to={`/teacher/exams/${exam._id}/questions`} className="btn btn-secondary btn-sm" title="Edit Question Bank">
                          Questions
                        </Link>
                        <Link to={`/teacher/exams/${exam._id}/edit`} className="btn btn-secondary btn-sm" title="Edit Exam Metadata">
                          Edit
                        </Link>
                        <Link to={`/teacher/exams/${exam._id}/preview`} className="btn btn-secondary btn-sm" title="Preview Student View">
                          Preview
                        </Link>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleTogglePublish(exam._id)}
                          title={exam.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {exam.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <Link to={`/teacher/exams/${exam._id}/results`} className="btn btn-secondary btn-sm" title="Analytics & Submissions">
                          Results
                        </Link>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => setDeleteModalExam(exam)}
                          title="Delete Exam"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Exam Confirmation Modal */}
      <Modal
        isOpen={!!deleteModalExam}
        onClose={() => setDeleteModalExam(null)}
        title="Confirm Exam Deletion"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeleteModalExam(null)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteExam}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Exam & All Associated Data'}
            </button>
          </>
        }
      >
        <p style={{ lineHeight: 1.6 }}>
          Are you sure you want to permanently delete <strong>{deleteModalExam?.title}</strong>?
        </p>
        <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 500 }}>
          ⚠️ Warning: This will cascade delete all questions, active student attempts, and recorded results for this examination. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default MyExams;
