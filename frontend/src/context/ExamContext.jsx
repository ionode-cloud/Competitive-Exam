import React, { createContext, useContext, useState, useEffect } from 'react';

const ExamContext = createContext();

export const ExamProvider = ({ children }) => {
  const [exam, setExam] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem('examAnswers');
    return saved ? JSON.parse(saved) : {};
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('examTimeLeft');
    return saved ? parseInt(saved) : null;
  });
  const [status, setStatus] = useState(() => {
    const saved = localStorage.getItem('examStatus');
    return saved ? JSON.parse(saved) : {}; // { qId: 'visited' | 'answered' | 'marked' }
  });

  useEffect(() => {
    if (exam && timeLeft === null) {
      const hasCustom = exam.customSections && exam.customSections.length > 0;
      const actualDuration = hasCustom
        ? exam.customSections.reduce((sum, s) => sum + (Number(s.duration) || 0), 0)
        : (exam.duration || 0);
      setTimeLeft(actualDuration * 60);
    }
  }, [exam]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          localStorage.setItem('examTimeLeft', newTime);
          return newTime;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    localStorage.setItem('examAnswers', JSON.stringify(answers));
    localStorage.setItem('examStatus', JSON.stringify(status));
  }, [answers, status]);

  const selectOption = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    setStatus(prev => ({ ...prev, [questionId]: 'answered' }));
  };

  const markForReview = (questionId) => {
    setStatus(prev => ({ ...prev, [questionId]: 'marked' }));
  };

  const clearResponse = (questionId) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionId];
      return newAnswers;
    });
    setStatus(prev => ({ ...prev, [questionId]: 'visited' }));
  };

  const jumpToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    const qId = exam.questions[index]._id;
    if (!status[qId]) {
      setStatus(prev => ({ ...prev, [qId]: 'visited' }));
    }
  };

  const resetExam = () => {
    setExam(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeft(null);
    setStatus({});
    localStorage.removeItem('examAnswers');
    localStorage.removeItem('examTimeLeft');
    localStorage.removeItem('examStatus');
  };

  return (
    <ExamContext.Provider value={{
      exam, setExam,
      currentQuestionIndex, setCurrentQuestionIndex,
      answers, selectOption,
      timeLeft, setTimeLeft,
      status, setStatus,
      markForReview, clearResponse,
      jumpToQuestion, resetExam
    }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => useContext(ExamContext);
