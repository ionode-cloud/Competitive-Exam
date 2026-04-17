import React from 'react';
import { Timer, FileText, Info } from 'lucide-react';

const ExamHeader = ({ title, timeLeft, onShowInstructions }) => {
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header style={{ 
      height: '64px', 
      background: 'white', 
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
          <span style={{ color: '#ff4d4f' }}>Adda</span>247
        </div>
        <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }}></div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>{title}</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', padding: '6px 12px', borderRadius: '4px', border: '1px solid #fee2e2' }}>
          <Timer size={18} color="#ef4444" />
          <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem', color: '#ef4444' }}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <button 
          onClick={onShowInstructions}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 500 }}
        >
          <Info size={16} /> View Instructions
        </button>
      </div>
    </header>
  );
};

export default ExamHeader;
