import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StudentLogin from './pages/student/Login';
import ExamInterface from './pages/student/ExamInterface';
import ExamInstructions from './pages/student/ExamInstructions';
import ResultPage from './pages/student/ResultPage';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import CreateExam from './pages/admin/CreateExam';
import ManageQuestions from './pages/admin/ManageQuestions';
import StudentsView from './pages/admin/Students';
import ResultsView from './pages/admin/Results';
import AdminRating from './pages/admin/AdminRating';
import AdminLogs from './pages/admin/AdminLogs';
import ForgotPassword from './pages/admin/ForgotPassword';
import AdminLayout from './layouts/AdminLayout';
import { useAuth } from './context/AuthContext';

function App() {
  const { student, admin } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Student Routes */}
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/instructions" element={student ? <ExamInstructions /> : <Navigate to="/login" />} />
        <Route path="/exams" element={student ? <ExamInterface /> : <Navigate to="/login" />} />
        <Route path="/result" element={student ? <ResultPage /> : <Navigate to="/login" />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/dashboard" element={admin ? <AdminDashboard /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/create-exam" element={admin ? <CreateExam /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/manage-questions" element={admin ? <ManageQuestions /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/students" element={admin ? <StudentsView /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/results" element={admin ? <ResultsView /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/ratings" element={admin ? <AdminRating /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/logs" element={admin ? <AdminLogs /> : <Navigate to="/admin/login" />} />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
