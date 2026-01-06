import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listenToPosts } from '../services/postService.js';
import CreatePost from '../components/CreatePost.jsx';
import Post from '../components/Post.jsx';
import Navigation from '../components/Navigation.jsx';
import StoryBar from '../components/StoryBar.jsx';
import CreateStory from '../components/CreateStory.jsx';
import StoryViewer from '../components/StoryViewer.jsx';
import { useMessageNotifications } from '../hooks/useMessageNotifications.js';
import { usePostNotifications } from '../hooks/usePostNotifications.js';
import { listenToFriendsStories, listenToUserStories } from '../services/storyService.js';
import { PageLoading, SkeletonLoader } from '../components/Loading.jsx';

export default function Home() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);
  const [allStoriesGroups, setAllStoriesGroups] = useState([]);
  const [currentStoryGroupIndex, setCurrentStoryGroupIndex] = useState(0);

  // Memoize friends array to prevent unnecessary re-subscriptions
  // Use JSON.stringify to create stable reference
  const friendIds = useMemo(() => {
    const friends = profile?.friends || [];
    return friends.length > 0 ? [...friends].sort() : [];
  }, [profile?.friends?.join(',')]);

  // Listen for notifications
  useMessageNotifications(user?.uid);
  usePostNotifications(user?.uid, friendIds);

  useEffect(() => {
    if (!user || !profile) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const friendIds = profile.friends || [];
    const unsubscribe = listenToPosts(user.uid, friendIds, (postsList) => {
      setPosts(postsList);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user, profile]);

  // Listen to stories
  useEffect(() => {
    if (!user || !profile) return;

    const friendIds = profile.friends || [];
    let myStoriesList = [];
    let friendsStoriesList = [];
    
    // Listen to my stories (real-time)
    const unsubscribeMyStories = listenToUserStories(user.uid, (stories) => {
      console.log('📸 Home: My stories updated:', stories.length);
      myStoriesList = stories;
      
      // Update all stories groups
      const allGroups = [
        ...(stories.length > 0 ? [{ userId: user.uid, stories }] : []),
        ...friendsStoriesList
      ];
      setAllStoriesGroups(allGroups);
    });

    // Listen to friends' stories
    const unsubscribeFriends = listenToFriendsStories(friendIds, (storiesGroups) => {
      console.log('👥 Home: Friends stories updated:', storiesGroups.length);
      friendsStoriesList = storiesGroups;
      
      // Combine with my stories
      const allGroups = [
        ...(myStoriesList.length > 0 ? [{ userId: user.uid, stories: myStoriesList }] : []),
        ...storiesGroups
      ];
      setAllStoriesGroups(allGroups);
    });

    return () => {
      unsubscribeMyStories();
      unsubscribeFriends();
    };
  }, [user, profile]);

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handlePostCreated = () => {
    // Post will be added automatically via listener
  };

  const handleStoryClick = (userId, stories) => {
    const index = allStoriesGroups.findIndex(g => g.userId === userId);
    setCurrentStoryGroupIndex(index >= 0 ? index : 0);
    setViewingStory({ userId, stories });
    setShowStoryViewer(true);
  };

  const handleStoryDeleted = (updatedStories) => {
    if (!updatedStories || updatedStories.length === 0) {
      // No more stories, close viewer
      setShowStoryViewer(false);
      setViewingStory(null);
    } else {
      // Update current viewing story
      setViewingStory(prev => ({
        ...prev,
        stories: updatedStories
      }));
    }
    // Refresh stories list will happen automatically via listener
  };

  const handleNextStoryGroup = () => {
    if (currentStoryGroupIndex < allStoriesGroups.length - 1) {
      const nextIndex = currentStoryGroupIndex + 1;
      setCurrentStoryGroupIndex(nextIndex);
      setViewingStory(allStoriesGroups[nextIndex]);
    } else {
      setShowStoryViewer(false);
    }
  };

  const handlePrevStoryGroup = () => {
    if (currentStoryGroupIndex > 0) {
      const prevIndex = currentStoryGroupIndex - 1;
      setCurrentStoryGroupIndex(prevIndex);
      setViewingStory(allStoriesGroups[prevIndex]);
    } else {
      setShowStoryViewer(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <PageLoading text="Đang tải bài viết..." />
      </>
    );
  }

  return (
    <div className="h-screen flex bg-[#F6F5FB]">
      <Navigation />
      <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-2xl mx-auto">
          {/* Story Bar */}
          <StoryBar
            onStoryClick={handleStoryClick}
            onCreateStory={() => setShowCreateStory(true)}
          />

          <div className="px-4 py-6">
            {/* Create Post */}
            <CreatePost onPostCreated={handlePostCreated} />

            {/* Posts Feed */}
            {posts.length === 0 ? (
              <div className="text-center text-slate-400 py-12">
                <p className="text-lg mb-2">Chưa có bài viết nào</p>
                <p className="text-sm">Hãy là người đầu tiên đăng bài!</p>
              </div>
            ) : (
              posts.map(post => (
                <Post key={post.id} post={post} onDelete={handlePostDeleted} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Story Modal */}
      <CreateStory
        isOpen={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onStoryCreated={() => {
          setShowCreateStory(false);
          // Stories will update automatically via listener
        }}
      />

      {/* Story Viewer */}
      {viewingStory && (
        <StoryViewer
          isOpen={showStoryViewer}
          onClose={() => {
            setShowStoryViewer(false);
            setViewingStory(null);
          }}
          userId={viewingStory.userId}
          stories={viewingStory.stories}
          onNextUser={handleNextStoryGroup}
          onPrevUser={handlePrevStoryGroup}
          onStoryDeleted={handleStoryDeleted}
        />
      )}
    </div>
  );
}

