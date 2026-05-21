import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ExamInstructions.css';

const TEXT_SIZES = ['Small', 'Medium', 'Large'];
const TEXT_SIZE_MAP = { Small: '0.8rem', Medium: '0.875rem', Large: '1rem' };

/* Strip leading numbering like "1.", "1)", "1:" from admin-written lines */
const parseInstructionLines = (text) => {
  if (!text || !text.trim()) return [];
  return text
    .split('\n')
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
    customBadge: '📋 Custom Instructions',
    defaultBadge: '📋 Default Instructions',
  },
  Hindi: {
    sno: 'क्र.सं.',
    sections: 'अनुभाग',
    noOfQuestions: 'प्रश्नों की संख्या',
    maxMarks: 'अधिकतम अंक',
    duration: 'अवधि',
    total: 'कुल',
    minutes: 'मिनट',
    customBadge: '📋 अनुकूलित निर्देश',
    defaultBadge: '📋 डिफ़ॉल्ट निर्देश',
  },
  Odia: {
    sno: 'କ୍ରମିକ ସଂଖ୍ୟା',
    sections: 'ବିଭାଗ',
    noOfQuestions: 'ପ୍ରଶ୍ନ ସଂଖ୍ୟା',
    maxMarks: 'ସର୍ବାଧିକ ମାର୍କ',
    duration: 'ସମୟ',
    total: 'ମୋଟ',
    minutes: 'ମିନିଟ୍',
    customBadge: '📋 କଷ୍ଟମ୍ ନିର୍ଦ୍ଦେଶାବଳୀ',
    defaultBadge: '📋 ଡିଫଲ୍ଟ ନିର୍ଦ୍ଦେଶାବଳୀ',
  }
};

const DEFAULT_INSTRUCTIONS = {
  English: (duration, totalQuestions, sectionCount, negativeMarking) => [
    `You have ${duration} minutes to complete the test.`,
    `The test contains a total of ${totalQuestions} questions across ${sectionCount} section(s).`,
    `There is only one correct answer to each question. Click the most appropriate option.`,
    `You will be awarded marks for each correct answer as per the question's marks.`,
    negativeMarking > 0
      ? `There is a negative marking of ${negativeMarking} marks for each wrong answer.`
      : `There is no negative marking for wrong answers.`,
    `You can change your answer by clicking on another option.`,
    `You can clear your answer using the "Clear Response" button.`,
    `The question panel on the right lets you jump to any question in any order.`,
    `Clicking "Save & Next" on the last question of a section moves you to the next question/section.`,
    `You can shuffle between sections and questions anytime during the examination as per your convenience.`,
    `The computer clock shall be set at the server. The countdown timer at the top right corner of your screen will display the time remaining for you to complete the examination. When the timer reaches zero, the examination will end by itself.`,
    `Do not refresh or close the browser tab during the exam.`,
  ],
  Hindi: (duration, totalQuestions, sectionCount, negativeMarking) => [
    `आपके पास परीक्षा पूरी करने के लिए ${duration} मिनट का समय है।`,
    `परीक्षा में ${sectionCount} अनुभाग(अनुभागों) में कुल ${totalQuestions} प्रश्न शामिल हैं।`,
    `प्रत्येक प्रश्न का केवल एक सही उत्तर है। अपना उत्तर अंकित करने के लिए सबसे उपयुक्त विकल्प पर क्लिक करें।`,
    `प्रत्येक सही उत्तर के लिए आपको प्रश्न के अंकों के अनुसार अंक दिए जाएंगे।`,
    negativeMarking > 0
      ? `प्रत्येक गलत उत्तर के लिए ${negativeMarking} अंक का नकारात्मक अंकन (पेनल्टी) है।`
      : `गलत उत्तरों के लिए कोई नकारात्मक अंकन नहीं है।`,
    `आप किसी अन्य विकल्प पर क्लिक करके अपना उत्तर बदल सकते हैं।`,
    `आप "Clear Response" बटन पर क्लिक करके अपना उत्तर हटा सकते हैं।`,
    `स्क्रीन के दाईं ओर सभी प्रश्नों की एक संख्या सूची दिखाई देती है। आप संख्या सूची पर दिए गए प्रश्न संख्या पर क्लिक करके अनुभाग में या अनुभागों में किसी भी क्रम में प्रश्नों तक पहुँच सकते हैं।`,
    `अनुभाग के अंतिम प्रश्न पर "Save & Next" बटन पर क्लिक करने के बाद, आपको स्वचालित रूप से अगले अनुभाग के पहले प्रश्न पर ले जाया जाएगा।`,
    `आप अपनी सुविधा के अनुसार परीक्षा के दौरान किसी भी समय अनुभागों और प्रश्नों के बीच आ-जा सकते हैं।`,
    `कंप्यूटर घड़ी सर्वर पर सेट की जाएगी। स्क्रीन के शीर्ष दाएं कोने में उलटी गिनती टाइमर आपके परीक्षा पूरी करने के लिए शेष समय प्रदर्शित करेगा। जब टाइमर शून्य पर पहुंच जाएगा, तो परीक्षा अपने आप समाप्त हो जाएगी।`,
    `परीक्षा के दौरान ब्राउज़र टैब को रिफ्रेश या बंद न करें।`,
  ],
  Odia: (duration, totalQuestions, sectionCount, negativeMarking) => [
    `ଆପଣଙ୍କ ପାଖରେ ପରୀକ୍ଷା ସଂପୂର୍ଣ୍ଣ କରିବା ପାଇଁ ${duration} ମିନିଟ୍ ସମୟ ଅଛି।`,
    `ଏହି ପରୀକ୍ଷାରେ ${sectionCount} ବିଭାଗ(ଗୁଡିକ)ରେ ମୋଟ ${totalQuestions} ପ୍ରଶ୍ନ ଅଛି।`,
    `ପ୍ରତ୍ୟେକ ପ୍ରଶ୍ନର ମାତ୍ର ଗୋଟିଏ ସଠିକ ଉତ୍ତର ଅଛି। ଉତ୍ତର ଚିହ୍ନଟ କରିବାକୁ ସବୁଠାରୁ ଉପଯୁକ୍ତ ବିକଳ୍ପ ଉପରେ କ୍ଲିକ୍ କରନ୍ତୁ।`,
    `ପ୍ରତ୍ୟେକ ସଠିକ ଉତ୍ତର ପାଇଁ ପ୍ରଶ୍ନର ମାର୍କ ଅନୁଯାୟୀ ମାର୍କ ପ୍ରଦାନ କରାଯିବ।`,
    negativeMarking > 0
      ? `ପ୍ରତ୍ୟେକ ଭୁଲ ଉତ୍ତର ପାଇଁ ${negativeMarking} ମାର୍କର ନକାରାତ୍ମକ ମାର୍କିଂ (ପେନାଲ୍ଟି) ଅଛି।`
      : `ଭୁଲ ଉତ୍ତର ପାଇଁ କୌଣସି ନକାରାତ୍ମକ ମାର୍କିଂ ନାହିଁ।`,
    `ଅନ୍ୟ ବିକଳ୍ପ ଉପରେ କ୍ଲିକ୍ କରି ଆପଣ ଉତ୍ତର ବଦଳାଇ ପାରିବେ।`,
    `ଆପଣ "Clear Response" ବଟନ୍ ଉପରେ କ୍ଲିକ୍ କରି ଆପଣଙ୍କ ଉତ୍ତରକୁ ଖାଲି କରିପାରିବେ।`,
    `ସ୍କ୍ରିନ୍‌ର ଡାହାଣ ପାର୍ଶ୍ୱରେ ସମସ୍ତ ପ୍ରଶ୍ନର ଏକ ସଂଖ୍ୟା ତାଲିକା ଦେଖାଯାଏ। ଆପଣ ସେହି ନମ୍ବର ଉପରେ କ୍ଲିକ୍ କରି ଯେକୌଣସି ପ୍ରଶ୍ନକୁ ଯାଇପାରିବେ।`,
    `ଏକ ବିଭାଗର ଶେଷ ପ୍ରଶ୍ନରେ "Save & Next" ବଟନ୍ କ୍ଲିକ୍ କରିବା ପରେ, ଆପଣ ସ୍ୱୟଂଚାଳିତ ଭାବରେ ପରବର୍ତ୍ତୀ ବିଭାଗର ପ୍ରଥମ ପ୍ରଶ୍ନକୁ ଯିବେ।`,
    `ପରୀକ୍ଷା ସମୟରେ ଆପଣ ନିଜ ସୁବିଧା ଅନୁସାରେ ବିଭାଗ ଏବଂ ପ୍ରଶ୍ନଗୁଡ଼ିକ ମଧ୍ୟରେ ଯାତାୟାତ କରିପାରିବେ।`,
    `କମ୍ପ୍ୟୁଟର ଘଣ୍ଟା ସର୍ଭରରେ ସେଟ୍ ହେବ। ସ୍କ୍ରିନ୍‌ର ଉପର ଡାହାଣ କୋଣରେ ଥିବା ଟାଇମର ଆପଣଙ୍କର ବଳକା ସମୟ ଦେଖାଇବ। ସମୟ ଶୂନ୍ୟ ହେଲେ ପରୀକ୍ଷା ସ୍ୱୟଂକ୍ରିୟ ଭାବରେ ଶେଷ ହେବ।`,
    `ପରୀକ୍ଷା ସମୟରେ ବ୍ରାଉଜର ଟ୍ୟାବ୍‌କୁ ରିଫ୍ରେସ୍ କିମ୍ବା ବନ୍ଦ କରନ୍ତୁ ନାହିଁ।`,
  ]
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

const ExamInstructions = () => {
  const navigate = useNavigate();
  const { student } = useAuth();

  const [exam, setExam]                       = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [examLanguages, setExamLanguages]     = useState(['English', 'Hindi', 'Odia']);
  const [customInstructions, setCustomInstructions] = useState({});

  /* UI state */
  const [viewIn, setViewIn]       = useState('English');   // drives instruction preview
  const [language, setLanguage]   = useState('');          // student's chosen default lang
  const [textSize, setTextSize]   = useState('Medium');
  const [accepted, setAccepted]   = useState(false);
  const [langError, setLangError] = useState(false);
  const [acceptError, setAcceptError] = useState(false);

  /* ── Fetch exam ── */
  useEffect(() => {
    if (!student?.subject) { setLoading(false); return; }

    const fetchExam = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5117'}/api/exams`
        );
        const found = res.data.find(e => e._id === student.subject);
        setExam(found || null);

        if (found?.languages?.length) {
          setExamLanguages(found.languages);
          setViewIn(found.languages[0]);
        }
        if (found?.instructions) {
          setCustomInstructions(found.instructions);
        }
      } catch (err) {
        console.error('Failed to fetch exam for instructions', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [student]);

  /* When student picks their default language → also update the "View in" preview */
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (lang) setViewIn(lang);
    setLangError(false);
  };

  const handleBegin = () => {
    let valid = true;
    if (!language) { setLangError(true);   valid = false; } else setLangError(false);
    if (!accepted) { setAcceptError(true); valid = false; } else setAcceptError(false);
    if (valid) navigate('/exams');
  };

  /* ── Derive data ── */
  const hasCustomSections = exam?.customSections && exam.customSections.length > 0;

  const sections = hasCustomSections
    ? exam.customSections.map((s, idx) => ({ ...s, id: idx + 1 }))
    : buildSections(exam?.questions || [], exam?.duration || 0);

  const totalQuestions = hasCustomSections
    ? exam.customSections.reduce((sum, s) => sum + (Number(s.questions) || 0), 0)
    : (exam?.questions?.length || 0);

  const totalMarks = hasCustomSections
    ? exam.customSections.reduce((sum, s) => sum + (Number(s.marks) || 0), 0)
    : (exam?.totalMarks || 0);

  const duration = hasCustomSections
    ? exam.customSections.reduce((sum, s) => sum + (Number(s.duration) || 0), 0)
    : (exam?.duration || 0);

  const dict           = DICT[viewIn] || DICT.English;

  const customText   = customInstructions?.[viewIn];
  const hasCustom    = !!(customText?.trim());
  
  const defaultGetter = DEFAULT_INSTRUCTIONS[viewIn] || DEFAULT_INSTRUCTIONS.English;
  const instrLines   = hasCustom
    ? parseInstructionLines(customText)
    : defaultGetter(duration, totalQuestions, sections.length, exam?.negativeMarking || 0);

  const fontSize = TEXT_SIZE_MAP[textSize] || '0.875rem';

  if (loading) {
    return (
      <div className="ei-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#555', fontSize: '1rem', padding: '60px' }}>Loading exam instructions…</p>
      </div>
    );
  }

  return (
    <div className="ei-wrapper">
      <main className="ei-main">
        <div className="ei-card">

          {/* ── Blue Title Bar ── */}
          <div className="ei-section-title-bar">
            <span className="ei-section-title-text">
              {exam
                ? `${exam.subjectName}${exam.topicName ? ' — ' + exam.topicName : ''}`
                : 'Important Instructions'}
            </span>
          </div>

          {/* ── Exam Info Row ── */}
          <div className="ei-info-row">
            <div className="ei-info-group">
              <span className="ei-info-label">Total Questions</span>
              <span className="ei-info-sep">|</span>
              <strong className="ei-info-val">{totalQuestions}</strong>
              <span className="ei-info-sep">|</span>
              <span className="ei-info-label">Maximum Marks</span>
              <span className="ei-info-sep">|</span>
              <strong className="ei-info-val">{totalMarks}</strong>
              <span className="ei-info-sep">|</span>
              <span className="ei-info-label ei-duration-icon">⏱ Duration</span>
              <strong className="ei-info-val">{duration} mins</strong>
              {exam?.negativeMarking > 0 && (
                <>
                  <span className="ei-info-sep">|</span>
                  <span className="ei-info-label">Negative Marking</span>
                  <span className="ei-info-sep">|</span>
                  <strong className="ei-info-val" style={{ color: '#c0392b' }}>−{exam.negativeMarking}</strong>
                </>
              )}
            </div>

            <div className="ei-view-controls">
              <label className="ei-ctrl-label">Text Size:</label>
              <select className="ei-select" value={textSize} onChange={e => setTextSize(e.target.value)}>
                {TEXT_SIZES.map(s => <option key={s}>{s}</option>)}
              </select>
              <label className="ei-ctrl-label">View in:</label>
              <select
                className="ei-select"
                value={viewIn}
                onChange={e => setViewIn(e.target.value)}
              >
                {examLanguages.map(l => (
                  <option key={l} value={l}>{l.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="ei-divider" />

          {/* ── Read Note ── */}
          <p className="ei-read-note">Please read the following instructions very carefully:</p>

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
                    const translatedSecName = SECTION_TRANSLATIONS[viewIn]?.[sec.name] || sec.name;
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
                    <td><strong>{totalQuestions}</strong></td>
                    <td><strong>{totalMarks}</strong></td>
                    <td><strong>{duration} {dict.minutes}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ── Instructions Header Badge ── */}
          <div style={{ padding: '10px 18px 2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 12px',
              borderRadius: '20px',
              background: hasCustom ? '#e8f4fd' : '#f0fdf4',
              border: `1px solid ${hasCustom ? '#2980b9' : '#86efac'}`,
              color: hasCustom ? '#1a5276' : '#166534',
              fontSize: '0.73rem',
              fontWeight: 700,
              letterSpacing: '0.3px',
            }}>
              {hasCustom
                ? `${dict.customBadge} — ${viewIn}`
                : `${dict.defaultBadge} — ${viewIn}`}
            </span>
          </div>

          {/* ── Instructions List ── */}
          <ol
            className={hasCustom ? 'ei-rules-custom' : 'ei-rules'}
            style={{
              fontSize,
              fontFamily: viewIn === 'English'
                ? "'Inter', 'Segoe UI', Arial, sans-serif"
                : "'Noto Sans Devanagari', 'Noto Sans Oriya', 'Noto Sans', 'Segoe UI', Arial, sans-serif",
            }}
          >
            {instrLines.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ol>

          {/* ── Choose Default Language ── */}
          <div className="ei-lang-row">
            <label className="ei-lang-label" htmlFor="default-lang">
              Choose Your Default Language:
            </label>
            <select
              id="default-lang"
              className={`ei-select ei-lang-select ${langError ? 'ei-select-error' : ''}`}
              value={language}
              onChange={e => handleLanguageChange(e.target.value)}
            >
              <option value="">-- Select --</option>
              {examLanguages.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <p className="ei-lang-note">
            Please note all questions will appear in your default language. This language can be changed for a particular question later on.
          </p>
          {langError && (
            <p className="ei-lang-note ei-lang-note-error">
              ⚠️ Please select your default language before proceeding.
            </p>
          )}

          {/* ── Declaration ── */}
          <div className={`ei-declaration ${acceptError ? 'ei-declaration-error' : ''}`}>
            <input
              type="checkbox"
              id="declaration-cb"
              checked={accepted}
              onChange={e => { setAccepted(e.target.checked); setAcceptError(false); }}
            />
            <label htmlFor="declaration-cb">
              I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in position of / not wearing any / not carrying any prohibited gadget like mobile phone, bluetooth devices, etc/any prohibited material with me into the examination hall, I agree that in case of not adhering to the instructions, I shall be liable to be barred from this test and/or to disciplinary action, which may include banned from the future tests / examinations.
            </label>
          </div>
          {acceptError && (
            <p className="ei-accept-error">⚠️ You must accept the declaration to proceed.</p>
          )}

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="ei-footer">
        <button className="ei-btn ei-btn-prev" onClick={() => navigate('/login')}>
          &#8249; Previous
        </button>
        <button
          className={`ei-btn ei-btn-begin ${!accepted || !language ? 'ei-btn-begin-disabled' : ''}`}
          onClick={handleBegin}
        >
          I am ready to begin
        </button>
      </footer>
    </div>
  );
};

export default ExamInstructions;
