import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import ChatList from '../components/ChatList.jsx';
import ChatRoom from '../components/ChatRoom.jsx';
import FriendList from '../components/FriendList.jsx';
import FriendRequests from '../components/FriendRequests.jsx';
import UserSearch from '../components/UserSearch.jsx';
import ProfileSettings from '../components/ProfileSettings.jsx';

export default function Chat() {
  const { logout } = useAuth();

  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedOtherUser, setSelectedOtherUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chats');

  // UI ONLY
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelectChat = (chatId, otherUser) => {
    setSelectedChatId(chatId);
    setSelectedOtherUser(otherUser);
    setMenuOpen(false);
  };

  const handleSelectFriend = (chatId, friend) => {
    setSelectedChatId(chatId);
    setSelectedOtherUser(friend);
    setActiveTab('chats');
    setMenuOpen(false);
  };

  return (
    <div className="h-screen flex bg-[#F6F5FB] text-slate-800">
      {/* ================= SIDEBAR TRÁI ================= */}
      <aside
        className={`
          fixed md:static z-40 h-full w-72 bg-white shadow-sm border-r border-slate-200
          transform transition-transform duration-300
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Header sidebar */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200">
          <span className="font-semibold">METO CHAT</span>
          <button
            onClick={logout}
            className="text-sm text-slate-500 hover:text-red-500"
          >
            Đăng xuất
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { key: 'chats', label: 'Chat' },
            { key: 'friends', label: 'Bạn bè' },
            { key: 'requests', label: 'Lời mời' },
            { key: 'search', label: 'Tìm kiếm' },
            { key: 'settings', label: 'Cài đặt' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-xs font-medium
                ${
                  activeTab === tab.key
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chats' && (
            <ChatList
              onSelectChat={handleSelectChat}
              selectedChatId={selectedChatId}
            />
          )}
          {activeTab === 'friends' && (
            <FriendList onSelectFriend={handleSelectFriend} />
          )}
          {activeTab === 'requests' && <FriendRequests />}
          {activeTab === 'search' && <UserSearch />}
          {activeTab === 'settings' && <ProfileSettings />}
        </div>
      </aside>

      {/* ================= OVERLAY MOBILE ================= */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ================= KHU VỰC CHAT ================= */}
      <main className="flex-1 flex flex-col">
        {/* TOP BAR MOBILE */}
        <div className="h-14 flex items-center px-4 border-b border-slate-200 md:hidden bg-white">
          <button
            onClick={() => setMenuOpen(true)}
            className="mr-3 text-xl text-indigo-600"
          >
            ☰
          </button>

          <span className="font-medium text-slate-800 truncate">
            {selectedOtherUser?.displayName || 'METO CHAT'}
          </span>
        </div>

        {/* CHAT ROOM */}
        <div className="flex-1 overflow-hidden">
          <ChatRoom
            chatId={selectedChatId}
            otherUser={selectedOtherUser}
          />
        </div>
      </main>

      {/* ================= PANEL PHẢI (desktop) ================= */}
      <aside className="hidden lg:flex w-72 border-l border-slate-200 bg-white">
        <div className="p-4 text-sm text-slate-500">
          <p className="font-medium text-slate-800 mb-2">
            Thông tin người dùng
          </p>
          <p>Chọn một cuộc trò chuyện để xem chi tiết</p>
        </div>
      </aside>
    </div>
  );
}
