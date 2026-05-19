import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import BlockingNotificationModal from './components/notifications/BlockingNotificationModal';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Folders from './pages/Folders';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Search from './pages/Search';
import Settings from './pages/Settings';
import SharedFolder from './pages/SharedFolder';
import SharedGroupLanding from './pages/SharedGroupLanding';
import SharedGroupFolder from './pages/SharedGroupFolder';
import UserProfile from './pages/UserProfile';
import PaymentResult from './pages/PaymentResult';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPlaceholder from './pages/admin/AdminPlaceholder';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPlans from './pages/admin/AdminPlans';
import AdminDocuments from './pages/admin/AdminDocuments';
import AdminPayments from './pages/admin/AdminPayments';
import AdminGroups from './pages/admin/AdminGroups';
import AdminGroupCovers from './pages/admin/AdminGroupCovers';
import AdminPlagiarism from './pages/admin/AdminPlagiarism';
import ProtectedAdminRoute from './pages/admin/ProtectedAdminRoute';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Xóa returnTo SAU khi đã redirect (useEffect chạy sau commit, an toàn với StrictMode)
  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.removeItem('returnTo');
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Chỉ ĐỌC — không xóa ở đây (render có thể chạy nhiều lần trong StrictMode)
    const returnTo = sessionStorage.getItem('returnTo');
    return <Navigate to={returnTo || '/dashboard'} replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
        <NotificationProvider>
        <BlockingNotificationModal />
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/verify-email"
            element={
              <PublicRoute>
                <VerifyEmail />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/folders"
            element={
              <ProtectedRoute>
                <Folders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId"
            element={<GroupDetail />}
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <Search />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Profile công khai */}
          <Route path="/users/:userId" element={<UserProfile />} />

          {/* Shared folder qua share token — PUBLIC không cần login, LINK_ONLY cần login (service backend tự enforce) */}
          <Route path="/shared/:token" element={<SharedFolder />} />

          {/* Invite link nhóm */}
          <Route path="/shared/group/:token" element={<SharedGroupLanding />} />

          {/* Group folder share link (chỉ group PUBLIC) */}
          <Route path="/shared/group-folder/:token" element={<SharedGroupFolder />} />

          {/* Payment gateway callback (VNPay/MoMo redirect — public, no auth required) */}
          <Route path="/payment/result" element={<PaymentResult />} />

          {/* Admin Panel — ROLE_ADMIN only; backend also enforces hasRole('ADMIN') */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="groups" element={<AdminGroups />} />
            <Route path="group-covers" element={<AdminGroupCovers />} />
            <Route path="plagiarism" element={<AdminPlagiarism />} />
            <Route path="plagiarism/:docId" element={<AdminPlagiarism />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 - Not found */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-900">404</h1>
                  <p className="text-xl text-gray-600 mt-4">Không tìm thấy trang</p>
                  <a
                    href="/dashboard"
                    className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg hover:from-ocean-600 hover:to-ocean-700 transition duration-200"
                  >
                    Về Trang Chủ
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
        </NotificationProvider>
      </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
