import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './i18n';
import './index.css';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import Layout from './layouts/Layout';

// Auth
import Login from './pages/Login';

// Parent Management
import ParentManagement from './pages/ParentManagement';
import ParentPortal from './pages/ParentPortal';
import WaitConfirmation from './pages/WaitConfirmation';

// Public Pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import ServicesPage from './pages/public/ServicesPage';
import NewsPage from './pages/public/NewsPage';
import NewsDetailPage from './pages/public/NewsDetailPage';
import ContactPage from './pages/public/ContactPage';
import ApplyPage from './pages/public/ApplyPage';
import ParentApplyPage from './pages/public/ParentApplyPage';
import RegisterPage from './pages/public/RegisterPage';
import TradeDetailsPage from './pages/public/TradeDetailsPage';
import DrivingRulesPage from './pages/public/DrivingRulesPage';
import DrivingSchoolPage from './pages/public/DrivingSchoolPage';
import DrivingInstructorDashboard from './pages/public/DrivingInstructorDashboard';
import KwigaPage from './pages/public/KwigaPage';
import KwigaTradePage from './pages/public/KwigaTradePage';
import KwigaNotesPage from './pages/public/KwigaNotesPage';
import TeacherDashboard from './pages/TeacherDashboard';
import MobileBottomNav from './components/MobileBottomNav';

// App Pages (Protected)
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Discipline from './pages/Discipline';
import Finance from './pages/Finance';
import Stock from './pages/Stock';
import Parents from './pages/Parents';
import AdminCMS from './pages/AdminCMS';
import AdminLinkManager from './pages/AdminLinkManager';
import AdminStaffManager from './pages/AdminStaffManager';
import Applications from './pages/Applications';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} />
      <Routes>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* Parent Portal (standalone - no admin sidebar) */}
        <Route path="/parent-portal" element={<ParentPortal />} />

        {/* Public Routes (under PublicLayout) */}
        <Route element={<PublicLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/driving-rules" element={<DrivingRulesPage />} />
          <Route path="/driving-school" element={<Navigate to="/driving-rules" replace />} />
          <Route path="/driving-instructor" element={<DrivingInstructorDashboard />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/parent-apply" element={<ParentApplyPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/trade/:tradeName" element={<TradeDetailsPage />} />
          <Route path="/kwiga" element={<KwigaPage />} />
          <Route path="/kwiga/:tradeCode" element={<KwigaTradePage />} />
          <Route path="/kwiga/:tradeCode/:level" element={<KwigaNotesPage />} />
        </Route>

        {/* Teacher Portal (standalone - own header) */}
        <Route path="/teacher" element={<TeacherDashboard />} />

        {/* Protected App Routes (under Layout) */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/students" element={<Students />} />
          <Route path="/discipline" element={<Discipline />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/parents" element={<Parents />} />
          <Route path="/parent-management" element={<ParentManagement />} />
          <Route path="/wait-confirmation" element={<WaitConfirmation />} />
          <Route path="/cms" element={<AdminCMS />} />
          <Route path="/link-manager" element={<AdminLinkManager />} />
          <Route path="/staff" element={<AdminStaffManager />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

      </Routes>
      <MobileBottomNav />
    </Router>
  );
}

export default App;
