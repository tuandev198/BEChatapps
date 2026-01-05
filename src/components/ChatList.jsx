import { useEffect, useState } from 'react';
import { listenToChats } from '../services/chatService.js';
import { getUserById } from '../services/friendService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatTimestamp } from '../utils/helpers.js';
import { getInitials } from '../utils/helpers.js';

/**
 * Chat list component showing all user's chats
 */
export default function ChatList({ onSelectChat, selectedChatId }) {
  const { user } = useAuth();

  // ⭐ null = chưa load, [] = đã load nhưng rỗng
  const [chats, setChats] = useState(null);
  const [chatUsers, setChatUsers] = useState({});

useEffect(() => {
  if (!user) return;

  const unsubscribe = listenToChats(user.uid, async (chatsList) => {
    // 🔥 FIX QUAN TRỌNG
    setChats(chatsList || []);
    console.log(chatsList)

    const usersMap = {};
    await Promise.all(
      (chatsList || []).map(async (chat) => {
        if (chat.otherUid && !usersMap[chat.otherUid]) {
          const otherUser = await getUserById(chat.otherUid);
          if (otherUser) {
            usersMap[chat.otherUid] = otherUser;
          }
        }
      })
    );

    setChatUsers(usersMap);
  });

  return () => unsubscribe();
}, [user]);
console.log(chats)


  // ⏳ Đang load
  if (chats === null) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        Đang tải cuộc trò chuyện...
      </div>
    );
  }

  // 📭 Không có chat
  if (chats.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        Chưa có cuộc trò chuyện nào
      </div>
    );
  }

  // ✅ Có chat
  return (
    <div className="flex-1 overflow-y-auto bg-[#F6F5FB] px-3 py-4">
      {chats.map((chat) => {
        const otherUser = chatUsers[chat.otherUid];

        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id, otherUser)}
            className={`w-full mb-3 p-3 rounded-2xl text-left transition
              ${
                selectedChatId === chat.id
                  ? 'bg-white shadow ring-2 ring-indigo-400'
                  : 'bg-white hover:shadow-md'
              }`}
          >
            <div className="flex items-center gap-3">
              {otherUser?.photoURL ? (
                <img
                  src={otherUser.photoURL}
                  alt={otherUser.displayName || 'User'}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {getInitials(
                    otherUser?.displayName || otherUser?.email || 'U'
                  )}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {otherUser?.displayName || otherUser?.email || 'Người dùng'}
                </div>

                <div className="text-xs text-slate-400 truncate">
                  {chat.lastMessage || 'Chưa có tin nhắn'}
                </div>

                {chat.updatedAt && (
                  <div className="text-[11px] text-slate-400 mt-1">
                    {formatTimestamp(chat.updatedAt)}
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
