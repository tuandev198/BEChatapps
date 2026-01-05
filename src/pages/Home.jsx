import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listenToPosts } from '../services/postService.js';
import CreatePost from '../components/CreatePost.jsx';
import Post from '../components/Post.jsx';
import Navigation from '../components/Navigation.jsx';
import { useMessageNotifications } from '../hooks/useMessageNotifications.js';
import { usePostNotifications } from '../hooks/usePostNotifications.js';

export default function Home() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handlePostCreated = () => {
    // Post will be added automatically via listener
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F6F5FB]">
        <div className="text-slate-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#F6F5FB]">
      <Navigation />
      <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
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
  );
}

