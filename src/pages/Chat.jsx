import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import ChatList from '../components/ChatList.jsx';
import ChatRoom from '../components/ChatRoom.jsx';
import FriendList from '../components/FriendList.jsx';
import FriendRequests from '../components/FriendRequests.jsx';
import UserSearch from '../components/UserSearch.jsx';
import ProfileSettings from '../components/ProfileSettings.jsx';

/**
 * Main chat page with sidebar and chat window
 */
export default function Chat() {
  const { user, logout } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedOtherUser, setSelectedOtherUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'friends', 'requests', 'search', 'settings'

  const handleSelectChat = (chatId, otherUser) => {
    setSelectedChatId(chatId);
    setSelectedOtherUser(otherUser);
  };

  const handleSelectFriend = (chatId, friend) => {
    setSelectedChatId(chatId);
    setSelectedOtherUser(friend);
    setActiveTab('chats');
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <div className="sidebar">
        {/* User header */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-slate-100">Firebase Chat</h1>
            <button
              onClick={logout}
              className="btn-ghost text-sm"
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'chats'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'friends'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Friends
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 text-sm font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Requests
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden flex flex-col">
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
      </div>

      {/* Chat window */}
      <div className="chat-main">
        <ChatRoom chatId={selectedChatId} otherUser={selectedOtherUser} />
      </div>
    </div>
  );
}


