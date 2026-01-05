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
  console.log('🔍 listenToChats: Starting listener for UID:', uid);
  const chatsRef = collection(db, 'chats');
  
  // Helper function to create listener
  const createListener = (useOrderBy = true) => {
    let q;
    if (useOrderBy) {
      try {
        q = query(
          chatsRef,
          where('participants', 'array-contains', uid),
          orderBy('updatedAt', 'desc')
        );
        console.log('✅ listenToChats: Query with orderBy created');
      } catch (error) {
        console.warn('⚠️ listenToChats: OrderBy query creation failed:', error);
        // Fallback to simple query
        return createListener(false);
      }
    } else {
      q = query(
        chatsRef,
        where('participants', 'array-contains', uid)
      );
      console.log('✅ listenToChats: Fallback query (no orderBy) created');
    }

    console.log('📡 listenToChats: Setting up onSnapshot listener');
    
    return onSnapshot(
      q,
      async (snapshot) => {
        console.log('📦 listenToChats: Snapshot received:', {
          size: snapshot.size,
          empty: snapshot.empty,
          docIds: snapshot.docs.map(d => d.id)
        });
        
        try {
          const chats = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data();
              console.log('📄 listenToChats: Processing doc:', docSnap.id, {
                participants: data.participants,
                lastMessage: data.lastMessage,
                updatedAt: data.updatedAt
              });
              
              // Get the other participant's info
              const otherUid = data.participants?.find(p => p !== uid);
              console.log('👤 listenToChats: Other UID:', otherUid, 'from participants:', data.participants);
              
              return {
                id: docSnap.id,
                ...data,
                otherUid
              };
            })
          );
          
          console.log('✅ listenToChats: Processed chats:', chats.length, chats);
          
          // Sort manually if orderBy was not used
          if (!useOrderBy) {
            chats.sort((a, b) => {
              const aTime = a.updatedAt?.toMillis?.() || 0;
              const bTime = b.updatedAt?.toMillis?.() || 0;
              return bTime - aTime;
            });
            console.log('✅ listenToChats: Sorted chats manually');
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
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // If error is about missing index and we're using orderBy, retry without orderBy
        if (error.code === 'failed-precondition' && useOrderBy && error.message?.includes('index')) {
          console.log('🔄 listenToChats: Index missing, retrying without orderBy...');
          // Unsubscribe current listener and create new one without orderBy
          return createListener(false);
        }
        
        // Call callback with empty array on other errors
        callback([]);
      }
    );
  };

  // Start with orderBy, will fallback if needed
  return createListener(true);
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

