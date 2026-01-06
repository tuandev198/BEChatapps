import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listenToFriendsStories, listenToUserStories } from '../services/storyService.js';
import { getUserById } from '../services/friendService.js';
import { getInitials } from '../utils/helpers.js';
import { Plus, Play } from 'lucide-react';

/**
 * Story bar component hiển thị ở đầu trang (giống Instagram)
 */
export default function StoryBar({ onStoryClick, onCreateStory }) {
  const { user, profile } = useAuth();
  const [friendsStories, setFriendsStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [storyUsers, setStoryUsers] = useState({});

  useEffect(() => {
    if (!user || !profile) return;

    console.log('🔍 StoryBar: Setting up listeners for user:', user.uid);

    // Listen to my stories (real-time)
    const unsubscribeMyStories = listenToUserStories(user.uid, (stories) => {
      console.log('📸 StoryBar: My stories updated:', stories.length);
      setMyStories(stories);
      
      // Add my user data to storyUsers
      setStoryUsers(prev => ({
        ...prev,
        [user.uid]: {
          uid: user.uid,
          email: user.email,
          displayName: profile.displayName || user.email,
          photoURL: profile.photoURL || ''
        }
      }));
    });

    // Listen to friends' stories
    const friendIds = profile.friends || [];
    const unsubscribeFriends = listenToFriendsStories(friendIds, async (stories) => {
      console.log('👥 StoryBar: Friends stories updated:', stories.length);
      setFriendsStories(stories);

      // Fetch user data for stories
      const userIds = [...new Set(stories.map(s => s.userId))];
      const usersMap = {};
      await Promise.all(
        userIds.map(async (uid) => {
          if (!usersMap[uid]) {
            const userData = await getUserById(uid);
            if (userData) {
              usersMap[uid] = userData;
            }
          }
        })
      );
      setStoryUsers(usersMap);
    });

    return () => {
      unsubscribeMyStories();
      unsubscribeFriends();
    };
  }, [user, profile]);

  const allStories = [
    ...(myStories.length > 0 ? [{ userId: user.uid, stories: myStories, isMe: true }] : []),
    ...friendsStories.map(s => ({ ...s, isMe: false }))
  ];

  console.log('📊 StoryBar: Render state:', {
    myStoriesCount: myStories.length,
    friendsStoriesCount: friendsStories.length,
    allStoriesCount: allStories.length,
    myStories: myStories,
    user: user?.uid
  });

  if (allStories.length === 0) {
    return (
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* My story button */}
          <button
            onClick={onCreateStory}
            className="flex flex-col items-center gap-2 min-w-[70px]"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-semibold border-2 border-white shadow-md">
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(profile?.displayName || user?.email || 'U')
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className="text-xs text-slate-600 truncate w-full">Story của bạn</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 overflow-x-auto">
      <div className="flex items-center gap-4">
        {/* My story button */}
        <button
          onClick={myStories.length > 0 ? () => onStoryClick(user.uid, myStories) : onCreateStory}
          className="flex flex-col items-center gap-2 min-w-[70px] flex-shrink-0"
        >
          <div className="relative">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold border-2 shadow-md ${
              myStories.length > 0 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-500 border-indigo-500' 
                : 'bg-gradient-to-br from-slate-300 to-slate-400 border-slate-300'
            }`}>
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(profile?.displayName || user?.email || 'U')
              )}
            </div>
            {myStories.length === 0 && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <span className="text-xs text-slate-600 truncate w-full">
            {myStories.length > 0 ? 'Story của bạn' : 'Tạo story'}
          </span>
        </button>

        {/* Friends' stories */}
        {allStories.filter(s => !s.isMe).map((storyGroup) => {
          const storyUser = storyUsers[storyGroup.userId];
          if (!storyUser) return null;

          const hasUnviewed = storyGroup.stories.some(s => 
            !s.views?.includes(user.uid)
          );

          return (
            <button
              key={storyGroup.userId}
              onClick={() => onStoryClick(storyGroup.userId, storyGroup.stories)}
              className="flex flex-col items-center gap-2 min-w-[70px] flex-shrink-0"
            >
              <div className="relative">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold border-2 shadow-md ${
                  hasUnviewed
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500 border-indigo-500'
                    : 'bg-gradient-to-br from-slate-300 to-slate-400 border-slate-300'
                }`}>
                  {storyUser.photoURL ? (
                    <img
                      src={storyUser.photoURL}
                      alt={storyUser.displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(storyUser.displayName || storyUser.email || 'U')
                  )}
                </div>
                {hasUnviewed && (
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500 animate-pulse" />
                )}
              </div>
              <span className="text-xs text-slate-600 truncate w-full">
                {storyUser.displayName || storyUser.email?.split('@')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

