import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Get or create chat ID for two users
 * @param {string} uid1 - First user UID
 * @param {string} uid2 - Second user UID
 * @returns {string} Chat ID
 */
export function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

/**
 * Listen to user's chats
 * @param {string} uid - User UID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function listenToChats(uid, callback) {
  if (!uid) {
    callback([]);
    return () => {};
  }

  console.log('🔍 listenToChats: Starting listener for UID:', uid);
  const chatsRef = collection(db, 'chats');
  
  // Try with orderBy first, fallback if index missing
  let q;
  let useOrderBy = true;
  
  try {
    q = query(
      chatsRef,
      where('participants', 'array-contains', uid),
      orderBy('updatedAt', 'desc')
    );
  } catch (error) {
    console.warn('⚠️ listenToChats: OrderBy query failed, using simple query');
    useOrderBy = false;
    q = query(
      chatsRef,
      where('participants', 'array-contains', uid)
    );
  }

  console.log('📡 listenToChats: Setting up onSnapshot listener');
  
  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      console.log('📦 listenToChats: Snapshot received:', {
        size: snapshot.size,
        empty: snapshot.empty
      });
      
      try {
        const chats = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const otherUid = data.participants?.find(p => p !== uid);
          
          return {
            id: docSnap.id,
            ...data,
            otherUid
          };
        });
        
        // Sort manually if orderBy was not used
        if (!useOrderBy) {
          chats.sort((a, b) => {
            const aTime = a.updatedAt?.toMillis?.() || 0;
            const bTime = b.updatedAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
        }
        
        console.log('✅ listenToChats: Calling callback with', chats.length, 'chats');
        callback(chats);
      } catch (error) {
        console.error('❌ listenToChats: Error processing chats snapshot:', error);
        callback([]);
      }
    },
    (error) => {
      console.error('❌ listenToChats: Firestore snapshot error:', error);
      // If error is about missing index and we haven't tried without orderBy yet
      if (error.code === 'failed-precondition' && useOrderBy && error.message?.includes('index')) {
        console.log('🔄 listenToChats: Index missing, retrying without orderBy');
        // Don't create nested listener - just call callback with empty array
        // The component will handle retry if needed
        callback([]);
        return;
      }
      
      callback([]);
    }
  );
  
  return unsubscribe;
}

/**
 * Listen to messages in a chat
 * @param {string} chatId - Chat ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function listenToMessages(chatId, callback) {
  if (!chatId) {
    console.warn('listenToMessages: No chatId provided');
    callback([]);
    return () => {}; // Return empty unsubscribe function
  }

  console.log('🔍 listenToMessages: Starting listener for chatId:', chatId);
  const messagesRef = collection(db, 'messages', chatId, 'messages');
  
  // Try with orderBy first, fallback if index missing
  let q;
  try {
    q = query(messagesRef, orderBy('createdAt', 'asc'));
  } catch (error) {
    console.warn('⚠️ listenToMessages: OrderBy failed, using simple query:', error);
    q = query(messagesRef);
  }

  return onSnapshot(
    q,
    (snapshot) => {
      console.log('📦 listenToMessages: Snapshot received:', {
        chatId,
        size: snapshot.size,
        empty: snapshot.empty,
        docIds: snapshot.docs.map(d => d.id)
      });
      
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ listenToMessages: Calling callback with', messages.length, 'messages');
      callback(messages);
    },
    (error) => {
      console.error('❌ listenToMessages: Error:', error);
      callback([]);
    }
  );
}

/**
 * Send a message
 * @param {string} chatId - Chat ID
 * @param {string} senderId - Sender UID
 * @param {string} text - Message text
 * @param {string} imageURL - Optional image URL
 * @param {Object} replyTo - Optional reply to message {id, text, senderId}
 * @returns {Promise<void>}
 */
export async function sendMessage(chatId, senderId, text, imageURL = null, replyTo = null) {
  const messagesRef = collection(db, 'messages', chatId, 'messages');
  
  const messageData = {
    senderId,
    text: text || '',
    imageURL: imageURL || null,
    replyTo: replyTo || null,
    reactions: {},
    deleted: false,
    createdAt: serverTimestamp()
  };

  await addDoc(messagesRef, messageData);

  // Update chat's lastMessage and updatedAt
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessage: text || 'Image',
    updatedAt: serverTimestamp()
  });
}

/**
 * Delete a message (mark as deleted)
 * @param {string} chatId - Chat ID
 * @param {string} messageId - Message ID
 * @param {string} senderId - Sender UID (to verify ownership)
 * @returns {Promise<void>}
 */
export async function deleteMessage(chatId, messageId, senderId) {
  const messageRef = doc(db, 'messages', chatId, 'messages', messageId);
  const messageSnap = await getDoc(messageRef);
  
  if (!messageSnap.exists()) {
    throw new Error('Message not found');
  }
  
  const messageData = messageSnap.data();
  if (messageData.senderId !== senderId) {
    throw new Error('You can only delete your own messages');
  }
  
  // Mark as deleted instead of actually deleting
  await updateDoc(messageRef, {
    deleted: true,
    text: 'Tin nhắn đã được thu hồi',
    imageURL: deleteField()
  });
  
  // Update chat's lastMessage if this was the last message
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    updatedAt: serverTimestamp()
  });
}

/**
 * Add reaction to a message
 * @param {string} chatId - Chat ID
 * @param {string} messageId - Message ID
 * @param {string} userId - User UID
 * @param {string} emoji - Emoji reaction
 * @returns {Promise<void>}
 */
export async function addReaction(chatId, messageId, userId, emoji) {
  const messageRef = doc(db, 'messages', chatId, 'messages', messageId);
  const messageSnap = await getDoc(messageRef);
  
  if (!messageSnap.exists()) {
    throw new Error('Message not found');
  }
  
  const messageData = messageSnap.data();
  const reactions = messageData.reactions || {};
  
  // Toggle reaction: if user already reacted with this emoji, remove it
  // Otherwise, add/update the reaction
  if (reactions[userId] === emoji) {
    delete reactions[userId];
  } else {
    reactions[userId] = emoji;
  }
  
  await updateDoc(messageRef, {
    reactions: reactions
  });
}

/**
 * Delete a chat (remove from user's view)
 * @param {string} chatId - Chat ID
 * @param {string} userId - User UID
 * @returns {Promise<void>}
 */
export async function deleteChat(chatId, userId) {
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  
  if (!chatSnap.exists()) {
    throw new Error('Chat not found');
  }
  
  const chatData = chatSnap.data();
  
  // Remove user from participants (soft delete)
  // Or you can delete the entire chat if both users agree
  // For now, we'll mark it as deleted for this user
  const deletedBy = chatData.deletedBy || [];
  if (!deletedBy.includes(userId)) {
    deletedBy.push(userId);
  }
  
  await updateDoc(chatRef, {
    deletedBy: deletedBy,
    updatedAt: serverTimestamp()
  });
}

