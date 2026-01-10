import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  listenToFriendsStories,
  listenToUserStories
} from '../services/storyService.js';
import { getUserById } from '../services/friendService.js';
import { getInitials } from '../utils/helpers.js';
import { Plus } from 'lucide-react';

export default function StoryBar({ onStoryClick, onCreateStory }) {
  const { user, profile } = useAuth();
  const [friendsStories, setFriendsStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [storyUsers, setStoryUsers] = useState({});

  useEffect(() => {
    if (!user || !profile) return;

    const unsubMy = listenToUserStories(user.uid, stories => {
      setMyStories(stories);
      setStoryUsers(prev => ({
        ...prev,
        [user.uid]: {
          uid: user.uid,
          displayName: profile.displayName || user.email,
          email: user.email,
          photoURL: profile.photoURL || ''
        }
      }));
    });

    const unsubFriends = listenToFriendsStories(
      profile.friends || [],
      async stories => {
        setFriendsStories(stories);

        const ids = [...new Set(stories.map(s => s.userId))];
        const map = {};

        await Promise.all(
          ids.map(async uid => {
            const u = await getUserById(uid);
            if (u) map[uid] = u;
          })
        );

        setStoryUsers(prev => ({ ...prev, ...map }));
      }
    );

    return () => {
      unsubMy();
      unsubFriends();
    };
  }, [user, profile]);

  const allStories = [
    ...(myStories.length > 0
      ? [{ userId: user.uid, stories: myStories, isMe: true }]
      : []),
    ...friendsStories.map(s => ({ ...s, isMe: false }))
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-hide">
        {/* ===== MY STORY ===== */}
        <button
          onClick={
            myStories.length > 0
              ? () => onStoryClick(user.uid, myStories)
              : onCreateStory
          }
          className="flex flex-col items-center gap-1 min-w-[72px] flex-shrink-0"
        >
          <div className="relative">
            <div
              className={`w-16 h-16 rounded-full p-[2px] ${
                myStories.length > 0
                  ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500'
                  : 'bg-slate-300'
              }`}
            >
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold">
                    {getInitials(profile?.displayName || 'U')}
                  </div>
                )}
              </div>
            </div>

            {myStories.length === 0 && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <span className="text-xs text-slate-600 truncate w-full text-center">
            {myStories.length > 0 ? 'Story của bạn' : 'Tạo story'}
          </span>
        </button>

        {/* ===== FRIEND STORIES ===== */}
        {allStories
          .filter(s => !s.isMe)
          .map(storyGroup => {
            const u = storyUsers[storyGroup.userId];
            if (!u) return null;

            const hasUnviewed = storyGroup.stories.some(
              s => !s.views?.includes(user.uid)
            );

            return (
              <button
                key={storyGroup.userId}
                onClick={() =>
                  onStoryClick(storyGroup.userId, storyGroup.stories)
                }
                className="flex flex-col items-center gap-1 min-w-[72px] flex-shrink-0"
              >
                <div className="relative">
                  <div
                    className={`w-16 h-16 rounded-full p-[2px] ${
                      hasUnviewed
                        ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500'
                        : 'bg-slate-300'
                    }`}
                  >
                    <div className="w-full h-full rounded-full bg-white p-[2px]">
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold">
                          {getInitials(u.displayName || 'U')}
                        </div>
                      )}
                    </div>
                  </div>

                  {hasUnviewed && (
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500 animate-pulse pointer-events-none" />
                  )}
                </div>

                <span className="text-xs text-slate-600 truncate w-full text-center">
                  {u.displayName || u.email?.split('@')[0]}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
