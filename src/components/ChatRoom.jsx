import { useState, useEffect, useRef } from 'react';
import { listenToMessages, sendMessage } from '../services/chatService.js';
import { uploadChatImage } from '../services/storageService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserById } from '../services/friendService.js';
import MessageItem from './MessageItem.jsx';
import EmojiPickerButton from './EmojiPickerButton.jsx';

export default function ChatRoom({ chatId, otherUser }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [senders, setSenders] = useState({});
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  /* Auto scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* Listen messages */
  useEffect(() => {
    if (!chatId) return;
    const unsub = listenToMessages(chatId, async (list) => {
      setMessages(list);
      const ids = [...new Set(list.map(m => m.senderId))];
      for (const id of ids) {
        if (!senders[id]) {
          const u = await getUserById(id);
          if (u) setSenders(p => ({ ...p, [id]: u }));
        }
      }
    });
    return () => unsub();
  }, [chatId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!messageText.trim() && !uploadingImage) || sending) return;
    setSending(true);
    try {
      await sendMessage(chatId, user.uid, messageText.trim());
      setMessageText('');
    } finally {
      setSending(false);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessageText(t => t + emoji);
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const imageURL = await uploadChatImage(chatId, Date.now().toString(), file);
      await sendMessage(chatId, user.uid, '', imageURL);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
    <div className="h-full flex flex-col bg-slate-900">

      {/* Header */}
      <div className="px-4 py-3 pt-[env(safe-area-inset-top)] border-b border-slate-700/50 bg-slate-800/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          {otherUser?.photoURL ? (
            <img src={otherUser.photoURL} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
              {otherUser?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-sm font-semibold text-slate-200 truncate">
              {otherUser?.displayName || otherUser?.email}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 truncate">
              {otherUser?.email}
            </div>
          </div>
          <button
            className="p-2 rounded-full hover:bg-slate-700/50 text-slate-300 flex-shrink-0"
            aria-label="Menu"
          >
            ⋮
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm mt-10">
            No messages yet
          </div>
        ) : (
          messages.map(m => (
            <MessageItem key={m.id} message={m} sender={senders[m.senderId]} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer / Input */}
      <form
        onSubmit={handleSend}
        className="px-2 py-3 border-t border-slate-700/50 bg-slate-800/30 flex-shrink-0"
      >
        <div className="flex flex-wrap items-center gap-2">
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
            className="p-2 text-slate-400 hover:text-slate-200 flex-shrink-0"
          >
            📷
          </button>

          <EmojiPickerButton onEmojiSelect={handleEmojiSelect} />

          <input
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-w-0 px-3 py-2 rounded-full bg-slate-700 text-white outline-none"
            disabled={sending || uploadingImage}
          />

          <button
            type="submit"
            disabled={!messageText.trim() && !uploadingImage || sending}
            className="px-4 py-2 rounded-full bg-blue-500 text-white disabled:opacity-50 flex-shrink-0"
          >
            Send
          </button>
        </div>
      </form>

    </div>
  );
}
