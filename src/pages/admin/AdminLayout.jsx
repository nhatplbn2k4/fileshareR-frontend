import React, { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Package,
  UsersRound,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import NotificationBell from '../../components/notifications/NotificationBell';
import plagiarismService from '../../services/plagiarismService';

const adminMenu = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Tổng Quan' },
  { path: '/admin/users', icon: Users, label: 'Người Dùng' },
  { path: '/admin/plans', icon: Package, label: 'Gói & Addon' },
  { path: '/admin/documents', icon: FileText, label: 'Tài Liệu' },
  { path: '/admin/payments', icon: CreditCard, label: 'Giao Dịch' },
  { path: '/admin/groups', icon: UsersRound, label: 'Nhóm' },
  { path: '/admin/plagiarism', icon: Copy, label: 'Đạo Văn', badgeKey: 'plagiarism' },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { items } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plagiarismPending, setPlagiarismPending] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const refreshPlagiarismCount = useCallback(async () => {
    try {
      const count = await plagiarismService.pendingCount();
      setPlagiarismPending(count || 0);
    } catch (e) {
      // Best-effort badge — không hiển thị nếu fail
    }
  }, []);

  // Initial fetch + khi notification mới về PLAGIARISM_REPORT thì refresh
  useEffect(() => {
    refreshPlagiarismCount();
  }, [refreshPlagiarismCount]);

  useEffect(() => {
    const hasNewPlagiarism = items.some((n) => n.type === 'PLAGIARISM_REPORT');
    if (hasNewPlagiarism) refreshPlagiarismCount();
  }, [items, refreshPlagiarismCount]);

  // Refresh khi chuyển route admin (admin vừa resolve report → count giảm)
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      refreshPlagiarismCount();
    }
  }, [location.pathname, refreshPlagiarismCount]);

  const badgeValueFor = (key) => {
    if (key === 'plagiarism' && plagiarismPending > 0) return plagiarismPending;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 flex flex-col w-64 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600">
          <Link to="/admin/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Admin Panel</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {adminMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            const badge = badgeValueFor(item.badgeKey);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium flex-1">{item.label}</span>
                {badge != null && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white text-purple-600'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Back to user view */}
        <Link
          to="/dashboard"
          className="flex items-center space-x-3 px-6 py-3 border-t border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Về giao diện user</span>
        </Link>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-xs text-purple-600 font-medium">ADMIN</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Đăng Xuất</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar (mobile) */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="ml-4 font-semibold text-gray-900">Admin Panel</h1>
          </div>
          <NotificationBell />
        </header>

        {/* Top bar (desktop) — slim, hosts notification bell */}
        <header className="hidden lg:flex h-14 bg-white border-b border-gray-200 items-center justify-end px-8 sticky top-0 z-30">
          <NotificationBell />
        </header>

        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
