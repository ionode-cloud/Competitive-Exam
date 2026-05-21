import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { FileText, Globe, Save, ChevronDown, CheckCircle, AlertCircle, BookOpen, Eye, ListPlus, Trash2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5117';

const ALL_LANGUAGES = ['English', 'Hindi', 'Odia'];

const DEFAULT_INSTRUCTIONS = {
  English: `1. You have the allotted duration to complete the test.
2. The test contains multiple sections. Read each question carefully before answering.
3. There is only one correct answer to each question. Click on the most appropriate option to mark it as your answer.
4. You will be awarded marks for each correct answer as mentioned.
5. There may be a penalty for each wrong answer (negative marking as set).
6. You can change your answer by clicking on another option.
7. You can unmark your answer by clicking the "Clear Response" button.
8. You can access questions in any order by clicking on the question number in the panel.
9. The countdown timer at the top will display remaining time. When it reaches zero, the exam ends automatically.
10. Do not refresh or close the browser during the examination.`,

  Hindi: `1. आपके पास परीक्षा पूरी करने के लिए निर्धारित समय है।
2. परीक्षा में कई खंड हैं। प्रत्येक प्रश्न को ध्यान से पढ़ें।
3. प्रत्येक प्रश्न का केवल एक सही उत्तर है। सबसे उपयुक्त विकल्प पर क्लिक करें।
4. प्रत्येक सही उत्तर के लिए निर्धारित अंक मिलेंगे।
5. गलत उत्तर पर नकारात्मक अंकन लागू हो सकता है।
6. आप किसी अन्य विकल्प पर क्लिक करके अपना उत्तर बदल सकते हैं।
7. "Clear Response" बटन दबाकर आप अपना उत्तर हटा सकते हैं।
8. प्रश्न पैनल पर नंबर क्लिक करके किसी भी प्रश्न पर जा सकते हैं।
9. शीर्ष पर काउंटडाउन टाइमर बचा हुआ समय दिखाएगा। जीरो होने पर परीक्षा स्वतः समाप्त होगी।
10. परीक्षा के दौरान ब्राउज़र रिफ्रेश या बंद न करें।`,

  Odia: `1. ଆପଣଙ୍କ ପାଖରେ ପରୀକ୍ଷା ସଂପୂର୍ଣ୍ଣ କରିବା ପାଇଁ ନିର୍ଦ୍ଧାରିତ ସମୟ ଅଛି।
2. ପ୍ରତ୍ୟେକ ପ୍ରଶ୍ନ ଧ୍ୟାନର ସହ ପଢ଼ନ୍ତୁ।
3. ପ୍ରତ୍ୟେକ ପ୍ରଶ୍ନର ମାତ୍ର ଗୋଟିଏ ସଠିକ ଉତ୍ତର ଅଛି।
4. ପ୍ରତ୍ୟେକ ସଠିକ ଉତ୍ତର ପାଇଁ ନିର୍ଦ୍ଧାରିତ ନମ୍ବର ମିଳିବ।
5. ଭୁଲ ଉତ୍ତର ପାଇଁ ନକାରାତ୍ମକ ମାର୍କିଂ ଲାଗୁ ହୋଇ ପାରେ।
6. ଅନ୍ୟ ବିକଳ୍ପ ଉପରେ କ୍ଲିକ୍ କରି ଆପଣ ଉତ୍ତର ବଦଳାଇ ପାରିବେ।
7. "Clear Response" ବଟନ୍ ଦ୍ୱାରା ଉତ୍ତର ଖାଲି କରିପାରିବେ।
8. ପ୍ୟାନେଲ୍‌ରେ ଥିବା ପ୍ରଶ୍ନ ନମ୍ବର ଉପରେ କ୍ଲିକ୍ କରି ଯେ କୌଣସି ପ୍ରଶ୍ନକୁ ଯାଇ ପାରିବେ।
9. ଉପର ଟାଇମର ବଳକା ସମୟ ଦେଖାଇବ। ଶୂନ୍ୟ ହେଲେ ପରୀକ୍ଷା ସ୍ୱୟଂଭାବରେ ଶେଷ ହେବ।
10. ପରୀକ୍ଷା ସମୟରେ ବ୍ରାଉଜର ରିଫ୍ରେସ୍ ବା ବନ୍ଦ କରନ୍ତୁ ନାହିଁ।`
};

const LANG_FLAGS = { English: '🇬🇧', Hindi: '🇮🇳', Odia: '🏵️' };

/* Parse text into numbered lines for preview */
const parseLines = (text) => {
  if (!text?.trim()) return [];
  return text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(l => l.replace(/^\d+[.):\-]\s*/, ''));
};

const DICT = {
  English: {
    sno: 'S.No.',
    sections: 'Sections',
    noOfQuestions: 'No. of Questions',
    maxMarks: 'Maximum Marks',
    duration: 'Duration',
    total: 'Total',
    minutes: 'minutes',
  },
  Hindi: {
    sno: 'क्र.सं.',
    sections: 'अनुभाग',
    noOfQuestions: 'प्रश्नों की संख्या',
    maxMarks: 'अधिकतम अंक',
    duration: 'अवधि',
    total: 'कुल',
    minutes: 'मिनट',
  },
  Odia: {
    sno: 'କ୍ରମିକ ସଂଖ୍ୟା',
    sections: 'ବିଭାଗ',
    noOfQuestions: 'ପ୍ରଶ୍ନ ସଂଖ୍ୟା',
    maxMarks: 'ସର୍ବାଧିକ ମାର୍କ',
    duration: 'ସମୟ',
    total: 'ମୋଟ',
    minutes: 'ମିନିଟ୍',
  }
};

const SECTION_TRANSLATIONS = {
  English: {
    'English Language': 'English Language',
    'Numerical Ability': 'Numerical Ability',
    'Reasoning Ability': 'Reasoning Ability',
    'English': 'English',
    'Reasoning': 'Reasoning',
    'Quant': 'Quant',
    'General': 'General',
  },
  Hindi: {
    'English Language': 'अंग्रेजी भाषा',
    'Numerical Ability': 'संख्यात्मक अभियोग्यता',
    'Reasoning Ability': 'तार्किक क्षमता',
    'English': 'अंग्रेजी',
    'Reasoning': 'तर्कशक्ति',
    'Quant': 'मात्रात्मक अभियोग्यता',
    'General': 'सामान्य',
  },
  Odia: {
    'English Language': 'ଇଂରାଜୀ ଭାଷା',
    'Numerical Ability': 'ସଂଖ୍ୟାତ୍ମକ ଯୋଗ୍ୟତା',
    'Reasoning Ability': 'ତାର୍କିକ କ୍ଷମତା',
    'English': 'ଇଂରାଜୀ',
    'Reasoning': 'ତର୍କଶକ୍ତି',
    'Quant': 'ଗଣିତ',
    'General': 'ସାଧାରଣ',
  }
};

/* Build section-level stats from populated questions array and total duration */
const buildSections = (questions = [], totalDuration = 0) => {
  const map = {};
  questions.forEach(q => {
    const sec = q.section || 'General';
    if (!map[sec]) map[sec] = { count: 0, marks: 0 };
    map[sec].count += 1;
    map[sec].marks += (q.marks || 1);
  });
  
  const sectionList = Object.entries(map).map(([name, val], idx) => ({
    id: idx + 1,
    name,
    questions: val.count,
    marks: val.marks,
  }));

  if (sectionList.length > 0 && totalDuration > 0) {
    const baseDuration = Math.floor(totalDuration / sectionList.length);
    const remainder = totalDuration % sectionList.length;
    sectionList.forEach((sec, idx) => {
      sec.duration = baseDuration + (idx < remainder ? 1 : 0);
    });
  } else {
    sectionList.forEach(sec => {
      sec.duration = 0;
    });
  }

  return sectionList;
};

const Instructions = () => {
  const [exams, setExams]               = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [activeTab, setActiveTab]       = useState('English');
  const [showPreview, setShowPreview]   = useState(false);
  const [toast, setToast]               = useState(null);

  const [languages, setLanguages]       = useState(['English', 'Hindi', 'Odia']);
  const [instructions, setInstructions] = useState({
    English: DEFAULT_INSTRUCTIONS.English,
    Hindi:   DEFAULT_INSTRUCTIONS.Hindi,
    Odia:    DEFAULT_INSTRUCTIONS.Odia,
  });

  const [hasManualTable, setHasManualTable] = useState(false);
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [editableSections, setEditableSections] = useState([]);
  const [previewAccepted, setPreviewAccepted] = useState(false);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Load exam list ── */
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get(`${API}/api/exams`);
        setExams(res.data);
        if (res.data.length > 0) setSelectedExamId(res.data[0]._id);
      } catch {
        showToast('error', 'Failed to load exams.');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  /* ── Load instructions for selected exam ── */
  useEffect(() => {
    if (!selectedExamId) return;
    const fetchInstructions = async () => {
      try {
        const res = await axios.get(`${API}/api/exams/${selectedExamId}/instructions`);
        setSelectedExam(res.data);
        const langs = res.data.languages?.length ? res.data.languages : ['English', 'Hindi', 'Odia'];
        setLanguages(langs);
        setActiveTab(langs[0]);
        // Load saved custom text, fall back to defaults only if empty
        setInstructions({
          English: res.data.instructions?.English || '',
          Hindi:   res.data.instructions?.Hindi   || '',
          Odia:    res.data.instructions?.Odia    || '',
        });

        if (res.data.customSections && res.data.customSections.length > 0) {
          setHasManualTable(true);
          setEditableSections(res.data.customSections.map((s, idx) => ({ ...s, id: idx + 1 })));
        } else {
          setHasManualTable(false);
          const duration = res.data.duration || 0;
          const calc = buildSections(res.data.questions || [], duration);
          setEditableSections(calc);
        }
        setIsEditingTable(false);
      } catch {
        showToast('error', 'Failed to load exam instructions.');
      }
    };
    fetchInstructions();
  }, [selectedExamId]);

  const toggleLanguage = (lang) => {
    setLanguages(prev => {
      if (prev.includes(lang)) {
        if (prev.length === 1) return prev;
        const next = prev.filter(l => l !== lang);
        if (activeTab === lang) setActiveTab(next[0]);
        return next;
      }
      return [...prev, lang];
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const adminToken = JSON.parse(localStorage.getItem('admin')).token;
      
      const payload = {
        instructions,
        languages,
        customSections: hasManualTable ? editableSections.map(({ id, ...rest }) => rest) : []
      };

      await axios.put(
        `${API}/api/exams/${selectedExamId}/instructions`,
        payload,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      showToast('success', '✅ Instructions saved! Students will see your custom text.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setInstructions(prev => ({ ...prev, [activeTab]: DEFAULT_INSTRUCTIONS[activeTab] }));
  };

  const clearText = () => {
    setInstructions(prev => ({ ...prev, [activeTab]: '' }));
  };

  const handleUpdateSectionRow = (id, field, value) => {
    setEditableSections(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleDeleteSectionRow = (id) => {
    setEditableSections(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return filtered.map((s, idx) => ({ ...s, id: idx + 1 }));
    });
  };

  const handleAddSectionRow = () => {
    setEditableSections(prev => [
      ...prev,
      {
        id: prev.length + 1,
        name: `Section ${prev.length + 1}`,
        questions: 0,
        marks: 0,
        duration: 0
      }
    ]);
  };

  const handleResetToCalculated = () => {
    if (window.confirm('Are you sure you want to discard manual customization and reset to question-based auto-calculated table?')) {
      const calc = buildSections(selectedExam?.questions || [], selectedExam?.duration || 0);
      setEditableSections(calc);
      setHasManualTable(false);
      setIsEditingTable(false);
    }
  };

  const totalQuestions = selectedExam?.questions?.length || 0;
  const totalMarks     = selectedExam?.totalMarks || 0;
  const duration       = selectedExam?.duration || 0;

  const sections = hasManualTable
    ? editableSections
    : buildSections(selectedExam?.questions || [], duration);

  const displayedTotalQuestions = hasManualTable
    ? editableSections.reduce((sum, s) => sum + (Number(s.questions) || 0), 0)
    : totalQuestions;

  const displayedTotalMarks = hasManualTable
    ? editableSections.reduce((sum, s) => sum + (Number(s.marks) || 0), 0)
    : totalMarks;

  const displayedDuration = hasManualTable
    ? editableSections.reduce((sum, s) => sum + (Number(s.duration) || 0), 0)
    : duration;

  const dict           = DICT[activeTab] || DICT.English;

  /* Preview lines for active tab */
  const previewText  = instructions[activeTab];
  const previewLines = previewText?.trim()
    ? parseLines(previewText)
    : parseLines(DEFAULT_INSTRUCTIONS[activeTab]);
  const isCustom = !!(previewText?.trim());

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
          Loading exams…
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 22px', borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', fontWeight: 600, fontSize: '0.9rem',
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        .lang-toggle-btn  { transition: all 0.2s; }
        .lang-toggle-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .lang-tab         { transition: all 0.2s; cursor: pointer; border: none; }
        .lang-tab:hover   { background: rgba(37,99,235,0.07) !important; }
        .inst-textarea    { transition: border-color 0.2s, box-shadow 0.2s; }
        .inst-textarea:focus { outline: none; border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
        .preview-li       { transition: background 0.15s; }
        .preview-li:hover { background: #f0f7ff; }

        /* ── Sections Table inside Admin Preview ── */
        .ei-table-wrap {
          padding: 0 0 14px;
          overflow-x: auto;
        }
        .ei-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
          border: 1px solid #c5ccd6;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .ei-table thead tr {
          background: #2c3e50;
          color: #ffffff;
        }
        .ei-table thead th {
          padding: 8px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 0.8rem;
          border-right: 1px solid rgba(255,255,255,0.12);
        }
        .ei-table thead th:last-child {
          border-right: none;
        }
        .ei-table tbody td {
          padding: 8px 12px;
          border: 1px solid #dde3eb;
          color: #374151;
        }
        .ei-row-even {
          background: #f7f9fc;
        }
        .ei-row-odd {
          background: #ffffff;
        }
        .ei-row-total td {
          background: #edf2f7;
          font-weight: 600;
          color: #1e293b;
          border-top: 2px solid #c5ccd6;
        }

        /* ── Bottom Section inside Admin Preview ── */
        .ei-lang-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 4px 2px;
          flex-wrap: wrap;
        }
        .ei-lang-label {
          font-size: 0.875rem;
          color: #374151;
          white-space: nowrap;
          font-weight: 500;
        }
        .ei-lang-select {
          min-width: 130px;
          font-size: 0.82rem;
          padding: 4px 8px;
          border: 1px solid #c8cfd8;
          border-radius: 4px;
          background: #ffffff;
          color: #1e293b;
          cursor: pointer;
          outline: none;
        }
        .ei-lang-note {
          font-size: 0.8rem;
          color: #2980b9;
          font-style: italic;
          padding: 4px 4px 2px;
          margin: 0;
        }
        .ei-declaration {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin: 10px 4px 4px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 10px 12px;
        }
        .ei-declaration input[type="checkbox"] {
          margin-top: 3px;
          width: 15px;
          height: 15px;
          cursor: pointer;
          accent-color: #2980b9;
          flex-shrink: 0;
        }
        .ei-declaration label {
          font-size: 0.8rem;
          line-height: 1.55;
          color: #374151;
          cursor: pointer;
        }
      `}</style>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={28} color="var(--primary, #2563eb)" />
            Exam Instructions
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Write custom instructions per language for each exam. Students see these before starting.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowPreview(p => !p)}
            disabled={!selectedExamId}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              height: '44px', padding: '0 20px', borderRadius: '10px',
              border: '1.5px solid var(--border-light, #e2e8f0)',
              background: showPreview ? '#eff6ff' : 'white',
              color: showPreview ? '#2563eb' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
              opacity: !selectedExamId ? 0.5 : 1
            }}
          >
            <Eye size={16} /> {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedExamId}
            className="btn btn-primary"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              height: '44px', padding: '0 28px',
              opacity: saving || !selectedExamId ? 0.6 : 1,
              cursor: saving || !selectedExamId ? 'not-allowed' : 'pointer'
            }}
          >
            <Save size={18} />
            {saving ? 'Saving…' : 'Save Instructions'}
          </button>
        </div>
      </div>

      {/* ── Exam Selector ── */}
      <div className="glass" style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <BookOpen size={20} color="var(--primary, #2563eb)" />
          <label style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>Select Exam:</label>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              style={{
                width: '100%', padding: '10px 40px 10px 16px',
                borderRadius: '10px', border: '1.5px solid var(--border-light, #e2e8f0)',
                fontSize: '0.95rem', fontWeight: 500, background: 'white',
                appearance: 'none', cursor: 'pointer', color: 'var(--text-main, #1e293b)'
              }}
            >
              <option value="">-- Select an exam --</option>
              {exams.map(ex => (
                <option key={ex._id} value={ex._id}>{ex.subjectName} – {ex.topicName}</option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
          </div>
          {selectedExam && (
            <span style={{ padding: '5px 14px', borderRadius: '20px', background: '#eff6ff', color: '#2563eb', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {selectedExam.topicName}
            </span>
          )}
        </div>
      </div>

      {selectedExamId && (
        <>
          {/* ── Language Toggle ── */}
          <div className="glass" style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Globe size={18} color="var(--primary, #2563eb)" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Available Languages for Students</h3>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              {ALL_LANGUAGES.map(lang => {
                const isEnabled = languages.includes(lang);
                return (
                  <button
                    key={lang}
                    className="lang-toggle-btn"
                    onClick={() => toggleLanguage(lang)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 22px', borderRadius: '10px',
                      border: `2px solid ${isEnabled ? '#2563eb' : '#e2e8f0'}`,
                      background: isEnabled ? '#2563eb' : 'white',
                      color: isEnabled ? 'white' : '#64748b',
                      fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{LANG_FLAGS[lang]}</span>
                    {lang}
                    {isEnabled && <CheckCircle size={15} />}
                  </button>
                );
              })}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                Students will choose from: <strong>{languages.join(', ')}</strong>
              </span>
            </div>
          </div>

          {/* ── Exam Structure & Section Details (Mark Table & Duration) ── */}
          {selectedExam && sections.length > 0 && (
            <div className="glass" style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ListPlus size={18} color="var(--primary, #2563eb)" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Exam Structure & Section Details (Marks Table & Durations)</h3>
                </div>
                {/* Stats */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '5px 12px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>
                    Total Questions: <strong>{displayedTotalQuestions}</strong>
                  </span>
                  <span style={{ padding: '5px 12px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>
                    Maximum Marks: <strong>{displayedTotalMarks}</strong>
                  </span>
                  <span style={{ padding: '5px 12px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>
                    Exam Duration: <strong>{displayedDuration} mins</strong>
                  </span>
                  {selectedExam.negativeMarking > 0 && (
                    <span style={{ padding: '5px 12px', borderRadius: '6px', background: '#fee2e2', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
                      Negative Marking: <strong>−{selectedExam.negativeMarking}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Sections Table */}
              <div className="ei-table-wrap" style={{ paddingBottom: 0 }}>
                <table className="ei-table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>{dict.sno}</th>
                      <th>{dict.sections}</th>
                      <th style={{ width: '180px' }}>{dict.noOfQuestions}</th>
                      <th style={{ width: '180px' }}>{dict.maxMarks}</th>
                      <th style={{ width: '180px' }}>{dict.duration}</th>
                      {isEditingTable && <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((sec, idx) => {
                      if (isEditingTable) {
                        return (
                          <tr key={sec.id} className={idx % 2 === 0 ? 'ei-row-even' : 'ei-row-odd'}>
                            <td>{sec.id}</td>
                            <td>
                              <input
                                type="text"
                                value={sec.name}
                                onChange={e => handleUpdateSectionRow(sec.id, 'name', e.target.value)}
                                style={{
                                  width: '100%', padding: '6px 10px',
                                  borderRadius: '6px', border: '1px solid #cbd5e1',
                                  fontSize: '0.82rem', boxSizing: 'border-box'
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={sec.questions}
                                onChange={e => handleUpdateSectionRow(sec.id, 'questions', parseInt(e.target.value) || 0)}
                                style={{
                                  width: '100%', padding: '6px 10px',
                                  borderRadius: '6px', border: '1px solid #cbd5e1',
                                  fontSize: '0.82rem', boxSizing: 'border-box'
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={sec.marks}
                                onChange={e => handleUpdateSectionRow(sec.id, 'marks', parseFloat(e.target.value) || 0)}
                                style={{
                                  width: '100%', padding: '6px 10px',
                                  borderRadius: '6px', border: '1px solid #cbd5e1',
                                  fontSize: '0.82rem', boxSizing: 'border-box'
                                }}
                              />
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="number"
                                  value={sec.duration}
                                  onChange={e => handleUpdateSectionRow(sec.id, 'duration', parseInt(e.target.value) || 0)}
                                  style={{
                                    width: '80px', padding: '6px 10px',
                                    borderRadius: '6px', border: '1px solid #cbd5e1',
                                    fontSize: '0.82rem', boxSizing: 'border-box'
                                  }}
                                />
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{dict.minutes}</span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteSectionRow(sec.id)}
                                style={{
                                  border: 'none', background: 'transparent',
                                  color: '#ef4444', cursor: 'pointer',
                                  padding: '4px', display: 'inline-flex',
                                  alignItems: 'center', justifyContent: 'center'
                                }}
                                title="Delete Section"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      const translatedSecName = SECTION_TRANSLATIONS[activeTab]?.[sec.name] || sec.name;
                      return (
                        <tr key={sec.id} className={idx % 2 === 0 ? 'ei-row-even' : 'ei-row-odd'}>
                          <td>{sec.id}</td>
                          <td style={{ fontWeight: 500 }}>{translatedSecName}</td>
                          <td>{sec.questions}</td>
                          <td>{sec.marks}</td>
                          <td>{sec.duration} {dict.minutes}</td>
                        </tr>
                      );
                    })}
                    <tr className="ei-row-total">
                      <td></td>
                      <td><strong>{dict.total}</strong></td>
                      <td><strong>{displayedTotalQuestions}</strong></td>
                      <td><strong>{displayedTotalMarks}</strong></td>
                      <td><strong>{displayedDuration} {dict.minutes}</strong></td>
                      {isEditingTable && <td></td>}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table Customization Controls */}
              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!hasManualTable ? (
                    <button
                      onClick={() => {
                        setHasManualTable(true);
                        setIsEditingTable(true);
                      }}
                      style={{
                        padding: '8px 16px', borderRadius: '8px',
                        border: '1.5px solid var(--primary, #2563eb)',
                        background: 'white', color: 'var(--primary, #2563eb)',
                        fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer'
                      }}
                    >
                      ✏️ Customize Table
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditingTable(p => !p)}
                        style={{
                          padding: '8px 16px', borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          background: isEditingTable ? '#eff6ff' : 'white',
                          color: isEditingTable ? '#2563eb' : '#334155',
                          fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer'
                        }}
                      >
                        {isEditingTable ? 'Done Editing' : '✏️ Edit Table'}
                      </button>
                      {isEditingTable && (
                        <button
                          onClick={handleAddSectionRow}
                          style={{
                            padding: '8px 16px', borderRadius: '8px',
                            border: '1.5px solid #10b981',
                            background: 'white', color: '#10b981',
                            fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer'
                          }}
                        >
                          ➕ Add Section
                        </button>
                      )}
                      <button
                        onClick={handleResetToCalculated}
                        style={{
                          padding: '8px 16px', borderRadius: '8px',
                          border: '1.5px solid #ef4444',
                          background: 'white', color: '#ef4444',
                          fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer'
                        }}
                      >
                        🔄 Reset to Auto-Calculated
                      </button>
                    </>
                  )}
                </div>
                {hasManualTable && (
                  <span style={{
                    fontSize: '0.78rem', color: '#166534',
                    background: '#dcfce7', padding: '6px 12px',
                    borderRadius: '12px', fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}>
                    ⚙️ Custom Table Mode Active (Click "Save Instructions" to persist)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Editor + Optional Preview (side by side when preview on) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr', gap: '20px' }}>

            {/* Editor Panel */}
            <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--primary, #2563eb)" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Instruction Text Editor</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={resetToDefault} style={{ padding: '6px 14px', borderRadius: '7px', border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                    ↩ Load Default
                  </button>
                  <button onClick={clearText} style={{ padding: '6px 14px', borderRadius: '7px', border: '1.5px solid #fecaca', background: '#fef2f2', color: '#ef4444', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                    🗑 Clear
                  </button>
                </div>
              </div>

              {/* Language Tabs */}
              <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', borderBottom: '2px solid #e2e8f0' }}>
                {ALL_LANGUAGES.map(lang => {
                  const isActive  = activeTab === lang;
                  const isEnabled = languages.includes(lang);
                  const hasText   = !!(instructions[lang]?.trim());
                  return (
                    <button
                      key={lang}
                      className="lang-tab"
                      onClick={() => setActiveTab(lang)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '9px 18px', borderRadius: '8px 8px 0 0',
                        borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                        background: isActive ? 'rgba(37,99,235,0.07)' : 'transparent',
                        color: isActive ? '#2563eb' : isEnabled ? '#1e293b' : '#94a3b8',
                        fontWeight: isActive ? 700 : 600, fontSize: '0.88rem',
                        opacity: isEnabled ? 1 : 0.45, marginBottom: '-2px'
                      }}
                    >
                      {LANG_FLAGS[lang]} {lang}
                      {hasText && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} title="Has custom text" />}
                      {!isEnabled && <span style={{ fontSize: '0.62rem', background: '#f1f5f9', color: '#94a3b8', padding: '1px 5px', borderRadius: '8px' }}>off</span>}
                    </button>
                  );
                })}
              </div>

              {/* Hint */}
              <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#64748b' }}>
                💡 Write each instruction on a new line. You can start lines with numbers (1. 2. 3.) or just write plain text — both work.
              </p>

              {/* Textarea */}
              <div style={{ position: 'relative' }}>
                <textarea
                  className="inst-textarea"
                  value={instructions[activeTab] || ''}
                  onChange={e => setInstructions(prev => ({ ...prev, [activeTab]: e.target.value }))}
                  rows={20}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '10px',
                    border: '1.5px solid #e2e8f0', fontSize: '0.9rem', lineHeight: '1.8',
                    fontFamily: activeTab === 'English'
                      ? "'Inter','Segoe UI',Arial,sans-serif"
                      : "'Noto Sans Devanagari','Noto Sans Oriya','Noto Sans',Arial,sans-serif",
                    resize: 'vertical', background: '#fafbfc',
                    boxSizing: 'border-box', color: '#1e293b'
                  }}
                  placeholder={`Type ${activeTab} instructions here…\n\nExample:\n1. You have 60 minutes to complete this exam.\n2. Each question carries 1 mark.\n3. No negative marking.`}
                />
                <div style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '0.72rem', color: '#94a3b8', pointerEvents: 'none' }}>
                  {(instructions[activeTab] || '').length} chars • {(instructions[activeTab] || '').split('\n').filter(l => l.trim()).length} lines
                </div>
              </div>

              {!languages.includes(activeTab) && (
                <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', background: '#fef9c3', border: '1px solid #fde047', color: '#854d0e', fontSize: '0.83rem', fontWeight: 600 }}>
                  ⚠️ This language is <strong>disabled</strong>. Enable it above so students can see these instructions.
                </div>
              )}
            </div>

            {/* ── Live Preview Panel ── */}
            {showPreview && (
              <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Eye size={18} color="var(--primary, #2563eb)" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Student Preview — {LANG_FLAGS[activeTab]} {activeTab}</h3>
                  <span style={{
                    padding: '2px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700,
                    background: isCustom ? '#dcfce7' : '#fef9c3',
                    color: isCustom ? '#166534' : '#854d0e',
                    border: `1px solid ${isCustom ? '#bbf7d0' : '#fde047'}`
                  }}>
                    {isCustom ? '✅ Custom' : '⚠️ Default (not saved)'}
                  </span>
                </div>

                {/* Mini exam info bar */}
                {selectedExam && (
                  <div style={{ background: '#2980b9', borderRadius: '6px 6px 0 0', padding: '8px 14px', marginBottom: 0 }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
                      {selectedExam.topicName || 'Exam Instructions'}
                    </span>
                  </div>
                )}
                <div style={{
                  border: '1px solid #cfd7e0', borderTop: 'none',
                  borderRadius: '0 0 6px 6px', background: '#fff',
                  padding: '12px 14px', marginBottom: '16px',
                  fontSize: '0.82rem', color: '#374151'
                }}>
                  <strong>Please read the following instructions very carefully:</strong>
                </div>

                {/* ── Sections Table (from real exam data) ── */}
                {sections.length > 0 && (
                  <div className="ei-table-wrap">
                    <table className="ei-table">
                      <thead>
                        <tr>
                          <th>{dict.sno}</th>
                          <th>{dict.sections}</th>
                          <th>{dict.noOfQuestions}</th>
                          <th>{dict.maxMarks}</th>
                          <th>{dict.duration}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sections.map((sec, idx) => {
                          const translatedSecName = SECTION_TRANSLATIONS[activeTab]?.[sec.name] || sec.name;
                          return (
                            <tr key={sec.id} className={idx % 2 === 0 ? 'ei-row-even' : 'ei-row-odd'}>
                              <td>{sec.id}</td>
                              <td>{translatedSecName}</td>
                              <td>{sec.questions}</td>
                              <td>{sec.marks}</td>
                              <td>{sec.duration} {dict.minutes}</td>
                            </tr>
                          );
                        })}
                        <tr className="ei-row-total">
                          <td></td>
                          <td><strong>{dict.total}</strong></td>
                          <td><strong>{displayedTotalQuestions}</strong></td>
                          <td><strong>{displayedTotalMarks}</strong></td>
                          <td><strong>{displayedDuration} {dict.minutes}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Instruction lines */}
                <ol style={{
                  listStyle: 'none', padding: '0 0 0 4px', margin: 0,
                  counterReset: 'preview-counter',
                  fontFamily: activeTab === 'English'
                    ? "'Inter','Segoe UI',Arial,sans-serif"
                    : "'Noto Sans Devanagari','Noto Sans Oriya','Noto Sans',Arial,sans-serif",
                  fontSize: '0.875rem',
                }}>
                  {previewLines.length > 0 ? previewLines.map((line, i) => (
                    <li key={i} className="preview-li" style={{
                      counterIncrement: 'preview-counter',
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '6px 8px', borderRadius: '5px', marginBottom: '3px',
                      lineHeight: '1.65', color: '#333',
                    }}>
                      <span style={{ color: '#2980b9', fontWeight: 700, minWidth: '22px', flexShrink: 0 }}>{i + 1}.</span>
                      <span>{line}</span>
                    </li>
                  )) : (
                    <li style={{ color: '#94a3b8', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                      No instructions yet. Start typing in the editor.
                    </li>
                  )}
                </ol>

                {/* Choose Your default Language: */}
                <div className="ei-lang-row" style={{ marginTop: '16px', borderTop: '1.5px solid #e2e8f0', paddingTop: '16px' }}>
                  <label className="ei-lang-label" htmlFor="preview-default-lang">
                    Choose Your default Language:
                  </label>
                  <select
                    id="preview-default-lang"
                    className="ei-lang-select"
                    value={activeTab}
                    onChange={e => setActiveTab(e.target.value)}
                  >
                    {languages.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <p className="ei-lang-note">
                  Please note all questions will appear in your default language. This language can be changed for a particular question later on.
                </p>

                {/* Declaration */}
                <div className="ei-declaration">
                  <input
                    type="checkbox"
                    id="preview-declaration-cb"
                    checked={previewAccepted}
                    onChange={e => setPreviewAccepted(e.target.checked)}
                  />
                  <label htmlFor="preview-declaration-cb">
                    I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in position of / not wearing any / not carrying any prohibited gadget like mobile phone, bluetooth devices, etc/any prohibited material with me into the examination hall, I agree that in case of not adhering to the instructions, I shall be liable to be barred from this test and/or to disciplinary action, which may include banned from the future tests / examinations.
                  </label>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!selectedExamId && !loading && (
        <div className="glass" style={{ padding: '60px', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Select an exam above to manage its instructions.</p>
          {exams.length === 0 && <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>No exams found. Create an exam first.</p>}
        </div>
      )}
    </AdminLayout>
  );
};

export default Instructions;
