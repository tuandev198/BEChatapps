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
  const [sidebarOpen, setSidebarOpen] = useState(true); // Desktop: mặc định mở

  // Get chatId and otherUser from navigation state (when coming from Friends page)
  useEffect(() => {
    if (location.state?.chatId && location.state?.otherUser) {
      setSelectedChatId(location.state.chatId);
      setSelectedOtherUser(location.state.otherUser);
      setSidebarOpen(false); // Đóng sidebar khi có chat được chọn
    }
  }, [location.state]);

  const handleSelectChat = (chatId, otherUser) => {
    setSelectedChatId(chatId);
    setSelectedOtherUser(otherUser);
    setMenuOpen(false); // Đóng mobile menu
    setSidebarOpen(false); // Đóng sidebar để hiển thị chat full screen
  };

  return (
    <div className="h-screen flex bg-[#F6F5FB] text-slate-800">
      <Navigation />
      
      {/* ================= SIDEBAR TRÁI ================= */}
      <aside
        className={`
          fixed md:absolute z-40 h-full w-72 bg-white shadow-sm border-r border-slate-200
          transform transition-transform duration-300 ease-in-out
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarOpen ? 'md:translate-x-0' : 'md:-translate-x-full'}
        `}
      >
        {/* Header sidebar */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200">
          <span className="font-semibold text-indigo-600">Tin nhắn</span>
          {/* Nút đóng sidebar trên desktop */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="hidden md:block text-slate-500 hover:text-slate-700 text-xl"
            title="Đóng menu"
          >
            ✕
          </button>
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
      <main className="flex-1 flex flex-col md:transition-all md:duration-300">
        {/* TOP BAR - Hiển thị trên cả mobile và desktop khi sidebar đóng */}
        <div className={`h-14 flex items-center px-4 border-b border-slate-200 bg-white ${
          sidebarOpen ? 'md:hidden' : ''
        }`}>
          <button
            onClick={() => {
              setMenuOpen(true);
              setSidebarOpen(true);
            }}
            className="mr-3 text-xl text-indigo-600"
            title="Mở menu"
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
            // Hiển thị danh sách trò chuyện khi chưa chọn chat
            <div className="h-full overflow-y-auto bg-[#F6F5FB]">
              {/* Header khi chưa chọn chat */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
                <h2 className="font-semibold text-slate-800">Cuộc trò chuyện</h2>
              </div>
              {/* Danh sách trò chuyện */}
              <div className="px-3 py-4">
                <ChatList
                  onSelectChat={handleSelectChat}
                  selectedChatId={selectedChatId}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
