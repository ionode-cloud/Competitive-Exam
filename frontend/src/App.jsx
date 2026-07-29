import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Existing user-facing
import Header           from './components/Header';
import Footer           from './components/Footer';
import ScrollToTopButton from './components/ScrollToTopButton';
import LandingPage      from './pages/LandingPage';
import ExamSectionPage  from './pages/ExamSectionPage';
import SubjectTestPage  from './pages/SubjectTestPage';
import MockTestPage     from './pages/MockTestPage';
import PYQEbookPage     from './pages/PYQEbookPage';
import MaterialsPage    from './pages/MaterialsPage';
import ContactUsPage    from './pages/ContactUsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import UserProfilePage  from './pages/UserProfilePage';
import PolicyPage       from './pages/PolicyPage';

// Admin panel
import AdminLayout      from './admin/layouts/AdminLayout';
import Dashboard        from './admin/pages/Dashboard';
import OdishaExams      from './admin/pages/OdishaExams';
import MockTests        from './admin/pages/MockTests';
import ManageMockTest   from './admin/pages/ManageMockTest';
import CreateMockTest   from './admin/pages/CreateMockTest';
import QuestionBank     from './admin/pages/QuestionBank';
import Subjects         from './admin/pages/Subjects';
import EBooks           from './admin/pages/EBooks';
import Materials        from './admin/pages/Materials';
import MaterialCategories from './admin/pages/MaterialCategories';
import Students         from './admin/pages/Students';
import AdminCredentials from './admin/pages/AdminCredentials';
import Orders           from './admin/pages/Orders';
import Payments         from './admin/pages/Payments';
import Reports          from './admin/pages/Reports';
import Notifications    from './admin/pages/Notifications';
import Subscription     from './admin/pages/Subscription';
import SubscriptionsManager from './admin/pages/SubscriptionsManager';
import SubjectTestsManager  from './admin/pages/SubjectTestsManager';
import ContactMessages     from './admin/pages/ContactMessages';

// Student Exam Engine
import ExamInstructionPage   from './pages/ExamInstructionPage';
import SubjectTestExamPage   from './pages/SubjectTestExamPage';
import SubjectTestResultPage from './pages/SubjectTestResultPage';

// Contexts
import { AuthProvider } from './admin/context/AuthContext';
import { ThemeProvider } from './admin/context/ThemeContext';

// User-facing layout wrapper
function UserLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ style: { borderRadius: '10px', background: '#1e293b', color: '#f1f5f9' } }} />
          <ScrollToTopButton />
          <Routes>
            {/* Redirect /login to open login modal on portal */}
            <Route path="/login" element={<Navigate to="/?login=true" replace />} />

            {/* Admin Panel (protected by AdminLayout) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="exams" element={<OdishaExams />} />
              <Route path="mock-tests" element={<MockTests />} />
              <Route path="manage-mock-tests" element={<ManageMockTest />} />
              <Route path="mock-tests/create" element={<CreateMockTest />} />
              <Route path="mock-tests/:id/edit" element={<CreateMockTest />} />
              <Route path="question-bank" element={<QuestionBank />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="ebooks"       element={<EBooks />} />
              <Route path="materials"    element={<Materials />} />
              <Route path="material-categories" element={<MaterialCategories />} />
              <Route path="students" element={<Students />} />
              <Route path="credentials" element={<AdminCredentials />} />
              <Route path="orders" element={<Orders />} />
              <Route path="payments" element={<Payments />} />
              <Route path="reports" element={<Reports />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="subscription"   element={<Subscription />} />
              <Route path="subscriptions"  element={<SubscriptionsManager />} />
              <Route path="subject-tests"  element={<SubjectTestsManager />} />
              <Route path="contacts"       element={<ContactMessages />} />
            </Route>

            {/* User-facing pages */}
            <Route path="/" element={<UserLayout><LandingPage /></UserLayout>} />
            <Route path="/exam-section" element={<UserLayout><ExamSectionPage /></UserLayout>} />
            <Route path="/subject-test" element={<UserLayout><SubjectTestPage /></UserLayout>} />
            <Route path="/subject-test/instructions/:testId" element={<UserLayout><ExamInstructionPage /></UserLayout>} />
            <Route path="/subject-test/exam/:attemptId" element={<SubjectTestExamPage />} />
            <Route path="/subject-test/result/:attemptId" element={<UserLayout><SubjectTestResultPage /></UserLayout>} />
            <Route path="/mock-test" element={<UserLayout><MockTestPage /></UserLayout>} />
            <Route path="/pyq-ebook" element={<UserLayout><PYQEbookPage /></UserLayout>} />
            <Route path="/materials" element={<UserLayout><MaterialsPage /></UserLayout>} />
            <Route path="/contact" element={<UserLayout><ContactUsPage /></UserLayout>} />
            <Route path="/subscription" element={<UserLayout><SubscriptionPage /></UserLayout>} />
            <Route path="/profile" element={<UserLayout><UserProfilePage /></UserLayout>} />
            <Route path="/privacy-policy" element={<UserLayout><PolicyPage type="privacy-policy" /></UserLayout>} />
            <Route path="/terms" element={<UserLayout><PolicyPage type="terms" /></UserLayout>} />
            <Route path="/refund-policy" element={<UserLayout><PolicyPage type="refund-policy" /></UserLayout>} />
            <Route path="/disclaimer" element={<UserLayout><PolicyPage type="disclaimer" /></UserLayout>} />
            <Route path="/about-us" element={<UserLayout><PolicyPage type="about-us" /></UserLayout>} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
