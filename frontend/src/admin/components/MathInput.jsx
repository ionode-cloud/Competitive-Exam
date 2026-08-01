import { useState, useRef, useCallback } from 'react';

/**
 * MathRenderer - renders question/option/explanation text in all pages.
 * Unicode math (x², √3, π) renders natively - no conversion needed.
 */
export function MathRenderer({ text, className = '' }) {
  if (!text) return null;
  return (
    <span className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {text}
    </span>
  );
}

const MATH_SYMBOLS = [
  { label: 'x²', insert: '²', title: 'Power 2' },
  { label: 'x³', insert: '³', title: 'Power 3' },
  { label: 'xⁿ', insert: 'ⁿ', title: 'Power n' },
  { label: 'x₁', insert: '₁', title: 'Subscript 1' },
  { label: 'x₂', insert: '₂', title: 'Subscript 2' },
  { label: '√', insert: '√', title: 'Square Root' },
  { label: '∛', insert: '∛', title: 'Cube Root' },
  { label: '½', insert: '½', title: 'Half' },
  { label: '¼', insert: '¼', title: 'Quarter' },
  { label: '¾', insert: '¾', title: '3/4' },
  { label: 'π', insert: 'π', title: 'Pi' },
  { label: 'α', insert: 'α', title: 'Alpha' },
  { label: 'β', insert: 'β', title: 'Beta' },
  { label: 'γ', insert: 'γ', title: 'Gamma' },
  { label: 'θ', insert: 'θ', title: 'Theta' },
  { label: 'λ', insert: 'λ', title: 'Lambda' },
  { label: 'μ', insert: 'μ', title: 'Mu' },
  { label: 'σ', insert: 'σ', title: 'sigma' },
  { label: 'Σ', insert: 'Σ', title: 'Sigma' },
  { label: '∫', insert: '∫', title: 'Integral' },
  { label: '∞', insert: '∞', title: 'Infinity' },
  { label: '±', insert: '±', title: 'Plus-Minus' },
  { label: '×', insert: '×', title: 'Multiply' },
  { label: '÷', insert: '÷', title: 'Divide' },
  { label: '≤', insert: '≤', title: 'Less-Equal' },
  { label: '≥', insert: '≥', title: 'Greater-Equal' },
  { label: '≠', insert: '≠', title: 'Not Equal' },
  { label: '≈', insert: '≈', title: 'Approx' },
  { label: '∈', insert: '∈', title: 'Element of' },
  { label: '∩', insert: '∩', title: 'Intersect' },
  { label: '∪', insert: '∪', title: 'Union' },
  { label: '∠', insert: '∠', title: 'Angle' },
  { label: '°', insert: '°', title: 'Degree' },
  { label: '△', insert: '△', title: 'Triangle' },
  { label: '⊥', insert: '⊥', title: 'Perp' },
  { label: '∥', insert: '∥', title: 'Parallel' },
];

export default function MathInput({
  value = '',
  onChange,
  rows = 3,
  placeholder = 'Type or paste content here...',
  required = false,
  singleLine = false,
  defaultShowToolbar = false,
}) {
  const [showToolbar, setShowToolbar] = useState(defaultShowToolbar);
  const inputRef = useRef(null);

  // Smart paste handler: text/plain preserves Unicode (x², π, √)
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const cd = e.clipboardData || window.clipboardData;
    let text = cd.getData('text/plain');
    if (!text) {
      const html = cd.getData('text/html');
      if (html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        text = tmp.textContent || tmp.innerText || '';
      }
    }
    if (!text) return;
    const el = inputRef.current;
    const start = el ? (el.selectionStart ?? value.length) : value.length;
    const end = el ? (el.selectionEnd ?? value.length) : value.length;
    const newVal = value.slice(0, start) + text + value.slice(end);
    onChange(newVal);
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const pos = start + text.length;
        inputRef.current.setSelectionRange(pos, pos);
        inputRef.current.focus();
      }
    });
  }, [value, onChange]);

  const insertSymbol = useCallback((symbol) => {
    const el = inputRef.current;
    const start = el ? (el.selectionStart ?? value.length) : value.length;
    const end = el ? (el.selectionEnd ?? value.length) : value.length;
    const newVal = value.slice(0, start) + symbol + value.slice(end);
    onChange(newVal);
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const pos = start + symbol.length;
        inputRef.current.setSelectionRange(pos, pos);
        inputRef.current.focus();
      }
    });
  }, [value, onChange]);

  return (
    <div className="space-y-1.5">
      <div>
        <button
          type="button"
          onClick={() => setShowToolbar((v) => !v)}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Σ {showToolbar ? 'Hide' : 'Show'} Math Symbols
        </button>
      </div>

      {showToolbar && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-800/80 dark:to-blue-950/20 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 flex-shrink-0 self-center">
            Insert:
          </span>
          {MATH_SYMBOLS.map((s) => (
            <button
              key={s.label + s.insert}
              type="button"
              title={s.title}
              onClick={() => insertSymbol(s.insert)}
              className="px-1.5 py-0.5 rounded text-sm font-bold border transition-all bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 min-w-[28px] text-center"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {singleLine ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          className="admin-input text-sm w-full"
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <textarea
          ref={inputRef}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          className="admin-input text-sm p-3 leading-relaxed w-full"
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  );
}