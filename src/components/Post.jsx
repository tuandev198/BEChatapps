import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserById } from '../services/friendService.js';
import { likePost, addComment, deletePost } from '../services/postService.js';
import { formatTimestamp, getInitials } from '../utils/helpers.js';

export default function Post({ post, onDelete }) {
  const { user } = useAuth();

  const [postUser, setPostUser] = useState(null);
  const [commentUsers, setCommentUsers] = useState({});
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const [liking, setLiking] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [showImage, setShowImage] = useState(false);

  // Swipe modal
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const isLiked = post.likes?.includes(user.uid);
  const likesCount = post.likes?.length || 0;
  const comments = post.comments || [];

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = showImage ? 'hidden' : '';
  }, [showImage]);

  // Fetch author
  useEffect(() => {
    if (post.userId) getUserById(post.userId).then(setPostUser);
  }, [post.userId]);

  // Fetch comment users
  useEffect(() => {
    comments.forEach(c => {
      if (!commentUsers[c.userId]) {
        getUserById(c.userId).then(u => {
          if (u) {
            setCommentUsers(prev => ({ ...prev, [c.userId]: u }));
          }
        });
      }
    });
  }, [comments]);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    await likePost(post.id, user.uid);
    setLiking(false);
  };

  const handleComment = async e => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setAddingComment(true);
    await addComment(post.id, user.uid, commentText.trim());
    setCommentText('');
    setShowComments(true);
    setAddingComment(false);
  };

  const handleDelete = async () => {
    if (!confirm('Xóa bài viết?')) return;
    setDeleting(true);
    await deletePost(post.id, user.uid);
    onDelete?.(post.id);
    setDeleting(false);
  };

  // Swipe handlers
  const handleTouchStart = e => {
    setStartY(e.touches[0].clientY);
    setDragging(true);
  };

  const handleTouchMove = e => {
    if (dragging) setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (currentY - startY > 120) setShowImage(false);
    setDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  return (
    <>
      {/* POST CARD */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            to={post.userId === user.uid ? '/profile' : `/user/${post.userId}`}
            className="flex items-center gap-3"
          >
            {postUser?.photoURL ? (
              <img
                src={postUser.photoURL}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold">
                {getInitials(postUser?.displayName || 'U')}
              </div>
            )}

            <div className="leading-tight">
              <p className="font-semibold text-sm text-slate-900">
                {postUser?.displayName || postUser?.email}
              </p>
              <p className="text-xs text-slate-400">
                {formatTimestamp(post.createdAt)}
              </p>
            </div>
          </Link>

          {post.userId === user.uid && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-slate-400 hover:text-red-500 text-xl"
            >
              ⋯
            </button>
          )}
        </div>

        {/* IMAGE */}
        {post.imageURL && (
          <div className="relative bg-black">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <img
              src={post.imageURL}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onClick={() => setShowImage(true)}
              className={`w-full aspect-[4/5] object-cover cursor-zoom-in transition-opacity ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        )}

        {/* ACTIONS */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-5 text-[22px] mb-2">
            <button onClick={handleLike}>
              {isLiked ? '❤️' : '🤍'}
            </button>
            <button onClick={() => setShowComments(!showComments)}>💬</button>
            <button className="ml-auto">📤</button>
          </div>

          {likesCount > 0 && (
            <p className="text-sm font-semibold text-slate-900">
              {likesCount} lượt thích
            </p>
          )}
        </div>

        {/* CAPTION */}
        {post.caption && (
          <div className="px-4 pb-2 text-sm text-slate-800">
            <span className="font-semibold mr-1">
              {postUser?.displayName}
            </span>
            {post.caption}
          </div>
        )}

        {/* COMMENTS */}
        {showComments && (
          <div className="px-4 pb-2 space-y-1 text-sm">
            {comments.map(c => (
              <div key={c.id}>
                <span className="font-semibold mr-1">
                  {commentUsers[c.userId]?.displayName || 'User'}
                </span>
                {c.text}
              </div>
            ))}
          </div>
        )}

        {/* COMMENT INPUT */}
        <form
          onSubmit={handleComment}
          className="px-4 py-3 border-t flex items-center gap-2"
        >
          <input
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Thêm bình luận..."
            className="flex-1 text-sm outline-none"
          />
          <button className="text-indigo-600 font-semibold text-sm">
            {addingComment ? '...' : 'Đăng'}
          </button>
        </form>
      </div>

      {/* IMAGE MODAL */}
      {showImage && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setShowImage(false)}
        >
          <img
            src={post.imageURL}
            onClick={e => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: dragging
                ? `translateY(${Math.max(0, currentY - startY)}px)`
                : 'translateY(0)',
              transition: dragging ? 'none' : 'transform 0.25s ease'
            }}
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />
        </div>
      )}
    </>
  );
}
