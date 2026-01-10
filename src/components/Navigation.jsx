import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getInitials } from '../utils/helpers.js';
import { useNotifications } from '../hooks/useNotifications.js';
import NotificationCenter from './NotificationCenter.jsx';

import {
  Home,
  Search,
  MessageCircle,
  Users,
  User,
  Bell,
  Mail,
  Smile,
  Settings,
  LogOut,
  Menu
} from 'lucide-react';

export default function Navigation() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications(user?.uid);

  const isActive = (path) => location.pathname === path;
  const iconClass = 'w-6 h-6';

  const navItemClass = (path) =>
    `flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
      isActive(path)
        ? 'text-indigo-600 bg-indigo-50'
        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <>
      {/* NAV BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg
        md:relative md:border-t-0 md:border-r md:h-full md:w-20 md:flex md:flex-col z-50"
      >
        <div className="flex md:flex-col items-center justify-around h-16 md:h-full md:py-4 md:justify-start md:gap-4">

          <Link to="/" className={navItemClass('/')} title="Trang chủ">
            <Home className={iconClass} />
            <span className="text-xs mt-1 hidden md:block">Trang chủ</span>
          </Link>

          <Link to="/search" className={navItemClass('/search')} title="Tìm kiếm">
            <Search className={iconClass} />
            <span className="text-xs mt-1 hidden md:block">Tìm kiếm</span>
          </Link>

          <Link to="/chat" className={navItemClass('/chat')} title="Tin nhắn">
            <MessageCircle className={iconClass} />
            <span className="text-xs mt-1 hidden md:block">Tin nhắn</span>
          </Link>
{/* 
          <Link to="/friends" className={navItemClass('/friends')} title="Bạn bè">
            <Users className={iconClass} />
            <span className="text-xs mt-1 hidden md:block">Bạn bè</span>
          </Link> */}

          {/* Requests (mobile) */}
          {/* <Link
            to="/requests"
            className={`md:hidden ${navItemClass('/requests')}`}
            title="Lời mời"
          >
            <Mail className={iconClass} />
            <span className="text-xs mt-1">Lời mời</span>
          </Link> */}

          {/* Notifications */}
          {/* <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
              showNotifications
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title="Thông báo"
          >
            <Bell className={iconClass} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span className="text-xs mt-1 hidden md:block">Thông báo</span>
          </button> */}

          {/* Profile */}
          <Link to="/profile" className={navItemClass('/profile')} title="Cá nhân">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt="Profile"
                className={`w-8 h-8 rounded-full object-cover border-2 ${
                  isActive('/profile') ? 'border-indigo-600' : 'border-transparent'
                }`}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500
                flex items-center justify-center text-white font-semibold text-sm"
              >
                {getInitials(profile?.displayName || user?.email || 'U')}
              </div>
            )}
            <span className="text-xs mt-1 hidden md:block">Cá nhân</span>
          </Link>

          {/* Settings (desktop) */}
          <Link
            to="/settings"
            className={`hidden md:flex ${navItemClass('/settings')}`}
            title="Cài đặt"
          >
            <Settings className={iconClass} />
            <span className="text-xs mt-1">Cài đặt</span>
          </Link>

          {/* Logout (desktop) */}
          <button
            onClick={logout}
            className="hidden md:flex flex-col items-center justify-center p-2 rounded-lg
              text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all mt-auto"
            title="Đăng xuất"
          >
            <LogOut className={iconClass} />
            <span className="text-xs mt-1">Đăng xuất</span>
          </button>
        </div>
      </nav>

      {/* MOBILE MENU BUTTON */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="md:hidden fixed top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg
          flex items-center justify-center z-40"
      >
        <Smile className="w-5 h-5" />
      </button>

      {/* MOBILE MENU */}
      {showMenu && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => setShowMenu(false)}
          />
          <div className="md:hidden fixed top-16 right-4 bg-white rounded-lg shadow-xl
            z-40 min-w-[200px] py-2"
          >
            <Link
              to="/requests"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100"
            >
              <Mail className="w-4 h-4" /> Lời mời kết bạn
            </Link>

            <Link
              to="/settings"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100"
            >
              <Settings className="w-4 h-4" /> Cài đặt
            </Link>

            <button
              onClick={() => {
                setShowMenu(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </>
      )}

      {/* NOTIFICATION CENTER */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
