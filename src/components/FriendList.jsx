import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase.js';
import { getUserById } from '../services/friendService.js';
import { getChatId } from '../services/chatService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getInitials } from '../utils/helpers.js';

/**
 * Friend list component
 * @param {Function} onSelectFriend - Callback when a friend is selected
 */
export default function FriendList({ onSelectFriend }) {
  const { user, profile } = useAuth();
  const [friends, setFriends] = useState([]);
  const [friendUsers, setFriendUsers] = useState({});

  useEffect(() => {
    if (!user || !profile) return;

    // Listen to user's friends array
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, async (snapshot) => {
      const userData = snapshot.data();
      const friendsList = userData?.friends || [];
      setFriends(friendsList);

      // Fetch friend user data
      const usersMap = {};
      await Promise.all(
        friendsList.map(async (friendUid) => {
          const friendData = await getUserById(friendUid);
          if (friendData) {
            usersMap[friendUid] = friendData;
          }
        })
      );
      setFriendUsers(usersMap);
    });

    return () => unsubscribe();
  }, [user, profile]);

  if (friends.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        No friends yet. Send a friend request!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {friends.map((friendUid) => {
        const friend = friendUsers[friendUid];
        if (!friend) return null;

        const handleClick = () => {
          const chatId = getChatId(user.uid, friendUid);
          onSelectFriend(chatId, friend);
        };

        return (
          <button
            key={friendUid}
            onClick={handleClick}
            className="w-full p-3 hover:bg-slate-800/50 transition-colors text-left border-b border-slate-700/50"
          >
            <div className="flex items-center gap-3">
              {friend.photoURL ? (
                <img
                  src={friend.photoURL}
                  alt={friend.displayName || 'Friend'}
                  className="avatar w-12 h-12"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="avatar w-12 h-12 bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                  {getInitials(friend.displayName || friend.email || 'F')}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200 truncate">
                  {friend.displayName || friend.email}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {friend.email}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}


