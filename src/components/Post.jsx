import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserById } from '../services/friendService.js';
import { likePost, addComment, deletePost } from '../services/postService.js';
import { formatTimestamp } from '../utils/helpers.js';
import { getInitials } from '../utils/helpers.js';

export default function Post({ post, onDelete }) {
  const { user } = useAuth();
  const [postUser, setPostUser] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentUsers, setCommentUsers] = useState({});

  const isLiked = post.likes?.includes(user.uid) || false;
  const likesCount = post.likes?.length || 0;
  const comments = post.comments || [];

  // Fetch post author
  useEffect(() => {
    if (post.userId && !postUser) {
      getUserById(post.userId).then(setPostUser);
    }
  }, [post.userId]);

  // Fetch comment authors
  useEffect(() => {
    if (comments.length > 0) {
      const userIds = comments.map(c => c.userId).filter(id => !commentUsers[id]);
      if (userIds.length > 0) {
        Promise.all(
          userIds.map(userId =>
            getUserById(userId).then(user => {
              if (user) {
                setCommentUsers(prev => ({ ...prev, [userId]: user }));
              }
            })
          )
        );
      }
    }
  }, [comments]);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      await likePost(post.id, user.uid);
    } catch (err) {
      console.error('Failed to like post:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || addingComment) return;

    setAddingComment(true);
    try {
      await addComment(post.id, user.uid, commentText.trim());
      setCommentText('');
      setShowComments(true);
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setAddingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;

    setDeleting(true);
    try {
      await deletePost(post.id, user.uid);
      if (onDelete) onDelete(post.id);
    } catch (err) {
      alert(err.message || 'Không thể xóa bài viết');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {postUser?.photoURL ? (
            <img
              src={postUser.photoURL}
              alt={postUser.displayName || 'User'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
              {getInitials(postUser?.displayName || postUser?.email || 'U')}
            </div>
          )}
          <div>
            <div className="font-semibold text-slate-800">
              {postUser?.displayName || postUser?.email || 'Người dùng'}
            </div>
            {post.createdAt && (
              <div className="text-xs text-slate-400">
                {formatTimestamp(post.createdAt)}
              </div>
            )}
          </div>
        </div>

        {post.userId === user.uid && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-500 hover:text-red-700 p-2"
            title="Xóa bài viết"
          >
            {deleting ? '...' : '🗑️'}
          </button>
        )}
      </div>

      {/* Image */}
      {post.imageURL && (
        <div className="w-full">
          <img
            src={post.imageURL}
            alt="Post"
            className="w-full object-contain bg-slate-100"
            style={{ maxHeight: '600px' }}
          />
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 py-2">
          <span className="font-semibold text-slate-800 mr-2">
            {postUser?.displayName || 'Người dùng'}
          </span>
          <span className="text-slate-700">{post.caption}</span>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2 border-t border-slate-100">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={handleLike}
            disabled={liking}
            className={`text-2xl transition-transform hover:scale-110 ${
              isLiked ? 'text-red-500' : 'text-slate-400'
            }`}
          >
            {isLiked ? '❤️' : '🤍'}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-2xl text-slate-400 hover:text-slate-600"
          >
            💬
          </button>
        </div>

        {likesCount > 0 && (
          <div className="text-sm font-semibold text-slate-800 mb-2">
            {likesCount} {likesCount === 1 ? 'lượt thích' : 'lượt thích'}
          </div>
        )}

        {/* Comments */}
        {showComments && (
          <div className="space-y-2 mb-2">
            {comments.map((comment) => {
              const commentUser = commentUsers[comment.userId];
              return (
                <div key={comment.id} className="flex gap-2">
                  <span className="font-semibold text-slate-800">
                    {commentUser?.displayName || 'Người dùng'}:
                  </span>
                  <span className="text-slate-700">{comment.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Comment input */}
        <form onSubmit={handleComment} className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Thêm bình luận..."
            className="flex-1 px-3 py-2 rounded-full bg-slate-100 border border-slate-200 outline-none focus:border-indigo-500 text-sm"
            disabled={addingComment}
          />
          <button
            type="submit"
            disabled={!commentText.trim() || addingComment}
            className="px-4 py-2 text-indigo-600 font-medium hover:text-indigo-700 disabled:opacity-50"
          >
            {addingComment ? '...' : 'Đăng'}
          </button>
        </form>
      </div>
    </div>
  );
}

