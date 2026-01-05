import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Search users by email
 * @param {string} email - Email to search for
 * @returns {Promise<Array>} Array of user documents
 */
export async function searchUsersByEmail(email) {
  if (!email || email.length < 3) return [];

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '>=', email), where('email', '<=', email + '\uf8ff'));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Send a friend request
 * @param {string} fromUid - Current user's UID
 * @param {string} toUid - Target user's UID
 * @returns {Promise<string>} Request document ID
 */
export async function sendFriendRequest(fromUid, toUid) {
  // Check if request already exists
  const requestsRef = collection(db, 'friend_requests');
  const q = query(
    requestsRef,
    where('from', '==', fromUid),
    where('to', '==', toUid)
  );
  
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error('Friend request already sent');
  }

  // Check reverse request
  const reverseQ = query(
    requestsRef,
    where('from', '==', toUid),
    where('to', '==', fromUid)
  );
  const reverseExisting = await getDocs(reverseQ);
  if (!reverseExisting.empty) {
    throw new Error('Friend request already exists');
  }

  // Create new request
  const docRef = await addDoc(collection(db, 'friend_requests'), {
    from: fromUid,
    to: toUid,
    status: 'pending',
    createdAt: serverTimestamp()
  });

  return docRef.id;
}

/**
 * Accept a friend request
 * @param {string} requestId - Friend request document ID
 * @param {string} fromUid - User who sent the request
 * @param {string} toUid - User who received the request
 * @returns {Promise<void>}
 */
export async function acceptFriendRequest(requestId, fromUid, toUid) {
  // Use Firestore batch for atomic operations
  const batch = writeBatch(db);
  
  // Update request status
  const requestRef = doc(db, 'friend_requests', requestId);
  batch.update(requestRef, { status: 'accepted' });

  // Add to friends array for both users
  const fromUserRef = doc(db, 'users', fromUid);
  const toUserRef = doc(db, 'users', toUid);
  
  const [fromUserSnap, toUserSnap] = await Promise.all([
    getDoc(fromUserRef),
    getDoc(toUserRef)
  ]);
  
  const fromFriends = fromUserSnap.data()?.friends || [];
  const toFriends = toUserSnap.data()?.friends || [];

  if (!fromFriends.includes(toUid)) {
    batch.update(fromUserRef, {
      friends: [...fromFriends, toUid]
    });
  }

  if (!toFriends.includes(fromUid)) {
    batch.update(toUserRef, {
      friends: [...toFriends, fromUid]
    });
  }

  // Create chat room if it doesn't exist
  const chatId = [fromUid, toUid].sort().join('_');
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  
  if (!chatSnap.exists()) {
    batch.set(chatRef, {
      participants: [fromUid, toUid],
      lastMessage: '',
      updatedAt: serverTimestamp()
    });
  }

  // Execute all updates atomically
  await batch.commit();
}

/**
 * Reject a friend request
 * @param {string} requestId - Friend request document ID
 * @returns {Promise<void>}
 */
export async function rejectFriendRequest(requestId) {
  const requestRef = doc(db, 'friend_requests', requestId);
  await updateDoc(requestRef, { status: 'rejected' });
}

/**
 * Listen to friend requests for a user
 * @param {string} uid - User UID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function listenToFriendRequests(uid, callback) {
  const requestsRef = collection(db, 'friend_requests');
  const q = query(requestsRef, where('to', '==', uid), where('status', '==', 'pending'));
  
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(requests);
  });
}

/**
 * Get user data by UID
 * @param {string} uid - User UID
 * @returns {Promise<Object|null>} User document
 */
export async function getUserById(uid) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
}

