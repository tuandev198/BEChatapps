import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  FRIEND_REQUEST: 'friend_request',
  FRIEND_ACCEPTED: 'friend_accepted',
  NEW_POST: 'new_post'
};

/**
 * Create a notification
 * @param {string} userId - User UID who will receive the notification
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data (e.g., chatId, postId, userId)
 * @returns {Promise<string>} Notification ID
 */
export async function createNotification(userId, type, title, body, data = {}) {
  const notificationsRef = collection(db, 'notifications');
  
  const notification = {
    userId,
    type,
    title,
    body,
    data,
    read: false,
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(notificationsRef, notification);
  return docRef.id;
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification document ID
 * @returns {Promise<void>}
 */
export async function markNotificationAsRead(notificationId) {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true });
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User UID
 * @returns {Promise<void>}
 */
export async function markAllNotificationsAsRead(userId) {
  // This would require a batch update or Cloud Function
  // For now, we'll handle it client-side by updating each notification
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('read', '==', false)
  );
  
  // Note: This is not efficient for large datasets
  // In production, use a Cloud Function
  const snapshot = await import('firebase/firestore').then(m => m.getDocs(q));
  const batch = await import('firebase/firestore').then(m => m.writeBatch(db));
  
  snapshot.docs.forEach(docSnap => {
    batch.update(docSnap.ref, { read: true });
  });
  
  await batch.commit();
}

/**
 * Listen to user notifications
 * @param {string} userId - User UID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function listenToNotifications(userId, callback) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notifications);
    },
    (error) => {
      console.error('Error listening to notifications:', error);
      callback([]);
    }
  );
}

/**
 * Listen to unread notification count
 * @param {string} userId - User UID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function listenToUnreadCount(userId, callback) {
  if (!userId) {
    callback(0);
    return () => {};
  }

  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('read', '==', false)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.size);
    },
    (error) => {
      console.error('Error listening to unread count:', error);
      callback(0);
    }
  );
}

