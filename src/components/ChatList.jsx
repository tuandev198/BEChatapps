import { useEffect, useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { listenToChats, deleteChat } from '../services/chatService.js';
import { getUserById } from '../services/friendService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatTimestamp, getInitials } from '../utils/helpers.js';
import { SkeletonLoader } from './Loading.jsx';

const MIN_LOADING_TIME = 1200;
const SWIPE_WIDTH = 80;
const SWIPE_OPEN_DISTANCE = 50;

// iOS spring curve
const SPRING_OPEN = 'cubic-bezier(0.22, 1.61, 0.36, 1)';
const SPRING_CLOSE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

export default function ChatList({ onSelectChat, selectedChatId }) {
  const { user } = useAuth();

  const [chats, setChats] = useState(null);
  const [chatUsers, setChatUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingChatId, setDeletingChatId] = useState(null);

  const [openChatId, setOpenChatId] = useState(null);

  const startXRef = useRef(0);
  const deltaXRef = useRef(0);
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

    const unsubscribe = listenToChats(user.uid, async (list) => {
      if (!isMounted) return;

      const safeChats = Array.isArray(list) ? list : [];

      const finish = () => {
        if (!isMounted) return;
        setChats(safeChats);
        setLoading(false);
      };

      const remain = MIN_LOADING_TIME - (Date.now() - startTime);
      remain > 0 ? setTimeout(finish, remain) : finish();

      const usersMap = { ...usersCacheRef.current };
      await Promise.all(
        safeChats.map(async (c) => {
          if (!c.otherUid || usersMap[c.otherUid]) return;
          const u = await getUserById(c.otherUid);
          if (u) usersMap[c.otherUid] = u;
        })
      );

      if (isMounted) {
        usersCacheRef.current = usersMap;
        setChatUsers(usersMap);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user]);

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) return;

    setDeletingChatId(chatId);
    await deleteChat(chatId, user.uid);
    setDeletingChatId(null);
    setOpenChatId(null);
  };

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

  if (chats.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        Chưa có cuộc trò chuyện nào
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F6F5FB] px-3 py-4">
      {chats
        .filter(c => !c.deletedBy?.includes(user.uid))
        .map((chat) => {
          const otherUser = chatUsers[chat.otherUid];
          const isOpen = openChatId === chat.id;

          const onDown = (e) => {
            startXRef.current = e.clientX;
            deltaXRef.current = 0;
            e.currentTarget.style.transition = 'none';
          };

          const onMove = (e) => {
            if (!startXRef.current) return;
            const delta = e.clientX - startXRef.current;
            deltaXRef.current = delta;

            if (delta < 0) {
              const x = Math.max(delta, -SWIPE_WIDTH - 20); // rubber band
              e.currentTarget.style.transform = `translateX(${x}px)`;
            }
          };

          const onUp = (e) => {
            const open = deltaXRef.current < -SWIPE_OPEN_DISTANCE;
            setOpenChatId(open ? chat.id : null);

            e.currentTarget.style.transition = `transform 0.38s ${
              open ? SPRING_OPEN : SPRING_CLOSE
            }`;

            e.currentTarget.style.transform = open
              ? `translateX(-${SWIPE_WIDTH}px)`
              : 'translateX(0)';

            startXRef.current = 0;
            deltaXRef.current = 0;
          };

          return (
            <div key={chat.id} className="relative mb-3 overflow-hidden rounded-2xl">
              {/* Delete layer */}
              <div className="absolute inset-y-0 right-0 w-20 bg-red-500 flex items-center justify-center">
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  disabled={deletingChatId === chat.id}
                  className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
                >
                  <Trash2 size={22} className="text-white" />
                </button>
              </div>

              {/* Swipe content */}
              <div
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerLeave={onUp}
                className={`relative bg-white ${
                  selectedChatId === chat.id ? 'ring-2 ring-indigo-400' : ''
                }`}
                style={{
                  transform: isOpen
                    ? `translateX(-${SWIPE_WIDTH}px)`
                    : 'translateX(0)',
                  transition: `transform 0.38s ${SPRING_OPEN}`
                }}
              >
                <button
                  onClick={() => {
                    setOpenChatId(null);
                    onSelectChat(chat.id, otherUser);
                  }}
                  className="w-full p-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    {otherUser?.photoURL ? (
                      <img
                        src={otherUser.photoURL}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {getInitials(otherUser?.displayName || 'U')}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {otherUser?.displayName || otherUser?.email}
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
              </div>
            </div>
          );
        })}
    </div>
  );
}
