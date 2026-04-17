import React from 'react';

const QuestionDisplay = ({ question, index, selectedOption, onSelect }) => {
  if (!question) return null;

  return (
    <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>Question {index + 1}</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Marks: <span style={{ color: 'var(--success)', fontWeight: 600 }}>+{question.marks}</span>, <span style={{ color: 'var(--error)', fontWeight: 600 }}>-0.25</span>
        </div>
      </div>

      <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#1e293b', marginBottom: '32px', whiteSpace: 'pre-wrap' }}>
        {question.text}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {question.options.map((opt, i) => (
          <label 
            key={i}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1.5px solid',
              borderColor: selectedOption === i ? 'var(--primary)' : 'var(--border-light)',
              background: selectedOption === i ? 'var(--primary-light)' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <input 
              type="radio" 
              name={`q-${question._id}`}
              checked={selectedOption === i}
              onChange={() => onSelect(i)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 500, color: selectedOption === i ? 'var(--primary)' : '#475569' }}>
              <span style={{ marginRight: '8px' }}>({String.fromCharCode(65 + i)})</span> {opt}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default QuestionDisplay;
