import { useEffect, useState, useRef } from 'react';
import { listenToChats, deleteChat } from '../services/chatService.js';
import { getUserById } from '../services/friendService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatTimestamp, getInitials } from '../utils/helpers.js';
import { SkeletonLoader } from './Loading.jsx';

const MIN_LOADING_TIME = 1200; // ⭐ loading tối thiểu 1.2s

/**
 * Chat list component
 */
export default function ChatList({ onSelectChat, selectedChatId }) {
  const { user } = useAuth();

  // null = chưa load, [] = đã load nhưng rỗng
  const [chats, setChats] = useState(null);
  const [chatUsers, setChatUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingChatId, setDeletingChatId] = useState(null);

  // cache user đã fetch → tránh gọi API lại
  const usersCacheRef = useRef({});

  useEffect(() => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const startTime = Date.now();

    setLoading(true);
    setChats([]);

    const unsubscribe = listenToChats(user.uid, async (chatsList) => {
      if (!isMounted) return;

      try {
        const safeChats = Array.isArray(chatsList) ? chatsList : [];

        /** 🕒 đảm bảo loading tối thiểu */
        const finishLoading = () => {
          if (!isMounted) return;
          setChats(safeChats);
          setLoading(false);
        };

        const elapsed = Date.now() - startTime;
        const remaining = MIN_LOADING_TIME - elapsed;

        if (remaining > 0) {
          setTimeout(finishLoading, remaining);
        } else {
          finishLoading();
        }

        /** 👤 fetch user info song song */
        const usersMap = { ...usersCacheRef.current };

        await Promise.all(
          safeChats.map(async (chat) => {
            if (!chat.otherUid || usersMap[chat.otherUid]) return;

            try {
              const userData = await getUserById(chat.otherUid);
              if (userData) {
                usersMap[chat.otherUid] = userData;
              }
            } catch (err) {
              console.error('Fetch user failed:', chat.otherUid, err);
            }
          })
        );

        if (isMounted) {
          usersCacheRef.current = usersMap;
          setChatUsers(usersMap);
        }
      } catch (err) {
        console.error('ChatList error:', err);
        if (isMounted) {
          setChats([]);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user]);

  /** 🗑️ Xoá chat */
  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) return;

    setDeletingChatId(chatId);
    try {
      await deleteChat(chatId, user.uid);
    } catch (err) {
      alert(err.message || 'Không thể xóa cuộc trò chuyện');
    } finally {
      setDeletingChatId(null);
    }
  };

  /** ⏳ Loading */
  if (loading || chats === null) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-3">
            <SkeletonLoader lines={2} />
          </div>
        ))}
      </div>
    );
  }

  /** 📭 Không có chat */
  if (chats.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        Chưa có cuộc trò chuyện nào
      </div>
    );
  }

  /** ✅ Có chat */
  return (
    <div className="flex-1 overflow-y-auto bg-[#F6F5FB] px-3 py-4">
      {chats
        .filter((chat) => !chat.deletedBy?.includes(user.uid))
        .map((chat) => {
          const otherUser = chatUsers[chat.otherUid];

          return (
            <div
              key={chat.id}
              className={`relative mb-3 rounded-2xl transition group
                ${
                  selectedChatId === chat.id
                    ? 'bg-white shadow ring-2 ring-indigo-400'
                    : 'bg-white hover:shadow-md'
                }`}
            >
              <button
                onClick={() => onSelectChat(chat.id, otherUser)}
                className="w-full p-3 text-left"
              >
                <div className="flex items-center gap-3">
                  {otherUser?.photoURL ? (
                    <img
                      src={otherUser.photoURL}
                      alt={otherUser.displayName}
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
                      {otherUser?.displayName ||
                        otherUser?.email ||
                        'Người dùng'}
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

              {/* 🗑️ Delete */}
              <button
                onClick={(e) => handleDeleteChat(chat.id, e)}
                disabled={deletingChatId === chat.id}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                title="Xóa cuộc trò chuyện"
              >
                {deletingChatId === chat.id ? '...' : '🗑️'}
              </button>
            </div>
          );
        })}
    </div>
  );
}
