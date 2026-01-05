import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getInitials } from '../utils/helpers.js';
import { useNotifications } from '../hooks/useNotifications.js';
import NotificationCenter from './NotificationCenter.jsx';

export default function Navigation() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications(user?.uid);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg md:relative md:border-t-0 md:border-r md:h-full md:w-20 md:flex md:flex-col z-50">
        <div className="flex md:flex-col items-center justify-around h-16 md:h-full md:py-4 md:justify-start md:gap-4">
          {/* Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              isActive('/') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Trang chủ"
          >
            <span className="text-2xl">🏠</span>
            <span className="text-xs mt-1 hidden md:block">Trang chủ</span>
          </Link>

          {/* Search */}
          <Link
            to="/search"
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              isActive('/search') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Tìm kiếm"
          >
            <span className="text-2xl">🔍</span>
            <span className="text-xs mt-1 hidden md:block">Tìm kiếm</span>
          </Link>

          {/* Chat */}
          <Link
            to="/chat"
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              isActive('/chat') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Tin nhắn"
          >
            <span className="text-2xl">💬</span>
            <span className="text-xs mt-1 hidden md:block">Tin nhắn</span>
          </Link>

          {/* Friends */}
          <Link
            to="/friends"
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              isActive('/friends') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Bạn bè"
          >
            <span className="text-2xl">👥</span>
            <span className="text-xs mt-1 hidden md:block">Bạn bè</span>
          </Link>

          {/* Requests (mobile only - show badge) */}
          <Link
            to="/requests"
            className={`md:hidden flex flex-col items-center justify-center p-2 rounded-lg transition-colors relative ${
              isActive('/requests') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Lời mời"
          >
            <span className="text-2xl">📩</span>
            <span className="text-xs mt-1">Lời mời</span>
          </Link>

          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              showNotifications ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Thông báo"
          >
            <span className="text-2xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span className="text-xs mt-1 hidden md:block">Thông báo</span>
          </button>

          {/* Profile */}
          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              isActive('/profile') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Cá nhân"
          >
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName || 'Profile'}
                className={`w-8 h-8 rounded-full object-cover border-2 ${
                  isActive('/profile') ? 'border-indigo-600' : 'border-transparent'
                }`}
              />
            ) : (
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm border-2 ${
                isActive('/profile') ? 'border-indigo-600' : 'border-transparent'
              }`}>
                {getInitials(profile?.displayName || user?.email || 'U')}
              </div>
            )}
            <span className="text-xs mt-1 hidden md:block">Cá nhân</span>
          </Link>

          {/* Settings (desktop only) */}
          <Link
            to="/settings"
            className={`hidden md:flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              isActive('/settings') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Cài đặt"
          >
            <span className="text-2xl">⚙️</span>
            <span className="text-xs mt-1">Cài đặt</span>
          </Link>

          {/* Logout (desktop only) */}
          <button
            onClick={logout}
            className="hidden md:flex flex-col items-center justify-center p-2 rounded-lg text-slate-400 hover:text-red-600 transition-colors mt-auto"
            title="Đăng xuất"
          >
            <span className="text-2xl">🚪</span>
            <span className="text-xs mt-1">Đăng xuất</span>
          </button>
        </div>
      </nav>

      {/* Mobile menu button for requests and settings */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="md:hidden fixed top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center z-40"
      >
        <span className="text-xl">☰</span>
      </button>

      {/* Mobile menu */}
      {showMenu && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => setShowMenu(false)}
          />
          <div className="md:hidden fixed top-16 right-4 bg-white rounded-lg shadow-xl z-40 min-w-[200px] py-2">
            <Link
              to="/requests"
              onClick={() => setShowMenu(false)}
              className="block px-4 py-2 hover:bg-slate-100 text-slate-700"
            >
              📩 Lời mời kết bạn
            </Link>
            <Link
              to="/settings"
              onClick={() => setShowMenu(false)}
              className="block px-4 py-2 hover:bg-slate-100 text-slate-700"
            >
              ⚙️ Cài đặt
            </Link>
            <button
              onClick={() => {
                setShowMenu(false);
                logout();
              }}
              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
            >
              🚪 Đăng xuất
            </button>
          </div>
        </>
      )}

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}

