import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ChatList from '../components/ChatList.jsx';
import ChatRoom from '../components/ChatRoom.jsx';
import Navigation from '../components/Navigation.jsx';

export default function Chat() {
  const location = useLocation();
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedOtherUser, setSelectedOtherUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Get chatId and otherUser from navigation state (when coming from Friends page)
  useEffect(() => {
    if (location.state?.chatId && location.state?.otherUser) {
      setSelectedChatId(location.state.chatId);
      setSelectedOtherUser(location.state.otherUser);
    }
  }, [location.state]);

  const handleSelectChat = (chatId, otherUser) => {
    setSelectedChatId(chatId);
    setSelectedOtherUser(otherUser);
    setMenuOpen(false);
  };

  return (
    <div className="h-screen flex bg-[#F6F5FB] text-slate-800">
      <Navigation />
      
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
          <span className="font-semibold text-indigo-600">Tin nhắn</span>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          <ChatList
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChatId}
          />
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
            {selectedOtherUser?.displayName || 'Tin nhắn'}
          </span>
        </div>

        {/* CHAT ROOM */}
        <div className="flex-1 overflow-hidden">
          {selectedChatId ? (
            <ChatRoom
              chatId={selectedChatId}
              otherUser={selectedOtherUser}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <p className="text-lg mb-2">Chọn cuộc trò chuyện để bắt đầu</p>
                <p className="text-sm">Hoặc tìm bạn bè để nhắn tin</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
