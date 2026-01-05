import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listenToChats } from '../services/chatService.js';
import { listenToMessages } from '../services/chatService.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService.js';
import { getUserById } from '../services/friendService.js';

/**
 * Hook to listen for new messages and create notifications
 * @param {string} userId - Current user UID
 */
export function useMessageNotifications(userId) {
  const lastMessageIdsRef = useRef({}); // Track last message ID per chat
  const unsubscribeRefs = useRef({}); // Track unsubscribe functions
  const chatsUnsubscribeRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      // Cleanup on unmount
      if (chatsUnsubscribeRef.current) {
        chatsUnsubscribeRef.current();
      }
      Object.values(unsubscribeRefs.current).forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      return;
    }

    // Cleanup previous chats listener
    if (chatsUnsubscribeRef.current) {
      chatsUnsubscribeRef.current();
    }

    // Listen to all user's chats
    const unsubscribeChats = listenToChats(userId, async (chats) => {
      // Clean up old listeners for chats that no longer exist
      const currentChatIds = new Set(chats.map(c => c.id));
      Object.keys(unsubscribeRefs.current).forEach(chatId => {
        if (!currentChatIds.has(chatId)) {
          unsubscribeRefs.current[chatId]?.();
          delete unsubscribeRefs.current[chatId];
          delete lastMessageIdsRef.current[chatId];
        }
      });

      // For each chat, listen to messages
      chats.forEach((chat) => {
        const chatId = chat.id;
        
        // Skip if already listening
        if (unsubscribeRefs.current[chatId]) return;

        // Listen to messages in this chat
        const unsubscribeMessages = listenToMessages(chatId, async (messages) => {
          if (messages.length === 0) return;

          // Get the last message
          const lastMessage = messages[messages.length - 1];
          
          // Skip if it's from current user or already notified
          if (lastMessage.senderId === userId) return;
          if (lastMessageIdsRef.current[chatId] === lastMessage.id) return;

          // Get sender info
          const sender = await getUserById(lastMessage.senderId);
          if (!sender) return;

          // Create notification
          await createNotification(
            userId,
            NOTIFICATION_TYPES.MESSAGE,
            sender.displayName || sender.email,
            lastMessage.text || 'Đã gửi một hình ảnh',
            {
              chatId,
              senderId: lastMessage.senderId
            }
          ).catch(err => {
            console.error('Failed to create message notification:', err);
          });

          // Update last message ID
          lastMessageIdsRef.current[chatId] = lastMessage.id;
        });

        // Store unsubscribe function
        unsubscribeRefs.current[chatId] = unsubscribeMessages;
      });
    });

    chatsUnsubscribeRef.current = unsubscribeChats;

    return () => {
      if (chatsUnsubscribeRef.current) {
        chatsUnsubscribeRef.current();
        chatsUnsubscribeRef.current = null;
      }
      
      // Clean up message listeners
      Object.values(unsubscribeRefs.current).forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      unsubscribeRefs.current = {};
      lastMessageIdsRef.current = {};
    };
  }, [userId]);
}

