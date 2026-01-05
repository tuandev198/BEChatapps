import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import ChatList from '../components/ChatList.jsx';
import ChatRoom from '../components/ChatRoom.jsx';
import FriendList from '../components/FriendList.jsx';
import FriendRequests from '../components/FriendRequests.jsx';
import UserSearch from '../components/UserSearch.jsx';
import ProfileSettings from '../components/ProfileSettings.jsx';

export default function Chat() {
  const { user, logout } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedOtherUser, setSelectedOtherUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chats');

  // ===== LOGIC GIỮ NGUYÊN =====
  const handleSelectChat = (chatId, otherUser) => {
    setSelectedChatId(chatId);
    setSelectedOtherUser(otherUser);
  };

  const handleSelectFriend = (chatId, friend) => {
    setSelectedChatId(chatId);
    setSelectedOtherUser(friend);
    setActiveTab('chats');
  };

  const isInChat = Boolean(selectedChatId);

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* ================= TOP BAR ================= */}
      <div className="h-14 flex items-center px-4 border-b border-slate-700">
        {isInChat ? (
          <>
            <button
              onClick={() => setSelectedChatId(null)}
              className="mr-3 text-cyan-400 text-lg"
            >
              ←
            </button>
            <span className="font-medium">
              {selectedOtherUser?.displayName}
            </span>
          </>
        ) : (
          <div className="flex w-full items-center justify-between">
            <span className="font-semibold capitalize">
              {activeTab}
            </span>
            <button
              onClick={logout}
              className="text-sm text-slate-400"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* ================= CONTENT ================= */}
      <div className="flex-1 overflow-hidden">
        {/* ===== LIST AREA (chỉ ẩn khi đang trong chat) ===== */}
        {!isInChat && (
          <div className="h-full overflow-y-auto">
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
        )}

        {/* ===== CHAT ROOM (luôn giữ nguyên props) ===== */}
        {isInChat && (
          <ChatRoom
            chatId={selectedChatId}
            otherUser={selectedOtherUser}
          />
        )}
      </div>

      {/* ================= BOTTOM TAB ================= */}
      {!isInChat && (
        <div className="h-14 border-t border-slate-700 flex bg-slate-900">
          {[
            ['chats', 'Chats'],
            ['friends', 'Friends'],
            ['requests', 'Requests'],
            ['search', 'Search'],
            ['settings', 'Settings'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 text-xs flex items-center justify-center ${
                activeTab === key
                  ? 'text-cyan-400'
                  : 'text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
