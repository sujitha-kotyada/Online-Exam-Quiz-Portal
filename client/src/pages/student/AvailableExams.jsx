import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { examApi } from '../../api/examApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const AvailableExams = () => {
  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await examApi.getExams();
        setExams(res.exams || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to retrieve available exams');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const filteredExams = exams.filter((exam) => {
    const term = search.toLowerCase();
    return (
      exam.title.toLowerCase().includes(term) ||
      (exam.description && exam.description.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading published exams catalog..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>
            Available Assessments
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Choose an examination to view rules and initiate your timed attempt.
          </p>
        </div>

        <div style={{ maxWidth: '320px', width: '100%' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search exams by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {filteredExams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)' }}>
            No examinations found
          </h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {search ? 'Try clearing your search query.' : 'There are currently no published exams available to take.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredExams.map((exam) => (
            <div key={exam._id} className="card card-hoverable" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge badge-primary">{exam.durationMinutes} Minutes</span>
                  <span className="badge badge-success">Published</span>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>
                  {exam.title}
                </h2>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5, minHeight: '2.7rem' }}>
                  {exam.description || 'No description provided.'}
                </p>

                <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-around', textAlign: 'center', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>{exam.questionCount || 0}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Questions</div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border)' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>{exam.totalMarks || 0}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Total Marks</div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border)' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>{exam.maxAttempts || 1}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Max Attempts</div>
                  </div>
                </div>
              </div>

              <div>
                <Link to={`/student/exams/${exam._id}`} className="btn btn-primary btn-block">
                  View Exam Details &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableExams;
