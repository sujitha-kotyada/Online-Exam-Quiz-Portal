import React from 'react';

const QuestionPalette = ({
  questions = [],
  currentIndex = 0,
  answers = {},
  onSelectQuestion
}) => {
  const answeredCount = questions.filter((q) => typeof answers[q._id] === 'string' && answers[q._id].trim()).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--secondary)' }}>
        Question Palette
      </h3>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--success)' }} />
          <span>Answered ({answeredCount})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ffffff', border: '1px solid var(--border)' }} />
          <span>Unanswered ({unansweredCount})</span>
        </div>
      </div>

      <div className="palette-grid">
        {questions.map((q, idx) => {
          const isAnswered = typeof answers[q._id] === 'string' && answers[q._id].trim().length > 0;
          const isCurrent = idx === currentIndex;

          let btnClass = 'palette-btn';
          if (isAnswered) btnClass += ' answered';
          else btnClass += ' unanswered';
          if (isCurrent) btnClass += ' active';

          return (
            <button
              key={q._id || idx}
              type="button"
              className={btnClass}
              onClick={() => onSelectQuestion(idx)}
              aria-label={`Go to question ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionPalette;
