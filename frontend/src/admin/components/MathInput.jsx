import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Parses rich text / HTML / math into safe React elements.
 * Handles <b>, <u>, <i>, <strong>, <em>, <s>, <sub>, <sup>, <br>, inline styles,
 * while safely preserving underscores (_ , _), blanks (_____), math inequalities, and unicode symbols.
 */
export function parseFormattedText(text) {
  if (!text || typeof text !== 'string') return text;

  // Pre-process markdown **bold** if present (without touching underscores)
  let processed = text.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    try {
      // Replace raw newlines with <br>
      processed = processed.replace(/\r\n|\r|\n/g, '<br>');

      const parser = new DOMParser();
      const doc = parser.parseFromString(processed, 'text/html');

      const renderNode = (node, key) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
          return null;
        }

        const tagName = node.tagName.toLowerCase();
        const children = Array.from(node.childNodes).map((child, idx) =>
          renderNode(child, `${key}-${idx}`)
        );

        if (tagName === 'br') {
          return <br key={key} />;
        }

        const style = {};
        if (node.style) {
          if (node.style.fontWeight) style.fontWeight = node.style.fontWeight;
          if (node.style.textDecoration) style.textDecoration = node.style.textDecoration;
          if (node.style.fontStyle) style.fontStyle = node.style.fontStyle;
          if (node.style.color) style.color = node.style.color;
        }

        if (tagName === 'b' || tagName === 'strong') {
          style.fontWeight = 'bold';
        } else if (tagName === 'u') {
          style.textDecoration = 'underline';
        } else if (tagName === 'i' || tagName === 'em') {
          style.fontStyle = 'italic';
        } else if (tagName === 's' || tagName === 'strike' || tagName === 'del') {
          style.textDecoration = 'line-through';
        } else if (tagName === 'sup') {
          return <sup key={key} style={style}>{children}</sup>;
        } else if (tagName === 'sub') {
          return <sub key={key} style={style}>{children}</sub>;
        }

        if (Object.keys(style).length > 0) {
          return (
            <span key={key} style={style}>
              {children}
            </span>
          );
        }

        return <span key={key}>{children}</span>;
      };

      const result = Array.from(doc.body.childNodes).map((node, idx) =>
        renderNode(node, `root-${idx}`)
      );

      return result.length > 0 ? result : text;
    } catch {
      return text;
    }
  }

  return text;
}

/**
 * MathRenderer - renders question/option/explanation text in all pages with
 * native math symbols (x², √3, π) and bold (<b>) / underline (<u>) / italic (<i>) tags.
 */
export function MathRenderer({ text, className = '', style = {} }) {
  if (!text) return null;
  return (
    <span className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', ...style }}>
      {parseFormattedText(text)}
    </span>
  );
}

export const FormattedText = MathRenderer;

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

/**
 * Clean & normalize rich text HTML for database storage
 */
function cleanHtmlOutput(html) {
  if (!html) return '';
  // Convert empty content or <br> to empty string
  const stripped = html.replace(/<br\s*\/?>/gi, '').replace(/&nbsp;/gi, ' ').trim();
  if (!stripped) return '';
  return html
    .replace(/<div>/gi, '<br>')
    .replace(/<\/div>/gi, '')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '<br>')
    .replace(/<strong>/gi, '<b>')
    .replace(/<\/strong>/gi, '</b>')
    .replace(/<em>/gi, '<i>')
    .replace(/<\/em>/gi, '</i>')
    .replace(/(<br\s*\/?>)+$/i, ''); // trim trailing br
}

export default function MathInput({
  value = '',
  onChange,
  rows = 3,
  placeholder = 'Type or paste content here...',
  required = false,
  singleLine = false,
  defaultShowToolbar = false,
}) {
  const [showMathToolbar, setShowMathToolbar] = useState(defaultShowToolbar);
  const [isRawMode, setIsRawMode] = useState(false);
  const [activeStyles, setActiveStyles] = useState({ bold: false, underline: false, italic: false });
  const editorRef = useRef(null);

  // Sync external `value` prop into the contentEditable div when it changes externally
  useEffect(() => {
    if (!editorRef.current || isRawMode) return;
    const currentHtml = editorRef.current.innerHTML;
    if (value !== currentHtml && (value || currentHtml !== '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isRawMode]);

  // Update active state of Bold/Underline/Italic buttons based on current selection
  const checkActiveStyles = useCallback(() => {
    try {
      setActiveStyles({
        bold: document.queryCommandState('bold'),
        underline: document.queryCommandState('underline'),
        italic: document.queryCommandState('italic'),
      });
    } catch { /* silent */ }
  }, []);

  // Format execution (Bold, Underline, Italic)
  const execFormat = useCallback((command) => {
    if (isRawMode) {
      // Raw HTML mode fallback
      const tag = command === 'bold' ? 'b' : (command === 'underline' ? 'u' : 'i');
      const el = editorRef.current;
      if (!el) return;
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const selected = value.slice(start, end);
      const openTag = `<${tag}>`;
      const closeTag = `</${tag}>`;
      const replacement = selected ? `${openTag}${selected}${closeTag}` : `${openTag}text${closeTag}`;
      const newVal = value.slice(0, start) + replacement + value.slice(end);
      onChange(newVal);
      return;
    }

    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, null);
    checkActiveStyles();
    const clean = cleanHtmlOutput(editorRef.current.innerHTML);
    onChange(clean);
  }, [isRawMode, value, onChange, checkActiveStyles]);

  // Insert Math Symbol at cursor
  const insertSymbol = useCallback((symbol) => {
    if (isRawMode) {
      const el = editorRef.current;
      if (!el) return;
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const newVal = value.slice(0, start) + symbol + value.slice(end);
      onChange(newVal);
      return;
    }

    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertText', false, symbol);
    const clean = cleanHtmlOutput(editorRef.current.innerHTML);
    onChange(clean);
  }, [isRawMode, value, onChange]);

  // Handle contentEditable user input
  const handleInput = useCallback((e) => {
    const rawHtml = e.currentTarget.innerHTML;
    const clean = cleanHtmlOutput(rawHtml);
    onChange(clean);
    checkActiveStyles();
  }, [onChange, checkActiveStyles]);

  // Handle KeyDown shortcuts (Ctrl+B, Ctrl+U, Ctrl+I, Enter in single-line mode)
  const handleKeyDown = useCallback((e) => {
    if (singleLine && e.key === 'Enter') {
      e.preventDefault();
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        execFormat('bold');
      } else if (key === 'u') {
        e.preventDefault();
        execFormat('underline');
      } else if (key === 'i') {
        e.preventDefault();
        execFormat('italic');
      }
    }
  }, [singleLine, execFormat]);

  // Clean paste handler: preserve unicode & formatting
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    if (!text) return;
    document.execCommand('insertText', false, text);
    if (editorRef.current) {
      const clean = cleanHtmlOutput(editorRef.current.innerHTML);
      onChange(clean);
    }
  }, [onChange]);

  const isEmpty = !value || value === '<br>' || value.trim() === '';
  const minHeightPx = singleLine ? 40 : Math.max(76, rows * 26);

  return (
    <div className="space-y-1.5">
      {/* ── Action Formatting Bar: Bold, Underline, Italic & Math Symbols ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-0.5">
        <div className="flex items-center gap-1.5">
          {/* Bold Button */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat('bold'); }}
            title="Bold (Ctrl+B) — Changes font to bold directly in editor"
            className={`px-3 py-1 rounded-md text-xs font-black border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              activeStyles.bold
                ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-600 dark:border-blue-500'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 dark:hover:bg-blue-950/40'
            }`}
          >
            <span className="font-extrabold text-sm leading-none">B</span>
            <span className="text-[11px] font-bold">Bold</span>
          </button>

          {/* Underline Button */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat('underline'); }}
            title="Underline (Ctrl+U) — Changes font to underline directly in editor"
            className={`px-3 py-1 rounded-md text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              activeStyles.underline
                ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-600 dark:border-blue-500'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 dark:hover:bg-blue-950/40'
            }`}
          >
            <span className="font-bold underline text-sm leading-none">U</span>
            <span className="text-[11px] font-bold">Underline</span>
          </button>

          {/* Italic Button */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); execFormat('italic'); }}
            title="Italic (Ctrl+I) — Changes font to italic directly in editor"
            className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
              activeStyles.italic
                ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-600 dark:border-blue-500'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 dark:hover:bg-blue-950/40'
            }`}
          >
            <span className="italic font-serif text-sm leading-none">I</span>
            <span className="text-[11px] font-semibold hidden sm:inline">Italic</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Math Symbols Toggle */}
          <button
            type="button"
            onClick={() => setShowMathToolbar((v) => !v)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
          >
            <span className="font-mono font-bold">Σ</span> {showMathToolbar ? 'Hide Symbols' : 'Math Symbols'}
          </button>

          {/* Raw Code Toggle */}
          <button
            type="button"
            onClick={() => setIsRawMode((v) => !v)}
            title="Switch between Visual Rich Text and Raw HTML mode"
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            {isRawMode ? '👁 Visual' : '</> HTML'}
          </button>
        </div>
      </div>

      {/* ── Expandable Math Symbols Bar ── */}
      {showMathToolbar && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-800/80 dark:to-blue-950/20 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 flex-shrink-0 self-center">
            Symbols:
          </span>
          {MATH_SYMBOLS.map((s) => (
            <button
              key={s.label + s.insert}
              type="button"
              title={s.title}
              onMouseDown={(e) => { e.preventDefault(); insertSymbol(s.insert); }}
              className="px-1.5 py-0.5 rounded text-sm font-bold border transition-all bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 min-w-[28px] text-center shadow-xs cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* ── WYSIWYG ContentEditable Rich Text Area (Font changes live) ── */}
      {!isRawMode ? (
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onKeyUp={checkActiveStyles}
            onMouseUp={checkActiveStyles}
            onPaste={handlePaste}
            style={{ minHeight: `${minHeightPx}px` }}
            className={`admin-input text-sm p-3 leading-relaxed w-full outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
              singleLine ? 'overflow-x-auto whitespace-nowrap' : 'overflow-y-auto'
            }`}
          />
          {/* Placeholder overlay when editor is empty */}
          {isEmpty && (
            <div
              onClick={() => editorRef.current && editorRef.current.focus()}
              className="absolute top-3 left-3 text-slate-400 dark:text-slate-500 text-sm pointer-events-none select-none"
            >
              {placeholder}
            </div>
          )}
        </div>
      ) : (
        /* Raw HTML text edit mode */
        <textarea
          ref={editorRef}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="admin-input font-mono text-xs p-3 leading-relaxed w-full"
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  );
}