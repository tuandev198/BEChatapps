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
  serverTimestamp
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
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', uid),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, async (snapshot) => {
    const chats = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        // Get the other participant's info
        const otherUid = data.participants.find(p => p !== uid);
        return {
          id: docSnap.id,
          ...data,
          otherUid
        };
      })
    );
    callback(chats);
  });
}

/**
 * Listen to messages in a chat
 * @param {string} chatId - Chat ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function listenToMessages(chatId, callback) {
  const messagesRef = collection(db, 'messages', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
}

/**
 * Send a message
 * @param {string} chatId - Chat ID
 * @param {string} senderId - Sender UID
 * @param {string} text - Message text
 * @param {string} imageURL - Optional image URL
 * @returns {Promise<void>}
 */
export async function sendMessage(chatId, senderId, text, imageURL = null) {
  const messagesRef = collection(db, 'messages', chatId, 'messages');
  
  const messageData = {
    senderId,
    text: text || '',
    imageURL: imageURL || null,
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

