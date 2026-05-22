import React from 'react';

export const Skeleton = ({ type = 'text', count = 1, cols = 4, height, width, style }) => {
  const elements = Array.from({ length: count });

  if (type === 'card') {
    return (
      <>
        {elements.map((_, i) => (
          <div
            key={i}
            className="glass skeleton"
            style={{
              padding: '28px',
              borderRadius: 'var(--radius-lg)',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#cbd5e1',
              opacity: 0.15,
              border: '1px solid var(--border-light)',
              ...style
            }}
          />
        ))}
      </>
    );
  }

  if (type === 'table-row') {
    return (
      <>
        {elements.map((_, i) => (
          <tr key={i} style={{ borderBottom: '1px solid var(--border-light)', ...style }}>
            {Array.from({ length: cols }).map((_, j) => (
              <td key={j} style={{ padding: '16px 12px' }}>
                <div className="skeleton" style={{ height: '18px', width: j === 0 ? '50%' : j === 1 ? '70%' : '35%', borderRadius: '4px' }} />
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  }

  return (
    <>
      {elements.map((_, i) => {
        let className = 'skeleton';
        if (type === 'text') className += ' skeleton-text';
        if (type === 'title') className += ' skeleton-title';
        if (type === 'circle') className += ' skeleton-circle';

        const customStyle = { ...style };
        if (height) customStyle.height = height;
        if (width) customStyle.width = width;

        return <div key={i} className={className} style={customStyle} />;
      })}
    </>
  );
};

export default Skeleton;
