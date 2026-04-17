import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../../context/ExamContext';
import { useAuth } from '../../context/AuthContext';
import ExamHeader from '../../components/student/ExamHeader';
import QuestionPalette from '../../components/student/QuestionPalette';
import QuestionDisplay from '../../components/student/QuestionDisplay';
import ExamFooter from '../../components/student/ExamFooter';

const ExamInterface = () => {
  const { 
    exam, setExam, 
    currentQuestionIndex, setCurrentQuestionIndex, 
    answers, selectOption, 
    timeLeft, 
    status, markForReview, clearResponse, 
    jumpToQuestion, resetExam 
  } = useExam();
  const { student } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Mock Data for Initial Test if DB is empty
  const mockExam = {
    _id: 'mock123',
    title: 'RBI Assistant Pre 2026 Advance Level Mock Test - 01',
    duration: 60,
    sections: ['English', 'Reasoning', 'Quant'],
    questions: [
      { _id: 'q1', text: 'Select the most appropriate option to fill in the blank.\n\nHe _____ corrected his mistake after I pointed it out.', options: ['has', 'had', 'have', 'having'], correctOption: 1, section: 'English', marks: 1 },
      { _id: 'q2', text: 'Identify the segment that contains a grammatical error.\n\nThe furniture in the drawing room are made of teak wood.', options: ['The furniture', 'in the drawing room', 'are made of', 'teak wood'], correctOption: 2, section: 'English', marks: 1 },
      { _id: 'q3', text: 'Direction: In the following questions, a series is given with one term missing. Choose the correct alternative from the given ones that will complete the series.\n\n7, 12, 22, 42, 82, ?', options: ['142', '162', '182', '152'], correctOption: 1, section: 'Reasoning', marks: 1 },
      { _id: 'q4', text: 'If A + B means A is the mother of B; A - B means A is the brother of B; A % B means A is the father of B and A * B means A is the sister of B, which of the following shows that P is the maternal uncle of Q?', options: ['Q - N + M * P', 'P - M + N * Q', 'P - M % N * Q', 'P * M + N - Q'], correctOption: 1, section: 'Reasoning', marks: 1 },
      { _id: 'q5', text: 'A man buys a cycle for $1400 and sells it at a loss of 15%. What is the selling price of the cycle?', options: ['$1090', '$1160', '$1190', '$1202'], correctOption: 2, section: 'Quant', marks: 1 },
    ]
  };

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/exams`);
        if (res.data.length > 0) {
          setExam(res.data[0]);
        } else {
          setExam(mockExam);
        }
      } catch (err) {
        console.error('Failed to fetch exam, using mock data');
        setExam(mockExam);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [setExam]);

  if (loading || !exam) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Exam...</div>;

  const currentQuestion = exam.questions[currentQuestionIndex];

  const handleNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (window.confirm('Do you really want to submit the test?')) {
      const processedAnswers = [];
      let totalScore = 0;
      let correct = 0;
      let wrong = 0;
      const scoreBySection = { English: 0, Reasoning: 0, Quant: 0 };

      exam.questions.forEach(q => {
        const selected = answers[q._id];
        const isCorrect = selected !== undefined && selected === q.correctOption;
        
        if (selected !== undefined) {
          if (isCorrect) {
            totalScore += q.marks;
            correct++;
            scoreBySection[q.section] += q.marks;
          } else {
            totalScore -= 0.25; // Negative marking
            wrong++;
          }
        }
        
        processedAnswers.push({
          questionId: q._id,
          selectedOption: selected,
          isCorrect
        });
      });

      const resultData = {
        studentId: student._id,
        examId: exam._id,
        answers: processedAnswers,
        score: totalScore,
        correct,
        wrong,
        scoreBySection,
        timeTaken: (exam.duration * 60) - timeLeft,
        totalMarks: exam.questions.length * 1 // Assuming 1 mark per question
      };

      try {
        await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/submit`, resultData);
        resetExam();
        navigate('/result', { state: { result: resultData } });
      } catch (err) {
        console.error('Submission failed:', err);
        alert('Submission failed. Navigating to results locally.');
        navigate('/result', { state: { result: resultData } });
      }
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      <ExamHeader 
        title={exam.title} 
        timeLeft={timeLeft} 
        onShowInstructions={() => alert('Instructions: Answer all questions. Each correct answer carries 1 mark. There is no negative marking.')} 
      />
      
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', overflow: 'hidden' }}>
        {/* Left Section - Question Area */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRight: '1px solid var(--border-light)' }}>
          <div style={{ padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '24px' }}>
            {exam.sections.map(sec => (
              <button 
                key={sec}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  background: currentQuestion.section === sec ? 'var(--primary)' : 'transparent',
                  color: currentQuestion.section === sec ? 'white' : 'var(--text-muted)',
                  borderRadius: '4px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {sec}
              </button>
            ))}
          </div>

          <QuestionDisplay 
            question={currentQuestion} 
            index={currentQuestionIndex}
            selectedOption={answers[currentQuestion._id]}
            onSelect={(opt) => selectOption(currentQuestion._id, opt)}
          />

          <ExamFooter 
            onNext={handleNext}
            onPrevious={handlePrevious}
            onMark={() => markForReview(currentQuestion._id)}
            onClear={() => clearResponse(currentQuestion._id)}
            onSubmit={handleSubmit}
            isFirst={currentQuestionIndex === 0}
            isLast={currentQuestionIndex === exam.questions.length - 1}
          />
        </div>

        {/* Right Section - Sidebar */}
        <div style={{ background: '#f8fafc', overflowY: 'auto' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src="https://via.placeholder.com/60" alt="Student" style={{ borderRadius: '50%', border: '2px solid var(--primary)' }} />
            <div>
              <div style={{ fontWeight: 'bold' }}>{student?.name || 'Student Name'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roll: {student?.rollNumber}</div>
            </div>
          </div>
          
          <QuestionPalette 
            questions={exam.questions} 
            status={status} 
            currentIndex={currentQuestionIndex}
            onJump={jumpToQuestion}
          />
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;
