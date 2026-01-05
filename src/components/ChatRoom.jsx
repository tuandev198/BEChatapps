import { useState, useEffect, useRef } from 'react';
import { listenToMessages, sendMessage } from '../services/chatService.js';
import { uploadChatImage } from '../services/storageService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserById } from '../services/friendService.js';
import MessageItem from './MessageItem.jsx';
import EmojiPickerButton from './EmojiPickerButton.jsx';

/**
 * Chat room component for displaying and sending messages
 * @param {string} chatId - Chat ID
 * @param {Object} otherUser - Other participant user object
 */
export default function ChatRoom({ chatId, otherUser }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [senders, setSenders] = useState({});
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen to messages
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = listenToMessages(chatId, (messagesList) => {
      setMessages(messagesList);

      // Fetch sender data for messages
      const uniqueSenderIds = [...new Set(messagesList.map(m => m.senderId))];
      Promise.all(
        uniqueSenderIds.map(async (senderId) => {
          if (!senders[senderId]) {
            const senderData = await getUserById(senderId);
            if (senderData) {
              setSenders((prev) => ({ ...prev, [senderId]: senderData }));
            }
          }
        })
      );
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!messageText.trim() && !uploadingImage) || sending) return;

    setSending(true);
    try {
      await sendMessage(chatId, user.uid, messageText.trim());
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessageText((prev) => prev + emoji);
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;

    setUploadingImage(true);
    try {
      const messageId = Date.now().toString();
      const imageURL = await uploadChatImage(chatId, messageId, file);
      await sendMessage(chatId, user.uid, '', imageURL);
    } catch (err) {
      console.error('Failed to upload image:', err);
      // Show error to user (you can add error state if needed)
      alert(err.code === 'storage/unauthorized' 
        ? 'Permission denied. Please check Firebase Storage rules.'
        : err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat header */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center gap-3">
          {otherUser?.photoURL ? (
            <img
              src={otherUser.photoURL}
              alt={otherUser.displayName || 'User'}
              className="avatar w-10 h-10"
            />
          ) : (
            <div className="avatar w-10 h-10 bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
              {otherUser?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-slate-200">
              {otherUser?.displayName || otherUser?.email || 'Unknown User'}
            </div>
            <div className="text-xs text-slate-400">
              {otherUser?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              sender={senders[message.senderId]}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="p-2 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            aria-label="Upload image"
          >
            {uploadingImage ? (
              <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
          <EmojiPickerButton onEmojiSelect={handleEmojiSelect} />
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="input flex-1"
            disabled={sending || uploadingImage}
          />
          <button
            type="submit"
            disabled={(!messageText.trim() && !uploadingImage) || sending || uploadingImage}
            className="btn-primary"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}


