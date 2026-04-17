import React from 'react';

const QuestionPalette = ({ questions, status, currentIndex, onJump }) => {
  const getStatusColor = (index) => {
    const qId = questions[index]?._id;
    const s = status[qId];
    if (index === currentIndex) return '#1976d2'; // Current is blue/primary
    if (s === 'answered') return '#2e7d32'; // Green
    if (s === 'marked') return '#9c27b0'; // Purple
    if (s === 'visited') return '#d32f2f'; // Red (Visited but not answered)
    return '#f1f5f9'; // Not visited
  };

  const getTextColor = (index) => {
    const qId = questions[index]?._id;
    const s = status[qId];
    if (index === currentIndex || s === 'answered' || s === 'marked' || s === 'visited') return 'white';
    return '#64748b';
  };

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '16px' }}>Question Palette</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
        {questions.map((q, i) => (
          <button
            key={q._id}
            onClick={() => onJump(i)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              background: getStatusColor(i),
              color: getTextColor(i),
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
        <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Legend</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.7rem' }}>
          <LegendItem color="#2e7d32" label="Answered" />
          <LegendItem color="#d32f2f" label="Not Answered" />
          <LegendItem color="#9c27b0" label="Marked" />
          <LegendItem color="#f1f5f9" label="Not Visited" textColor="#64748b" />
          <LegendItem color="#1976d2" label="Current" />
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label, textColor = 'white' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <span style={{ width: '16px', height: '16px', background: color, borderRadius: '2px' }}></span>
    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
  </div>
);

export default QuestionPalette;
