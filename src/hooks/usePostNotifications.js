import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listenToPosts } from '../services/postService.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService.js';
import { getUserById } from '../services/friendService.js';

/**
 * Hook to listen for new posts from friends and create notifications
 * @param {string} userId - Current user UID
 * @param {Array} friendIds - Array of friend UIDs
 */
export function usePostNotifications(userId, friendIds) {
  const lastPostIdsRef = useRef({}); // Track last post ID per friend
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!userId || !friendIds || friendIds.length === 0) {
      lastPostIdsRef.current = {};
      // Cleanup if exists
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    // Cleanup previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Listen to all posts (filtered by friends)
    const unsubscribe = listenToPosts(userId, friendIds, async (posts) => {
      // Get new posts from friends
      const friendPosts = posts.filter(post => 
        friendIds.includes(post.userId) && 
        post.userId !== userId &&
        lastPostIdsRef.current[post.userId] !== post.id
      );

      for (const post of friendPosts) {
        try {
          const postAuthor = await getUserById(post.userId);
          if (!postAuthor) continue;

          // Create notification
          await createNotification(
            userId,
            NOTIFICATION_TYPES.NEW_POST,
            postAuthor.displayName || postAuthor.email,
            post.caption || 'Đã đăng một bài viết mới',
            {
              postId: post.id,
              userId: post.userId
            }
          ).catch(err => {
            console.error('Failed to create post notification:', err);
          });

          // Update last post ID for this friend
          lastPostIdsRef.current[post.userId] = post.id;
        } catch (error) {
          console.error('Error processing post notification:', error);
        }
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      lastPostIdsRef.current = {};
    };
  }, [userId, friendIds]);
}

