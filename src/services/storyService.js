import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase.js';

/**
 * Upload story image/video to Firebase Storage
 * @param {string} userId - User UID
 * @param {string} storyId - Story ID
 * @param {File} file - Image/Video file
 * @returns {Promise<string>} Download URL
 */
export async function uploadStoryMedia(userId, storyId, file) {
  // Validate file type
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    throw new Error('File must be an image or video');
  }

  // Validate file size (max 50MB for videos, 10MB for images)
  const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`File must be less than ${maxSize / 1024 / 1024}MB`);
  }

  const storageRef = ref(storage, `stories/${userId}/${storyId}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Create a new story
 * @param {string} userId - User UID
 * @param {File} mediaFile - Image or video file
 * @param {string} caption - Optional caption
 * @returns {Promise<string>} Story document ID
 */
export async function createStory(userId, mediaFile, caption = '') {
  const storiesRef = collection(db, 'stories');
  
  // Create story document first
  const storyData = {
    userId,
    caption: caption.trim(),
    mediaType: mediaFile.type.startsWith('video/') ? 'video' : 'image',
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    views: [],
    viewCount: 0
  };

  const docRef = await addDoc(storiesRef, storyData);
  const storyId = docRef.id;

  // Upload media file
  const mediaURL = await uploadStoryMedia(userId, storyId, mediaFile);

  // Update story with media URL
  await updateDoc(doc(db, 'stories', storyId), {
    mediaURL
  });

  return storyId;
}

/**
 * Get stories for a user
 * @param {string} userId - User UID
 * @returns {Promise<Array>} Array of story documents
 */
export async function getUserStories(userId) {
  const storiesRef = collection(db, 'stories');
  const q = query(
    storiesRef,
    where('userId', '==', userId),
    where('expiresAt', '>', Timestamp.now()),
    orderBy('expiresAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Get stories from friends (for story feed)
 * @param {Array} friendIds - Array of friend UIDs
 * @returns {Promise<Array>} Array of story documents grouped by user
 */
export async function getFriendsStories(friendIds) {
  if (!friendIds || friendIds.length === 0) return [];

  const storiesRef = collection(db, 'stories');
  const q = query(
    storiesRef,
    where('userId', 'in', friendIds.slice(0, 10)), // Firestore 'in' limit is 10
    where('expiresAt', '>', Timestamp.now()),
    orderBy('userId'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const stories = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Group by userId
  const grouped = {};
  stories.forEach(story => {
    if (!grouped[story.userId]) {
      grouped[story.userId] = [];
    }
    grouped[story.userId].push(story);
  });

  return Object.entries(grouped).map(([userId, userStories]) => ({
    userId,
    stories: userStories.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return aTime - bTime;
    })
  }));
}

/**
 * Listen to stories from friends
 * @param {Array} friendIds - Array of friend UIDs
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function listenToFriendsStories(friendIds, callback) {
  if (!friendIds || friendIds.length === 0) {
    callback([]);
    return () => {};
  }

  const storiesRef = collection(db, 'stories');
  // Note: Firestore 'in' query limit is 10, so we'll fetch all and filter
  const q = query(
    storiesRef,
    where('expiresAt', '>', Timestamp.now()),
    orderBy('expiresAt', 'desc'),
    limit(100) // Limit to prevent too many reads
  );

  return onSnapshot(q, (snapshot) => {
    const allStories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter by friendIds
    const friendsStories = allStories.filter(story => 
      friendIds.includes(story.userId)
    );

    // Group by userId
    const grouped = {};
    friendsStories.forEach(story => {
      if (!grouped[story.userId]) {
        grouped[story.userId] = [];
      }
      grouped[story.userId].push(story);
    });

    const result = Object.entries(grouped).map(([userId, userStories]) => ({
      userId,
      stories: userStories.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return aTime - bTime;
      })
    }));

    callback(result);
  });
}

/**
 * Mark story as viewed
 * @param {string} storyId - Story ID
 * @param {string} viewerId - Viewer UID
 * @returns {Promise<void>}
 */
export async function markStoryAsViewed(storyId, viewerId) {
  const storyRef = doc(db, 'stories', storyId);
  const storySnap = await getDoc(storyRef);

  if (!storySnap.exists()) return;

  const storyData = storySnap.data();
  const views = storyData.views || [];

  // Check if already viewed
  if (views.includes(viewerId)) return;

  // Add viewer to views array
  await updateDoc(storyRef, {
    views: [...views, viewerId],
    viewCount: views.length + 1
  });
}

/**
 * Delete a story
 * @param {string} storyId - Story ID
 * @param {string} userId - User UID (to verify ownership)
 * @returns {Promise<void>}
 */
export async function deleteStory(storyId, userId) {
  const storyRef = doc(db, 'stories', storyId);
  const storySnap = await getDoc(storyRef);

  if (!storySnap.exists()) {
    throw new Error('Story not found');
  }

  const storyData = storySnap.data();
  if (storyData.userId !== userId) {
    throw new Error('You can only delete your own stories');
  }

  await deleteDoc(storyRef);
}

/**
 * Delete expired stories (should be called periodically)
 * @returns {Promise<void>}
 */
export async function deleteExpiredStories() {
  const storiesRef = collection(db, 'stories');
  const q = query(
    storiesRef,
    where('expiresAt', '<=', Timestamp.now())
  );

  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

