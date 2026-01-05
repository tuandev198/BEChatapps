import { useEffect, useState } from 'react';
import { listenToFriendRequests, acceptFriendRequest, rejectFriendRequest, getUserById } from '../services/friendService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getInitials } from '../utils/helpers.js';

/**
 * Friend requests component
 */
export default function FriendRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [requestUsers, setRequestUsers] = useState({});
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenToFriendRequests(user.uid, async (requestsList) => {
      setRequests(requestsList);

      // Fetch user data for each request sender
      const usersMap = {};
      await Promise.all(
        requestsList.map(async (request) => {
          const senderData = await getUserById(request.from);
          if (senderData) {
            usersMap[request.from] = senderData;
          }
        })
      );
      setRequestUsers(usersMap);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAccept = async (requestId, fromUid) => {
    if (processing[requestId]) return;
    setProcessing((prev) => ({ ...prev, [requestId]: true }));

    try {
      await acceptFriendRequest(requestId, fromUid, user.uid);
    } catch (err) {
      console.error('Failed to accept request:', err);
    } finally {
      setProcessing((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleReject = async (requestId) => {
    if (processing[requestId]) return;
    setProcessing((prev) => ({ ...prev, [requestId]: true }));

    try {
      await rejectFriendRequest(requestId);
    } catch (err) {
      console.error('Failed to reject request:', err);
    } finally {
      setProcessing((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  if (requests.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        No pending friend requests
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {requests.map((request) => {
        const sender = requestUsers[request.from];
        if (!sender) return null;

        return (
          <div
            key={request.id}
            className="p-3 border-b border-slate-700/50 hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-3 mb-2">
              {sender.photoURL ? (
                <img
                  src={sender.photoURL}
                  alt={sender.displayName || 'User'}
                  className="avatar w-10 h-10"
                />
              ) : (
                <div className="avatar w-10 h-10 bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                  {getInitials(sender.displayName || sender.email || 'U')}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200 truncate">
                  {sender.displayName || sender.email}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {sender.email}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(request.id, request.from)}
                disabled={processing[request.id]}
                className="btn-primary flex-1 text-sm py-1.5"
              >
                {processing[request.id] ? 'Processing...' : 'Accept'}
              </button>
              <button
                onClick={() => handleReject(request.id)}
                disabled={processing[request.id]}
                className="btn-ghost flex-1 text-sm py-1.5"
              >
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}


