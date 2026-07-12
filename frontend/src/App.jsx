import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Public pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Services from './pages/public/Services';
import Gallery from './pages/public/Gallery';
import Contact from './pages/public/Contact';
import StudentAuthPage from './pages/public/StudentAuthPage';
import CoursesPage from './pages/public/Courses';
import CourseDetailPage from './pages/public/CourseDetail';
import EBook from './pages/public/EBook';

// Student exam pages (existing)
import StudentLogin from './pages/student/Login';
import ExamInterface from './pages/student/ExamInterface';
import ExamInstructions from './pages/student/ExamInstructions';
import ResultPage from './pages/student/ResultPage';
import StudentDashboard from './pages/student/StudentDashboard';

// Admin pages (existing)
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import CreateExam from './pages/admin/CreateExam';
import ManageExams from './pages/admin/ManageExams';
import ManageQuestions from './pages/admin/ManageQuestions';
import StudentsView from './pages/admin/Students';
import ResultsView from './pages/admin/Results';
import AdminRating from './pages/admin/AdminRating';
import AdminLogs from './pages/admin/AdminLogs';
import ForgotPassword from './pages/admin/ForgotPassword';
import Instructions from './pages/admin/Instructions';
import AdminLayout from './layouts/AdminLayout';

// New admin pages
import AdminCourses from './pages/admin/AdminCourses';
import AdminCategories from './pages/admin/AdminCategories';
import AdminMockTests from './pages/admin/AdminMockTests';
import AdminSchedules from './pages/admin/AdminSchedules';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminPayments from './pages/admin/AdminPayments';
import AdminCertificates from './pages/admin/AdminCertificates';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSubjects from './pages/admin/AdminSubjects';
import AdminHome from './pages/admin/AdminHome';
import AdminAbout from './pages/admin/AdminAbout';
import AdminContact from './pages/admin/AdminContact';
import AdminGallery from './pages/admin/AdminGallery';
import AdminFooter from './pages/admin/AdminFooter';
import AdminQuestionBook from './pages/admin/AdminQuestionBook';

import { useAuth } from './context/AuthContext';
import { useUser } from './context/UserContext';
import AuthModal from './components/public/AuthModal';

function App() {
  const { student, admin } = useAuth();
  const { isAuthModalOpen, closeAuthModal, authModalTab, user } = useUser();

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* ==============================
            ROOT — redirect to home
            ============================== */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* ==============================
            PUBLIC PAGES
            ============================== */}
        <Route path="/home"     element={<Home />} />
        <Route path="/about"    element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/gallery"  element={<Gallery />} />
        <Route path="/contact"  element={<Contact />} />
        <Route path="/ebook"    element={<EBook />} />

        {/* Courses (new) */}
        <Route path="/courses"       element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />

        {/* Auth (register / login for public users) */}
        <Route path="/auth" element={<StudentAuthPage />} />

        {/* Student Dashboard */}
        <Route path="/dashboard" element={<StudentDashboard />} />

        {/* ==============================
            EXAM STUDENT ROUTES (existing)
            ============================== */}
        <Route path="/login"        element={<Navigate to="/services" replace />} />
        <Route path="/instructions" element={<ExamInstructions />} />
        <Route path="/exams"        element={<ExamInterface />} />
        <Route path="/result"       element={<ResultPage />} />

        {/* ==============================
            ADMIN ROUTES (existing)
            ============================== */}
        <Route path="/admin/login"           element={<AdminLogin />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/dashboard"       element={admin ? <AdminDashboard />   : <Navigate to="/admin/login" />} />
        <Route path="/admin/create-exam"     element={admin ? <CreateExam />       : <Navigate to="/admin/login" />} />
        <Route path="/admin/manage-exams"    element={admin ? <ManageExams />      : <Navigate to="/admin/login" />} />
        <Route path="/admin/manage-questions"element={admin ? <ManageQuestions />  : <Navigate to="/admin/login" />} />
        <Route path="/admin/students"        element={admin ? <StudentsView />     : <Navigate to="/admin/login" />} />
        <Route path="/admin/results"         element={admin ? <ResultsView />      : <Navigate to="/admin/login" />} />
        <Route path="/admin/ratings"         element={admin ? <AdminRating />      : <Navigate to="/admin/login" />} />
        <Route path="/admin/logs"            element={admin && admin.role !== 'Root Admin' ? <AdminLogs /> : <Navigate to="/admin/dashboard" />} />
        <Route path="/admin/instructions"    element={admin ? <Instructions />     : <Navigate to="/admin/login" />} />

        {/* ==============================
            ADMIN ROUTES (new)
            ============================== */}
        <Route path="/admin/courses"          element={admin ? <AdminCourses />       : <Navigate to="/admin/login" />} />
        <Route path="/admin/subjects"         element={admin ? <AdminSubjects />      : <Navigate to="/admin/login" />} />
        <Route path="/admin/categories"       element={admin ? <AdminCategories />    : <Navigate to="/admin/login" />} />
        <Route path="/admin/mock-tests"       element={admin ? <AdminMockTests />     : <Navigate to="/admin/login" />} />
        <Route path="/admin/schedules"        element={admin ? <AdminSchedules />     : <Navigate to="/admin/login" />} />
        <Route path="/admin/coupons"          element={admin ? <AdminCoupons />       : <Navigate to="/admin/login" />} />
        <Route path="/admin/payments-manage"  element={admin ? <AdminPayments />      : <Navigate to="/admin/login" />} />
        <Route path="/admin/certificates"     element={admin ? <AdminCertificates />  : <Navigate to="/admin/login" />} />
        <Route path="/admin/notifications"    element={admin ? <AdminNotifications /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/home"             element={admin ? <AdminHome />          : <Navigate to="/admin/login" />} />
        <Route path="/admin/about"            element={admin ? <AdminAbout />         : <Navigate to="/admin/login" />} />
        <Route path="/admin/contact"          element={admin ? <AdminContact />       : <Navigate to="/admin/login" />} />
        <Route path="/admin/gallery"          element={admin ? <AdminGallery />       : <Navigate to="/admin/login" />} />
        <Route path="/admin/footer"           element={admin ? <AdminFooter />        : <Navigate to="/admin/login" />} />
        <Route path="/admin/question-book"    element={admin ? <AdminQuestionBook />  : <Navigate to="/admin/login" />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialTab={authModalTab}
      />
      <ScrollToTopButton />
    </Router>
  );
}

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '46px',
            height: '46px',
            minWidth: '46px',
            minHeight: '46px',
            maxWidth: '46px',
            maxHeight: '46px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff6b00, #ff8c00)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            boxSizing: 'border-box',
            boxShadow: '0 4px 16px rgba(255, 107, 0, 0.4)',
            zIndex: 9999,
            transition: 'box-shadow 0.2s ease'
          }}
          title="Scroll to Top"
        >
          <ArrowUp size={20} strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default App;
