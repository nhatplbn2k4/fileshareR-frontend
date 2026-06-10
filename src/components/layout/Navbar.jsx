import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
import SearchBox from '../SearchBox';

const Navbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors duration-200"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search bar */}
        <div className="hidden md:block w-96">
          <SearchBox
            variant="navbar"
            placeholder="Tìm kiếm tài liệu, nhóm..."
            onSubmit={(kw) => navigate(`/search?q=${encodeURIComponent(kw)}`)}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <NotificationBell />

        {/* User info */}
        <div className="hidden md:flex items-center space-x-2">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
