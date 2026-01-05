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
  serverTimestamp,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from './firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase.js';

/**
 * Upload post image to Firebase Storage
 * @param {string} userId - User UID
 * @param {string} postId - Post ID (or timestamp)
 * @param {File} file - Image file
 * @returns {Promise<string>} Download URL
 */
export async function uploadPostImage(userId, postId, file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image must be less than 10MB');
  }

  const storageRef = ref(storage, `posts/${userId}/${postId}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Create a new post
 * @param {string} userId - User UID
 * @param {string} caption - Post caption
 * @param {File} imageFile - Image file
 * @returns {Promise<string>} Post document ID
 */
export async function createPost(userId, caption, imageFile) {
  const postsRef = collection(db, 'posts');
  
  // Create post document first
  const postData = {
    userId,
    caption: caption || '',
    imageURL: '',
    likes: [],
    comments: [],
    createdAt: serverTimestamp()
  };
  
  const postRef = await addDoc(postsRef, postData);
  const postId = postRef.id;
  
  // Upload image if provided
  if (imageFile) {
    try {
      const imageURL = await uploadPostImage(userId, postId, imageFile);
      await updateDoc(postRef, { imageURL });
    } catch (error) {
      // If image upload fails, delete the post
      await deleteDoc(postRef);
      throw error;
    }
  }
  
  return postId;
}

/**
 * Like or unlike a post
 * @param {string} postId - Post ID
 * @param {string} userId - User UID
 * @returns {Promise<void>}
 */
export async function likePost(postId, userId) {
  const postRef = doc(db, 'posts', postId);
  const postSnap = await getDoc(postRef);
  
  if (!postSnap.exists()) {
    throw new Error('Post not found');
  }
  
  const postData = postSnap.data();
  const likes = postData.likes || [];
  
  // Toggle like
  if (likes.includes(userId)) {
    // Unlike: remove userId from array
    await updateDoc(postRef, {
      likes: likes.filter(id => id !== userId)
    });
  } else {
    // Like: add userId to array
    await updateDoc(postRef, {
      likes: [...likes, userId]
    });
  }
}

/**
 * Add a comment to a post
 * @param {string} postId - Post ID
 * @param {string} userId - User UID
 * @param {string} text - Comment text
 * @returns {Promise<string>} Comment ID
 */
export async function addComment(postId, userId, text) {
  const postRef = doc(db, 'posts', postId);
  const postSnap = await getDoc(postRef);
  
  if (!postSnap.exists()) {
    throw new Error('Post not found');
  }
  
  const postData = postSnap.data();
  const comments = postData.comments || [];
  
  const newComment = {
    id: Date.now().toString(),
    userId,
    text,
    createdAt: serverTimestamp()
  };
  
  await updateDoc(postRef, {
    comments: [...comments, newComment]
  });
  
  return newComment.id;
}

/**
 * Delete a post
 * @param {string} postId - Post ID
 * @param {string} userId - User UID (to verify ownership)
 * @returns {Promise<void>}
 */
export async function deletePost(postId, userId) {
  const postRef = doc(db, 'posts', postId);
  const postSnap = await getDoc(postRef);
  
  if (!postSnap.exists()) {
    throw new Error('Post not found');
  }
  
  const postData = postSnap.data();
  if (postData.userId !== userId) {
    throw new Error('You can only delete your own posts');
  }
  
  await deleteDoc(postRef);
}

/**
 * Listen to all posts (feed) - only from friends and self
 * @param {string} userId - Current user UID
 * @param {Array} friendIds - Array of friend UIDs
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function listenToPosts(userId, friendIds, callback) {
  const postsRef = collection(db, 'posts');
  
  // Get posts from user and friends only
  const allowedUserIds = [userId, ...(friendIds || [])];
  
  // Firestore doesn't support 'in' with array-contains-any for multiple fields
  // So we'll filter in the callback
  let q;
  try {
    q = query(postsRef, orderBy('createdAt', 'desc'), limit(50));
  } catch (error) {
    console.warn('⚠️ listenToPosts: OrderBy failed, using simple query:', error);
    q = query(postsRef, limit(50));
  }

  return onSnapshot(q, (snapshot) => {
    // Filter posts to only show from friends and self
    const allPosts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const filteredPosts = allPosts.filter(post => 
      allowedUserIds.includes(post.userId)
    );
    
    // Sort manually if orderBy failed
    if (!q.queryConstraints?.some(c => c.type === 'orderBy')) {
      filteredPosts.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
    }
    
    callback(filteredPosts);
  });
}

/**
 * Listen to user's posts
 * @param {string} userId - User UID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function listenToUserPosts(userId, callback) {
  const postsRef = collection(db, 'posts');
  const q = query(
    postsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(posts);
  });
}

/**
 * Get a single post by ID
 * @param {string} postId - Post ID
 * @returns {Promise<Object|null>} Post document
 */
export async function getPostById(postId) {
  const postRef = doc(db, 'posts', postId);
  const postSnap = await getDoc(postRef);
  return postSnap.exists() ? { id: postSnap.id, ...postSnap.data() } : null;
}

