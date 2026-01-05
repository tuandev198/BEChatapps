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
    <div className="h-screen flex bg-slate-900 text-slate-100">
      {/* ================= LEFT SIDEBAR ================= */}
      <aside
        className={`
          fixed md:static z-40 h-full w-72 bg-slate-900 border-r border-slate-700
          transform transition-transform duration-300
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-700">
          <span className="font-semibold">Chats</span>
          <button onClick={logout} className="text-sm text-slate-400">
            Logout
          </button>
        </div>

        <div className="flex border-b border-slate-700">
          {['chats', 'friends', 'requests', 'search', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs capitalize ${
                activeTab === tab
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

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

      {/* ================= OVERLAY (mobile) ================= */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ================= MAIN CHAT ================= */}
      <main className="flex-1 flex flex-col">
        {/* TOP BAR (mobile) */}
        <div className="h-14 flex items-center px-4 border-b border-slate-700 md:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="mr-3 text-xl text-cyan-400"
          >
            ☰
          </button>

          <span className="font-medium">
            {selectedOtherUser?.displayName || 'Chat'}
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

      {/* ================= RIGHT INFO (desktop only) ================= */}
      <aside className="hidden lg:flex w-72 border-l border-slate-700 bg-slate-900">
        <div className="p-4 text-sm text-slate-400">
          <p className="font-medium text-slate-200 mb-2">
            User Info
          </p>
          <p>Select a chat to view details</p>
        </div>
      </aside>
    </div>
  );
}
