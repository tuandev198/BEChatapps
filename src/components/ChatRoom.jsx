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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      <div className="flex-1 flex items-center justify-center text-slate-400 bg-[#F6F5FB]">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#F6F5FB]">

      {/* Header */}
      <div className="px-4 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 flex-shrink-0">
        <div className="flex items-center gap-3">
          {otherUser?.photoURL ? (
            <img src={otherUser.photoURL} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-white font-semibold">
              {otherUser?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-sm font-semibold text-white truncate">
              {otherUser?.displayName || otherUser?.email}
            </div>
            <div className="text-xs text-white/70 mt-0.5 truncate">
              {otherUser?.email}
            </div>
          </div>
          <button className="p-2 text-white text-xl">⋮</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="px-4 py-3 bg-white flex items-center gap-2 flex-shrink-0"
      >
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
          className="text-xl"
        >
          📷
        </button>

        <EmojiPickerButton onEmojiSelect={handleEmojiSelect} />

        <input
          value={messageText}
          onChange={e => setMessageText(e.target.value)}
          placeholder="Enter message..."
          className="flex-1 px-4 py-2 rounded-full bg-slate-100 outline-none text-slate-800"
          disabled={sending || uploadingImage}
        />

        <button
          type="submit"
          disabled={!messageText.trim() && !uploadingImage || sending}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center disabled:opacity-50"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
