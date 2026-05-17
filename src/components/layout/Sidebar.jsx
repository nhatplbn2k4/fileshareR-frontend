import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import billingService from '../../services/billingService';
import StorageProgress from '../StorageProgress';
import {
  LayoutDashboard,
  FileText,
  Folder,
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  ChevronDown,
  Users,
  ShieldCheck,
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [storage, setStorage] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (user) {
      billingService.getMyStorage()
        .then((info) => mounted && setStorage(info))
        .catch(() => {});
    }
    return () => { mounted = false; };
  }, [user?.id]);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tổng Quan' },
    { path: '/documents', icon: FileText, label: 'Tài Liệu' },
    { path: '/folders', icon: Folder, label: 'Thư Mục' },
    { path: '/groups', icon: Users, label: 'Nhóm' },
    { path: '/search', icon: Search, label: 'Tìm Kiếm' },
    { path: '/settings', icon: Settings, label: 'Cài Đặt' },
  ];


  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 w-64`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-ocean-500 to-ocean-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FileShareR</span>
          </Link>
          <button onClick={toggleSidebar} className="lg:hidden text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive
                    ? 'bg-gradient-to-r from-ocean-500 to-ocean-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-ocean-50'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin link (visible only for ADMIN role) */}
        {user?.role === 'ADMIN' && (
          <div className="px-4 pb-4">
            <Link
              to="/admin/dashboard"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow hover:shadow-md transition-shadow"
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="font-medium">Admin Panel</span>
            </Link>
          </div>
        )}

        {/* Storage mini progress */}
        {storage && (
          <Link to="/settings" className="block border-t border-gray-200 hover:bg-gray-50">
            <StorageProgress
              used={storage.storageUsed}
              total={storage.totalQuotaBytes}
              compact
            />
          </Link>
        )}

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.authProvider && user.authProvider !== 'LOCAL'
                    ? (user.authProvider === 'GOOGLE' ? 'Google' : 'Facebook')
                    : user?.email}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Profile menu */}
            {showProfileMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <Link
                  to="/settings"
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Cài Đặt</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-red-50 text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Đăng Xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
