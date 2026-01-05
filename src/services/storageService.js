import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase.js';

/**
 * Upload avatar image to Firebase Storage
 * @param {string} uid - User UID
 * @param {File} file - Image file
 * @returns {Promise<string>} Download URL
 */
export async function uploadAvatar(uid, file) {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be less than 5MB');
  }

  const storageRef = ref(storage, `avatars/${uid}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Upload chat image to Firebase Storage
 * @param {string} chatId - Chat ID
 * @param {string} messageId - Message ID (or timestamp)
 * @param {File} file - Image file
 * @returns {Promise<string>} Download URL
 */
export async function uploadChatImage(chatId, messageId, file) {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image must be less than 10MB');
  }

  const storageRef = ref(storage, `chat_images/${chatId}/${messageId}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}


