import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ExamInstructions.css';

const examData = {
  title: 'RBI Assistant Pre 2026 Advance Level Mock Test -01',
  totalQuestions: 100,
  maxMarks: 100,
  duration: 60,
  sections: [
    { id: 1, name: 'English Language', questions: 30, marks: 30, duration: '20 minutes' },
    { id: 2, name: 'Numerical Ability', questions: 35, marks: 35, duration: '20 minutes' },
    { id: 3, name: 'Reasoning Ability', questions: 35, marks: 35, duration: '20 minutes' },
  ],
};

const LANGUAGES = ['English', 'Hindi', 'Bengali', 'Gujarati', 'Marathi', 'Tamil', 'Telugu'];
const TEXT_SIZES = ['Small', 'Medium', 'Large'];

const ExamInstructions = () => {
  const navigate = useNavigate();
  const { student } = useAuth();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  const [language, setLanguage] = useState('');
  const [viewIn, setViewIn] = useState('ENGLISH');
  const [textSize, setTextSize] = useState('Large');
  const [accepted, setAccepted] = useState(false);
  const [langError, setLangError] = useState(false);
  const [acceptError, setAcceptError] = useState(false);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/exams`);
        const currentExam = res.data.find(e => e._id === student?.subject);
        setExam(currentExam);
      } catch (err) {
        console.error('Failed to fetch exam for instructions');
      } finally {
        setLoading(false);
      }
    };
    if (student?.subject) fetchExam();
  }, [student]);

  const handleBegin = () => {
    let valid = true;
    if (!language) { setLangError(true); valid = false; } else setLangError(false);
    if (!accepted) { setAcceptError(true); valid = false; } else setAcceptError(false);
    if (valid) navigate('/exams');
  };

  return (
    <div className="ei-wrapper">

      {/* ── Main Content ── */}
      <main className="ei-main">
        <div className="ei-card">

          {/* ── Section Title ── */}
          <div className="ei-section-title-bar">
            <span className="ei-section-title-text">Other Important Instructions</span>
          </div>

          {/* ── Exam Info Row ── */}
          <div className="ei-info-row">
            <div className="ei-info-group">
              <span className="ei-info-label">Total Questions</span>
              <span className="ei-info-sep">|</span>
              <strong className="ei-info-val">{exam?.questions?.length || 0}</strong>
              <span className="ei-info-sep">|</span>
              <span className="ei-info-label">Maximum Marks</span>
              <span className="ei-info-sep">|</span>
              <strong className="ei-info-val">{exam?.questions?.length || 0}</strong>
              <span className="ei-info-sep">|</span>
              <span className="ei-info-label ei-duration-icon">⏱ Duration</span>
              <strong className="ei-info-val">{exam?.duration || 60} mins</strong>
            </div>
            <div className="ei-view-controls">
              <label className="ei-ctrl-label">Text Size:</label>
              <select
                className="ei-select"
                value={textSize}
                onChange={e => setTextSize(e.target.value)}
              >
                {TEXT_SIZES.map(s => <option key={s}>{s}</option>)}
              </select>
              <label className="ei-ctrl-label">View in:</label>
              <select
                className="ei-select"
                value={viewIn}
                onChange={e => setViewIn(e.target.value)}
              >
                {LANGUAGES.map(l => <option key={l} value={l.toUpperCase()}>{l.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          {/* ── Divider ── */}
          <hr className="ei-divider" />

          {/* ── Careful Note ── */}
          <p className="ei-read-note">Please read the following instructions very carefully:</p>

          {/* ── Sections Table ── */}
          <div className="ei-table-wrap">
            <table className="ei-table">
              <thead>
                <tr>
                  <th>S.no.</th>
                  <th>Sections</th>
                  <th>No. of Questions</th>
                  <th>Maximum Marks</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {examData.sections.map((sec, idx) => (
                  <tr key={sec.id} className={idx % 2 === 0 ? 'ei-row-even' : 'ei-row-odd'}>
                    <td>{sec.id}</td>
                    <td>{sec.name}</td>
                    <td>{sec.questions}</td>
                    <td>{sec.marks}</td>
                    <td>{sec.duration}</td>
                  </tr>
                ))}
                <tr className="ei-row-total">
                  <td></td>
                  <td><strong>Total</strong></td>
                  <td><strong>{examData.totalQuestions}</strong></td>
                  <td><strong>{examData.maxMarks}</strong></td>
                  <td><strong>{examData.duration} minutes</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Rules List ── */}
          <ol className="ei-rules">
            <li>You have <strong>{exam?.duration || 60} minutes</strong> to complete the test.</li>
            <li>The test contains a total of <strong>{exam?.questions?.length || 0} questions</strong>.</li>
            <li>There is only one correct answer to each question. Click on the most appropriate option to mark it as your answer.</li>
            <li>You will be awarded <strong>1 mark</strong> for each correct answer.</li>
            <li>There is <strong>{exam?.negativeMarking || 0} penalty</strong> for each wrong answer.</li>
            <li>You can change your answer by clicking on some other option.</li>
            <li>You can unmark your answer by clicking on the &quot;Clear Response&quot; button.</li>
            <li>A Number list of all questions appears at the right hand side of the screen. You can access the questions in any order within a section or across sections by clicking on the question number given on the number list.</li>
            <li>After clicking the <strong>Save &amp; Next</strong> button on the last question for a section, you will automatically be taken to the first question of the next section.</li>
            <li>You can shuffle between sections and questions anytime during the examination as per your convenience.</li>
            <li>The computer clock shall be set at the server. The countdown timer at the top right corner of your screen will display the time remaining for you to complete the examination. When the timer reaches zero, the examination will end by itself. You need not terminate the examination or submit your paper.</li>
          </ol>

          {/* ── Language Selector ── */}
          <div className="ei-lang-row">
            <label className="ei-lang-label" htmlFor="default-lang">
              Choose Your default Language:
            </label>
            <select
              id="default-lang"
              className={`ei-select ei-lang-select ${langError ? 'ei-select-error' : ''}`}
              value={language}
              onChange={e => { setLanguage(e.target.value); setLangError(false); }}
            >
              <option value="">-- Select --</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {language && (
            <p className="ei-lang-note">
              Please note all questions will appear in your default language. This language can be changed for a particular question later on.
            </p>
          )}
          {langError && (
            <p className="ei-lang-note ei-lang-note-error">
              Please select your default language before proceeding.
            </p>
          )}

          {/* ── Declaration Checkbox ── */}
          <div className={`ei-declaration ${acceptError ? 'ei-declaration-error' : ''}`}>
            <input
              type="checkbox"
              id="declaration-cb"
              checked={accepted}
              onChange={e => { setAccepted(e.target.checked); setAcceptError(false); }}
            />
            <label htmlFor="declaration-cb">
              I have read and understood the instructions. All computer hardware allotted to me are in proper working condition.
              I declare that I am not in position of / not wearing any / not carrying any prohibited gadget like mobile phone,
              bluetooth devices, etc/any prohibited material with me into the examination hall, I agree that in case of not adhering
              to the instructions, I shall be liable to be barred from this test and/or to disciplinary action, which may include
              banned from the future tests / examinations.
            </label>
          </div>
          {acceptError && (
            <p className="ei-accept-error">You must accept the declaration to proceed.</p>
          )}

        </div>
      </main>

      {/* ── Bottom Navigation Bar ── */}
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
