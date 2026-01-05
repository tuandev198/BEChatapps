import { formatTimestamp } from '../utils/helpers.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Message item component
 * @param {Object} message - Message object
 * @param {Object} sender - Sender user object
 */
export default function MessageItem({ message, sender }) {
  const { user } = useAuth();
  const isMe = message.senderId === user.uid;

  return (
    <div className={`message-row ${isMe ? 'me' : ''}`}>
      <div className="flex gap-2 max-w-[70%]">
        {!isMe && sender && (
          <img
            src={sender.photoURL || ''}
            alt={sender.displayName || 'User'}
            className="avatar w-8 h-8 mt-1 flex-shrink-0"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <div className="flex flex-col">
          {!isMe && sender && (
            <div className="text-xs text-slate-400 mb-1 px-1">
              {sender.displayName || sender.email}
            </div>
          )}
          <div className={`message-bubble ${isMe ? 'me' : 'them'}`}>
            {message.imageURL && (
              <img
                src={message.imageURL}
                alt="Shared image"
                className="max-w-full rounded-lg mb-2"
                style={{ maxHeight: '300px', objectFit: 'contain' }}
              />
            )}
            {message.text && (
              <div className="whitespace-pre-wrap">{message.text}</div>
            )}
          </div>
          {message.createdAt && (
            <div className={`text-xs text-slate-500 mt-1 px-1 ${isMe ? 'text-right' : ''}`}>
              {formatTimestamp(message.createdAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


