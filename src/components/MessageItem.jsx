import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { formatTimestamp } from '../utils/helpers.js';
import { deleteMessage, addReaction } from '../services/chatService.js';

export default function MessageItem({ message, sender, chatId, onReply, onReaction }) {
  const { user } = useAuth();
  const isMe = message.senderId === user.uid;
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reactions = message.reactions || {};
  const reactionCounts = {};
  Object.values(reactions).forEach(emoji => {
    reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
  });

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn thu hồi tin nhắn này?')) return;
    
    setDeleting(true);
    try {
      await deleteMessage(chatId, message.id, user.uid);
      setShowMenu(false);
    } catch (err) {
      alert(err.message || 'Không thể thu hồi tin nhắn');
    } finally {
      setDeleting(false);
    }
  };

  const handleReaction = async (emoji) => {
    try {
      await addReaction(chatId, message.id, user.uid, emoji);
      if (onReaction) onReaction();
    } catch (err) {
      console.error('Failed to add reaction:', err);
    }
  };

  const handleLongPress = () => {
    setShowMenu(true);
  };

  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  if (message.deleted) {
    return (
      <div className="w-full flex mb-2 justify-center">
        <span className="text-xs text-slate-400 italic">
          {message.text || 'Tin nhắn đã được thu hồi'}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full flex mb-2 group">
      <div
        className={`flex w-full ${
          isMe ? 'justify-end' : 'justify-start'
        }`}
      >
        <div
          className={`flex gap-2 max-w-full ${
            isMe ? 'flex-row-reverse' : ''
          }`}
        >
          {/* Avatar */}
          {!isMe && sender && (
            <img
              src={sender.photoURL || ''}
              alt=""
              className="w-8 h-8 rounded-full mt-1 flex-shrink-0"
            />
          )}

          {/* Content */}
          <div className="flex flex-col max-w-[75vw] sm:max-w-[60%] relative">
            {!isMe && sender && (
              <span className="text-xs text-slate-400 mb-1 px-1">
                {sender.displayName || sender.email}
              </span>
            )}

            {/* Reply preview */}
            {message.replyTo && (
              <div className={`mb-1 px-2 py-1 rounded-lg bg-slate-200/50 border-l-2 ${
                isMe ? 'border-blue-400' : 'border-slate-400'
              }`}>
                <div className="text-xs font-medium text-slate-600">
                  {message.replyTo.senderId === user.uid ? 'Bạn' : sender?.displayName || 'Người khác'}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {message.replyTo.text || 'Tin nhắn đã được thu hồi'}
                </div>
              </div>
            )}

            {/* Bubble */}
            <div
              className={`px-3 py-2 rounded-2xl w-fit max-w-full
                break-words whitespace-pre-wrap relative
                ${
                  isMe
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-slate-700 text-white rounded-bl-md'
                }`}
              onContextMenu={(e) => {
                e.preventDefault();
                handleLongPress();
              }}
              onMouseDown={(e) => {
                if (e.button === 2) {
                  handleLongPress();
                }
              }}
            >
              {message.imageURL && (
                <img
                  src={message.imageURL}
                  alt="img"
                  className="max-w-full rounded-lg mb-2"
                  style={{ maxHeight: 280 }}
                />
              )}

              {message.text}

              {/* Reactions */}
              {Object.keys(reactionCounts).length > 0 && (
                <div className={`mt-1 flex flex-wrap gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {Object.entries(reactionCounts).map(([emoji, count]) => (
                    <span
                      key={emoji}
                      className={`text-xs px-1.5 py-0.5 rounded-full bg-black/20 ${
                        reactions[user.uid] === emoji ? 'ring-2 ring-white' : ''
                      }`}
                      onClick={() => handleReaction(emoji)}
                    >
                      {emoji} {count > 1 && count}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Timestamp and menu */}
            <div className={`flex items-center mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {message.createdAt && (
                <span className="text-[11px] text-slate-400">
                  {formatTimestamp(message.createdAt)}
                </span>
              )}
              
              {/* Reaction button */}
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
                title="Thả cảm xúc"
              >
                😊
              </button>

              {/* Delete button (only for own messages) */}
              {isMe && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                  title="Thu hồi"
                >
                  {deleting ? '...' : '🗑️'}
                </button>
              )}

              {/* Reply button */}
              <button
                onClick={() => onReply && onReply(message)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
                title="Trả lời"
              >
                ↩️
              </button>
            </div>

            {/* Reaction picker */}
            {showReactions && (
              <div className={`absolute ${isMe ? 'right-0' : 'left-0'} bottom-8 bg-white rounded-lg shadow-lg p-2 flex gap-1 z-10`}>
                {commonReactions.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleReaction(emoji);
                      setShowReactions(false);
                    }}
                    className="text-xl hover:scale-125 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
