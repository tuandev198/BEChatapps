import { useAuth } from '../context/AuthContext.jsx';
import { formatTimestamp } from '../utils/helpers.js';

export default function MessageItem({ message, sender }) {
  const { user } = useAuth();
  const isMe = message.senderId === user.uid;

  return (
    <div className="w-full flex mb-2">
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
          <div className="flex flex-col max-w-[75vw] sm:max-w-[60%]">
            {!isMe && sender && (
              <span className="text-xs text-slate-400 mb-1 px-1">
                {sender.displayName || sender.email}
              </span>
            )}

            {/* Bubble */}
            <div
              className={`px-3 py-2 rounded-2xl w-fit max-w-full
                break-words whitespace-pre-wrap
                ${
                  isMe
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-slate-700 text-white rounded-bl-md'
                }`}
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
            </div>

            {message.createdAt && (
              <span
                className={`text-[11px] text-slate-400 mt-1 px-1 ${
                  isMe ? 'text-right' : ''
                }`}
              >
                {formatTimestamp(message.createdAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
