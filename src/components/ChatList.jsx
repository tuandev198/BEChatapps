import { useEffect, useState } from 'react';
import { listenToChats } from '../services/chatService.js';
import { getUserById } from '../services/friendService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatTimestamp } from '../utils/helpers.js';
import { getInitials } from '../utils/helpers.js';

/**
 * Chat list component showing all user's chats
 * @param {Function} onSelectChat - Callback when a chat is selected
 * @param {string} selectedChatId - Currently selected chat ID
 */
export default function ChatList({ onSelectChat, selectedChatId }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [chatUsers, setChatUsers] = useState({});

  useEffect(() => {
    if (!user) return;

    // Listen to chats
    const unsubscribe = listenToChats(user.uid, async (chatsList) => {
      setChats(chatsList);

      // Fetch user data for each chat's other participant
      const usersMap = {};
      await Promise.all(
        chatsList.map(async (chat) => {
          if (chat.otherUid) {
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

  if (chats.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        No chats yet. Start a conversation!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map((chat) => {
        const otherUser = chatUsers[chat.otherUid];
        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id, otherUser)}
            className={`w-full p-3 hover:bg-slate-800/50 transition-colors text-left border-b border-slate-700/50 ${
              selectedChatId === chat.id ? 'bg-slate-800/70' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              {otherUser?.photoURL ? (
                <img
                  src={otherUser.photoURL}
                  alt={otherUser.displayName || 'User'}
                  className="avatar w-12 h-12"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="avatar w-12 h-12 bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                  {getInitials(otherUser?.displayName || otherUser?.email || 'U')}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200 truncate">
                  {otherUser?.displayName || otherUser?.email || 'Unknown User'}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {chat.lastMessage || 'No messages yet'}
                </div>
                {chat.updatedAt && (
                  <div className="text-xs text-slate-500 mt-1">
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


