import { useState, useEffect, useRef } from 'react';
import { listenToMessages, sendMessage } from '../services/chatService.js';
import { uploadChatImage } from '../services/storageService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserById } from '../services/friendService.js';
import MessageItem from './MessageItem.jsx';
import { Camera } from 'lucide-react';

import EmojiPickerButton from './EmojiPickerButton.jsx';

export default function ChatRoom({ chatId, otherUser }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [senders, setSenders] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const sendersCacheRef = useRef({}); // Cache to avoid re-fetching

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!chatId) {
      // Reset cache when chat changes
      sendersCacheRef.current = {};
      setSenders({});
      setMessages([]);
      return;
    }
    
    console.log('🔍 ChatRoom: Setting up listener for chatId:', chatId);
    
    // Set initial messages to empty array to prevent stuck loading
    setMessages([]);
    
    const unsub = listenToMessages(chatId, async (list) => {
      console.log('📨 ChatRoom: Received messages list:', list?.length || 0, list);
      
      // Always process the list, even if empty
      const safeList = Array.isArray(list) ? list : [];
      
      // Filter out deleted messages (show deleted messages only if they're from current user)
      const filtered = safeList.filter(m => !m.deleted || m.senderId === user.uid);
      console.log('✅ ChatRoom: Filtered messages:', filtered.length, 'from', safeList.length);
      setMessages(filtered);
      
      // Fetch sender data only for new senders
      const ids = [...new Set(filtered.map(m => m.senderId))];
      const newSenders = {};
      
      await Promise.all(
        ids.map(async (id) => {
          // Check cache first
          if (!sendersCacheRef.current[id]) {
            try {
              const u = await getUserById(id);
              if (u) {
                sendersCacheRef.current[id] = u;
                newSenders[id] = u;
              }
            } catch (err) {
              console.error('Failed to fetch sender:', id, err);
            }
          } else {
            // Use cached sender
            newSenders[id] = sendersCacheRef.current[id];
          }
        })
      );
      
      // Update state with all senders (including cached ones)
      if (Object.keys(newSenders).length > 0) {
        setSenders((prev) => ({ ...prev, ...newSenders }));
      }
    });
    
    return () => {
      console.log('🧹 ChatRoom: Cleaning up listener');
      unsub();
    };
  }, [chatId, user.uid]);

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!messageText.trim() && !uploadingImage) || sending) return;
    setSending(true);
    try {
      const replyTo = replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        senderId: replyingTo.senderId
      } : null;
      
      await sendMessage(chatId, user.uid, messageText.trim(), null, replyTo);
      setMessageText('');
      setReplyingTo(null);
    } finally {
      setSending(false);
    }
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    // Focus input
    document.querySelector('input[placeholder="Enter message..."]')?.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleEmojiSelect = (emoji) => {
    setMessageText(t => t + emoji);
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
      // Show error to user
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
            <p>Chưa có tin nhắn nào</p>
            <p className="text-xs mt-2">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          <>
            {messages.map(m => (
              <MessageItem
                key={m.id}
                message={m}
                sender={senders[m.senderId]}
                chatId={chatId}
                onReply={handleReply}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-100 border-l-4 border-indigo-500 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-600">
              Đang trả lời {replyingTo.senderId === user.uid ? 'bạn' : senders[replyingTo.senderId]?.displayName || 'người khác'}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {replyingTo.text || 'Tin nhắn đã được thu hồi'}
            </div>
          </div>
          <button
            onClick={handleCancelReply}
            className="text-slate-400 hover:text-slate-600 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="px-4 py-3 bg-white flex items-center gap-2 flex-shrink-0 mb-20"
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
  className="p-2 rounded-full text-slate-500 hover:text-indigo-600
             hover:bg-indigo-50 transition-colors"
>
  <Camera className="w-5 h-5" />
</button>


        <EmojiPickerButton onEmojiSelect={handleEmojiSelect} />

        <input
          value={messageText}
          onChange={e => setMessageText(e.target.value)}
          placeholder={replyingTo ? "Nhập tin nhắn trả lời..." : "Enter message..."}
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
