import { useEffect, useState } from 'react';
import {
  listenToNotifications,
  listenToUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/notificationService.js';

/**
 * Hook to manage notifications
 * @param {string} userId - User UID
 * @returns {Object} { notifications, unreadCount, markAsRead, markAllAsRead }
 */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const unsubscribeNotifications = listenToNotifications(userId, (list) => {
      setNotifications(list);
    });

    const unsubscribeUnread = listenToUnreadCount(userId, (count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeUnread();
    };
  }, [userId]);

  const markAsRead = async (notificationId) => {
    await markNotificationAsRead(notificationId);
  };

  const markAllAsRead = async () => {
    await markAllNotificationsAsRead(userId);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}

