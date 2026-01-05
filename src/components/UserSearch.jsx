import { useState } from 'react';
import { searchUsersByEmail, sendFriendRequest, getUserById } from '../services/friendService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getInitials } from '../utils/helpers.js';

/**
 * User search component for finding and sending friend requests
 */
export default function UserSearch() {
  const { user, profile } = useAuth();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState({});
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setSearching(true);
    setError('');

    try {
      const results = await searchUsersByEmail(searchEmail.trim());
      // Filter out current user and existing friends
      const filtered = results.filter(
        (result) =>
          result.id !== user.uid &&
          !profile?.friends?.includes(result.id)
      );
      setSearchResults(filtered);
      
      if (filtered.length === 0 && results.length === 0) {
        setError('No users found with this email');
      }
    } catch (err) {
      console.error('Search error:', err);
      let errorMessage = 'Failed to search users';
      
      if (err.code === 'permission-denied' || err.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please check Firestore rules allow querying users collection.';
      } else if (err.code === 'failed-precondition') {
        errorMessage = 'Index required. Please check Firebase Console for index creation link.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (toUid) => {
    if (sending[toUid]) return;
    setSending((prev) => ({ ...prev, [toUid]: true }));
    setError('');

    try {
      await sendFriendRequest(user.uid, toUid);
      // Remove from results
      setSearchResults((prev) => prev.filter((r) => r.id !== toUid));
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Send request error:', err);
      let errorMessage = 'Failed to send friend request';
      
      if (err.code === 'permission-denied' || err.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please check Firestore rules allow creating friend requests.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSending((prev) => ({ ...prev, [toUid]: false }));
    }
  };

  return (
    <div className="p-4 border-b border-slate-700/50">
      <h2 className="text-sm font-semibold text-slate-300 mb-3">Thêm bạn</h2>
      <form onSubmit={handleSearch} className="mb-3">
        <div className="flex gap-2">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Search by email..."
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={searching || !searchEmail.trim()}
            className="btn-primary"
          >
            {searching ? '...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-3 text-xs text-red-400 bg-red-500/20 border border-red-500/50 p-2 rounded">
          {error}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg"
            >
              {result.photoURL ? (
                <img
                  src={result.photoURL}
                  alt={result.displayName || 'User'}
                  className="avatar w-10 h-10"
                />
              ) : (
                <div className="avatar w-10 h-10 bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                  {getInitials(result.displayName || result.email || 'U')}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200 truncate">
                  {result.displayName || result.email}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {result.email}
                </div>
              </div>
              <button
                onClick={() => handleSendRequest(result.id)}
                disabled={sending[result.id]}
                className="btn-primary text-sm py-1.5 px-3"
              >
                {sending[result.id] ? 'Sending...' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


