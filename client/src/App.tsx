import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DemoBanner } from './components/DemoBanner';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Role-Specific Layouts
import { StudentLayout } from './components/StudentLayout';
import { StaffLayout } from './components/StaffLayout';
import { AdminLayout } from './components/AdminLayout';

// Public & Shared Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ServiceListingPage } from './pages/ServiceListingPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { JoinQueuePage } from './pages/JoinQueuePage';
import { DigitalTokenPage } from './pages/DigitalTokenPage';
import { LiveQueueTrackingPage } from './pages/LiveQueueTrackingPage';
import { AppointmentBookingPage } from './pages/AppointmentBookingPage';
import { NotificationCenterPage } from './pages/NotificationCenterPage';
import { QueueHistoryPage } from './pages/QueueHistoryPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { PublicDisplayBoardPage } from './pages/PublicDisplayBoardPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Role-Specific Pages
import { StudentDashboard } from './pages/StudentDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { StudentManagementPage } from './pages/StudentManagementPage';
import { StaffManagementPage } from './pages/StaffManagementPage';
import { SystemSettingsPage } from './pages/SystemSettingsPage';
import { ServiceManagementPage } from './pages/ServiceManagementPage';
import { QueueManagementPage } from './pages/QueueManagementPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

// Helper redirector for legacy / ambiguous routes (/dashboard, /services, etc.)
const RoleBasedRedirect: React.FC = () => {
  const { user, loading, getDashboardRoute } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardRoute(user.role)} replace />;
};

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const isDisplayKiosk = location.pathname === '/display';

  if (isDisplayKiosk) {
    return (
      <Routes>
        <Route path="/display" element={<PublicDisplayBoardPage />} />
      </Routes>
    );
  }

  const isRoleRoute = (
    location.pathname.startsWith('/student') ||
    location.pathname.startsWith('/staff') ||
    location.pathname.startsWith('/admin')
  );

  return (
    <>
      <DemoBanner />
      {/* Public Navbar shown on public marketing/auth pages */}
      {!isRoleRoute && <Navbar />}

      <Routes>
        {/* ============================================================ */}
        {/* PUBLIC & VISITOR ROUTES                                      */}
        {/* ============================================================ */}
        <Route path="/" element={<><LandingPage /><Footer /></>} />
        <Route path="/login" element={<><LoginPage /><Footer /></>} />
        <Route path="/register" element={<><RegisterPage /><Footer /></>} />
        <Route path="/forbidden" element={<><AccessDeniedPage /><Footer /></>} />
        <Route path="/services" element={<><ServiceListingPage /><Footer /></>} />
        <Route path="/services/:id" element={<><ServiceDetailPage /><Footer /></>} />
        <Route path="/services/:id/join" element={<><JoinQueuePage /><Footer /></>} />
        <Route path="/token/:id" element={<><DigitalTokenPage /><Footer /></>} />
        <Route path="/track/:id" element={<><LiveQueueTrackingPage /><Footer /></>} />

        {/* Backward-compatibility and smart role redirects */}
        <Route path="/dashboard" element={<RoleBasedRedirect />} />
        <Route path="/appointments" element={<Navigate to="/student/appointments" replace />} />
        <Route path="/history" element={<Navigate to="/student/history" replace />} />
        <Route path="/notifications" element={<Navigate to="/student/notifications" replace />} />
        <Route path="/profile" element={<RoleBasedRedirect />} />

        {/* ============================================================ */}
        {/* STUDENT MODULE (/student/*) — STRICT STUDENT RBAC            */}
        {/* ============================================================ */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="services" element={<ServiceListingPage />} />
          <Route path="services/:id" element={<ServiceDetailPage />} />
          <Route path="services/:id/join" element={<JoinQueuePage />} />
          <Route path="token/:id" element={<DigitalTokenPage />} />
          <Route path="track/:id" element={<LiveQueueTrackingPage />} />
          <Route path="appointments" element={<AppointmentBookingPage />} />
          <Route path="history" element={<QueueHistoryPage />} />
          <Route path="notifications" element={<NotificationCenterPage />} />
          <Route path="profile" element={<UserProfilePage />} />
        </Route>

        {/* ============================================================ */}
        {/* STAFF MODULE (/staff/*) — STRICT STAFF RBAC                  */}
        {/* ============================================================ */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="queue" element={<QueueManagementPage />} />
          <Route path="queue/:serviceId" element={<QueueManagementPage />} />
          <Route path="history" element={<QueueHistoryPage />} />
          <Route path="stats" element={<StaffDashboard />} />
          <Route path="profile" element={<UserProfilePage />} />
        </Route>

        {/* ============================================================ */}
        {/* ADMIN MODULE (/admin/*) — STRICT ADMIN RBAC                  */}
        {/* ============================================================ */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<StudentManagementPage />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="services" element={<ServiceManagementPage />} />
          <Route path="queues" element={<QueueManagementPage />} />
          <Route path="queues/:serviceId" element={<QueueManagementPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SystemSettingsPage />} />
          <Route path="profile" element={<UserProfilePage />} />
        </Route>

        {/* Fallback 404 Route */}
        <Route path="*" element={<><NotFoundPage /><Footer /></>} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
