import React from 'react';
import { ChevronLeft, ChevronRight, Bookmark, Trash2, Send } from 'lucide-react';

const ExamFooter = ({ onPrevious, onNext, onMark, onClear, onSubmit, isFirst, isLast }) => {
  return (
    <footer style={{ 
      height: '64px', 
      background: 'white', 
      borderTop: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      bottom: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn btn-outline" onClick={onMark} style={{ color: 'var(--purple)', borderColor: 'var(--purple)' }}>
          <Bookmark size={18} /> Mark for Review
        </button>
        <button className="btn btn-outline" onClick={onClear} style={{ color: 'var(--text-muted)', borderColor: 'var(--border-light)' }}>
          <Trash2 size={18} /> Clear Response
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button 
          className="btn btn-outline" 
          onClick={onPrevious} 
          disabled={isFirst}
          style={{ opacity: isFirst ? 0.5 : 1, cursor: isFirst ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeft size={18} /> Previous
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          {isLast ? 'Save & Finish' : 'Save & Next'} <ChevronRight size={18} />
        </button>
        <div style={{ width: '1px', height: '24px', background: 'var(--border-light)', margin: '0 8px' }}></div>
        <button className="btn btn-primary" onClick={onSubmit} style={{ background: '#ef4444' }}>
          <Send size={18} /> Submit Test
        </button>
      </div>
    </footer>
  );
};

export default ExamFooter;
