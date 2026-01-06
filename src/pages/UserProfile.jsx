import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { listenToUserPosts } from '../services/postService.js';
import { getUserById, sendFriendRequest } from '../services/friendService.js';
import { getChatId } from '../services/chatService.js';
import Post from '../components/Post.jsx';
import Navigation from '../components/Navigation.jsx';
import { getInitials } from '../utils/helpers.js';
import { LoadingSpinner, SkeletonLoader } from '../components/Loading.jsx';
import { MessageCircle, UserPlus, Check, X } from 'lucide-react';

/**
 * Trang profile của người khác
 */
export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [targetUser, setTargetUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [isFriend, setIsFriend] = useState(false);
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  // Redirect nếu đang xem profile của chính mình
  useEffect(() => {
    if (userId === user?.uid) {
      navigate('/profile', { replace: true });
    }
  }, [userId, user, navigate]);

  // Load user data
  useEffect(() => {
    if (!userId || !user) return;

    setLoadingUser(true);
    getUserById(userId)
      .then((userData) => {
        if (!userData) {
          navigate('/friends', { replace: true });
          return;
        }
        setTargetUser(userData);
        
        // Check if already friend
        const friends = profile?.friends || [];
        setIsFriend(friends.includes(userId));
        
        setLoadingUser(false);
      })
      .catch((err) => {
        console.error('Failed to load user:', err);
        navigate('/friends', { replace: true });
      });
  }, [userId, user, profile]);

  // Load posts
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const unsubscribe = listenToUserPosts(userId, (postsList) => {
      setPosts(postsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Check friend request status
  useEffect(() => {
    if (!userId || !user || !targetUser) return;

    // TODO: Check if friend request was sent
    // For now, just check if already friend
    const friends = profile?.friends || [];
    setHasSentRequest(false); // Will implement later
  }, [userId, user, profile, targetUser]);

  const handleSendFriendRequest = async () => {
    if (!userId || !user || sendingRequest) return;

    setSendingRequest(true);
    try {
      await sendFriendRequest(user.uid, userId);
      setHasSentRequest(true);
    } catch (err) {
      console.error('Failed to send friend request:', err);
      alert(err.message || 'Không thể gửi lời mời kết bạn');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleStartChat = () => {
    if (!userId || !user || !targetUser) return;
    
    const chatId = getChatId(user.uid, userId);
    navigate('/chat', {
      state: {
        chatId,
        otherUser: targetUser
      }
    });
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  if (loadingUser || !targetUser) {
    return (
      <div className="h-screen flex bg-[#F6F5FB]">
        <Navigation />
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
              <SkeletonLoader lines={5} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#F6F5FB]">
      <Navigation />
      <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                {targetUser.photoURL ? (
                  <img
                    src={targetUser.photoURL}
                    alt={targetUser.displayName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-semibold border-4 border-indigo-100">
                    {getInitials(targetUser.displayName || targetUser.email || 'U')}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                  {targetUser.displayName || targetUser.email?.split('@')[0] || 'User'}
                </h1>
                <p className="text-slate-500 mb-4">{targetUser.email}</p>

                {/* Stats */}
                <div className="flex gap-6 justify-center md:justify-start mb-4">
                  <div>
                    <span className="font-semibold text-slate-800">{posts.length}</span>
                    <span className="text-slate-600 ml-1">bài viết</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">
                      {targetUser.friends?.length || 0}
                    </span>
                    <span className="text-slate-600 ml-1">bạn bè</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-center md:justify-start">
                  {isFriend ? (
                    <>
                      <button
                        onClick={handleStartChat}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Nhắn tin
                      </button>
                      <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Đã là bạn bè
                      </div>
                    </>
                  ) : hasSentRequest ? (
                    <div className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Đã gửi lời mời
                    </div>
                  ) : (
                    <button
                      onClick={handleSendFriendRequest}
                      disabled={sendingRequest}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {sendingRequest ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Thêm bạn bè
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
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
            <div className="text-center text-slate-400 py-12 bg-white rounded-2xl">
              <p className="text-lg mb-2">Chưa có bài viết nào</p>
              <p className="text-sm">Người dùng này chưa đăng bài viết nào</p>
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

