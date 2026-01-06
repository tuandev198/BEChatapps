import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase.js';
import { getUserById } from '../services/friendService.js';
import { getChatId } from '../services/chatService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getInitials } from '../utils/helpers.js';
import { Search, User } from 'lucide-react';

/**
 * FriendList (HOÀN CHỈNH)
 * - UI đẹp, gọn
 * - Search bạn bè
 * - Hiển thị unread (badge / dot)
 * - Realtime từ Firestore
 */
export default function FriendList({ onSelectFriend }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);           // [uid]
  const [friendUsers, setFriendUsers] = useState({});   // { uid: userData }
  const [unreadMap, setUnreadMap] = useState({});       // { uid: number }
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user || !profile) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, async (snap) => {
      const userData = snap.data() || {};
      const friendsList = userData.friends || [];
      setFriends(friendsList);

      const usersMap = {};
      const unreadTemp = {};

      await Promise.all(
        friendsList.map(async (uid) => {
          const data = await getUserById(uid);
          if (data) usersMap[uid] = data;
          unreadTemp[uid] = userData.unread?.[uid] || 0;
        })
      );

      setFriendUsers(usersMap);
      setUnreadMap(unreadTemp);
    });

    return () => unsubscribe();
  }, [user, profile]);

  const filteredFriends = friends.filter(uid => {
    const f = friendUsers[uid];
    if (!f) return false;
    const key = `${f.displayName || ''} ${f.email || ''}`.toLowerCase();
    return key.includes(search.toLowerCase());
  });

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
        <div className="text-4xl">👥</div>
        <div>Chưa có bạn bè</div>
        <div className="text-xs">Hãy gửi lời mời kết bạn</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm bạn bè..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/70 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[rgb(79_70_229)]"
          />
        </div>
      </div>

      {/* Friend list */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredFriends.map((friendUid) => {
          const friend = friendUsers[friendUid];
          if (!friend) return null;

          const unread = unreadMap[friendUid] || 0;

          const handleClick = () => {
            const chatId = getChatId(user.uid, friendUid);
            onSelectFriend(chatId, friend);
          };

          const handleViewProfile = (e) => {
            e.stopPropagation();
            navigate(`/user/${friendUid}`);
          };

          return (
            <div
              key={friendUid}
              className={`group w-full flex items-center gap-3 p-3 mb-2 rounded-2xl transition
                ${unread > 0
                  ? 'bg-[rgb(79_70_229/var(--tw-bg-opacity))] ring-1 ring-[rgb(79_70_229/var(--tw-bg-opacity))] text-white'
                  : 'bg-[rgb(79_70_229/0.08)] hover:bg-[rgb(79_70_229/0.15)]'}
              `}
            >
              <button
                onClick={handleClick}
                className="flex items-center gap-3 flex-1 text-left"
              >
                {/* Avatar - clickable to view profile */}
                <button
                  onClick={handleViewProfile}
                  className="hover:opacity-80 transition-opacity"
                  title="Xem trang cá nhân"
                >
                  {friend.photoURL ? (
                    <img
                      src={friend.photoURL}
                      alt={friend.displayName}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[rgb(79_70_229)] to-[rgb(99_102_241)] flex items-center justify-center text-white font-semibold">
                      {getInitials(friend.displayName || friend.email || 'F')}
                    </div>
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm truncate ${unread > 0 ? 'font-semibold text-slate-100' : 'text-indigo-600'}`}>
                      {friend.displayName || 'Người dùng'}
                    </span>

                    {/* Unread badge */}
                    {unread > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[rgb(79_70_229)] text-white text-[10px] font-semibold flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 truncate">
                    {friend.email}
                  </div>
                </div>

                {/* CTA */}
                <div className="text-xs text-[rgb(79_70_229)] opacity-0 group-hover:opacity-100 transition">
                  Chat →
                </div>
              </button>

              {/* View Profile Button */}
              <button
                onClick={handleViewProfile}
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                title="Xem trang cá nhân"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
