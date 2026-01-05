import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatTimestamp } from '../utils/helpers.js';

export default function NotificationCenter({ isOpen, onClose }) {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.uid);
  const navigate = useNavigate();

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on type
    switch (notification.type) {
      case 'message':
        if (notification.data?.chatId) {
          navigate('/chat', { state: { chatId: notification.data.chatId } });
        }
        break;
      case 'friend_request':
        navigate('/requests');
        break;
      case 'friend_accepted':
        navigate('/friends');
        break;
      case 'new_post':
        navigate('/');
        break;
      default:
        break;
    }

    onClose();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Notification Panel */}
      <div className="fixed top-16 right-4 md:right-20 w-80 md:w-96 bg-white rounded-lg shadow-xl z-50 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            Thông báo {unreadCount > 0 && `(${unreadCount})`}
          </h2>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p>Không có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                    !notification.read ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {notification.type === 'message' && '💬'}
                      {notification.type === 'friend_request' && '👤'}
                      {notification.type === 'friend_accepted' && '✅'}
                      {notification.type === 'new_post' && '📸'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${
                            !notification.read ? 'text-slate-900' : 'text-slate-600'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {notification.body}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      {notification.createdAt && (
                        <p className="text-xs text-slate-400 mt-2">
                          {formatTimestamp(notification.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

