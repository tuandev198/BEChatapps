import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listenToUserPosts } from '../services/postService.js';
import Post from '../components/Post.jsx';
import ChangeAvatar from '../components/ChangeAvatar.jsx';
import Navigation from '../components/Navigation.jsx';
import { Link } from 'react-router-dom';
import { SkeletonLoader } from '../components/Loading.jsx';

export default function Profile() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenToUserPosts(user.uid, (postsList) => {
      setPosts(postsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="h-screen flex bg-[#F6F5FB]">
      <Navigation />
      <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <ChangeAvatar />
            <div className="flex-1 text-center md:text-left">
             
              <div className="flex gap-6 justify-center md:justify-start">
                <div>
                  <span className="font-semibold text-slate-800">{posts.length}</span>
                  <span className="text-slate-600 ml-1">bài viết</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{profile?.friends?.length || 0}</span>
                  <span className="text-slate-600 ml-1">bạn bè</span>
                </div>
              </div>
            </div>
            <Link
              to="/chat"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Nhắn tin
            </Link>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'
            }`}
          >
            Lưới
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'
            }`}
          >
            Danh sách
          </button>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4">
                <SkeletonLoader lines={3} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            <p className="text-lg mb-2">Chưa có bài viết nào</p>
            <p className="text-sm">Hãy đăng bài đầu tiên của bạn!</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-1">
            {posts.map(post => (
              <div key={post.id} className="aspect-square bg-slate-200 rounded-lg overflow-hidden relative group">
                {post.imageURL ? (
                  <img
                    src={post.imageURL}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    📝
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="text-white flex gap-4">
                    <span>❤️ {post.likes?.length || 0}</span>
                    <span>💬 {post.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <Post key={post.id} post={post} onDelete={handlePostDeleted} />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

