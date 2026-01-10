import { useState } from 'react';
import { searchUsersByEmail, sendFriendRequest } from '../services/friendService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getInitials } from '../utils/helpers.js';
import { LoadingSpinner } from './Loading.jsx';

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
      const filtered = results.filter((r) => r.id !== user.uid);

      setSearchResults(filtered);

      if (filtered.length === 0) {
        setError('Không tìm thấy người dùng');
      }
    } catch (err) {
      setError(err.message || 'Tìm kiếm thất bại');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (toUid) => {
    if (sending[toUid]) return;

    setSending((p) => ({ ...p, [toUid]: true }));
    setError('');

    try {
      await sendFriendRequest(user.uid, toUid);

      // Ẩn user sau khi gửi lời mời (tuỳ UX)
      setSearchResults((prev) => prev.filter((u) => u.id !== toUid));
    } catch (err) {
      setError(err.message || 'Gửi lời mời thất bại');
    } finally {
      setSending((p) => ({ ...p, [toUid]: false }));
    }
  };

  return (
    <div className="p-4 border-b border-slate-700/50">
      <h2 className="text-sm font-semibold text-[rgb(79_70_229)] mb-3">
        Thêm bạn
      </h2>

      {/* SEARCH */}
      <form onSubmit={handleSearch} className="mb-3">
        <div className="flex gap-2">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Nhập email..."
            className="
              flex-1 rounded-xl px-3 py-2 text-sm
              bg-slate-900/60 text-slate-200
              border border-slate-700
              focus:outline-none
              focus:ring-1 focus:ring-[rgb(79_70_229)]
            "
          />

          <button
            type="submit"
            disabled={searching || !searchEmail.trim()}
            className="
              rounded-xl px-4 text-sm font-medium text-white
              bg-[rgb(79_70_229)]
              hover:bg-[rgb(79_70_229/0.9)]
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            {searching && <LoadingSpinner size="sm" />}
            {searching ? 'Đang tìm...' : 'Tìm'}
          </button>
        </div>
      </form>

      {/* ERROR */}
      {error && (
        <div
          className="
            mb-3 text-xs text-[rgb(79_70_229)]
            bg-[rgb(79_70_229/0.12)]
            border border-[rgb(79_70_229/0.4)]
            p-2 rounded-lg
          "
        >
          {error}
        </div>
      )}

      {/* RESULTS */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((result) => {
            const isFriend = profile?.friends?.includes(result.id);

            return (
              <div
                key={result.id}
                className="
                  flex items-center gap-3 p-2 rounded-xl
                  bg-[rgb(79_70_229/0.08)]
                  hover:bg-[rgb(79_70_229/0.15)]
                  transition
                "
              >
                {/* AVATAR */}
                {result.photoURL ? (
                  <img
                    src={result.photoURL}
                    alt={result.displayName || 'User'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="
                      w-10 h-10 rounded-full
                      bg-[rgb(79_70_229)]
                      flex items-center justify-center
                      text-white font-semibold text-sm
                    "
                  >
                    {getInitials(result.displayName || result.email || 'U')}
                  </div>
                )}

                {/* INFO */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-indigo-600 truncate">
                    {result.displayName || result.email}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {result.email}
                  </div>
                </div>

                {/* ACTION */}
                {isFriend ? (
                  <span
                    className="
                      text-xs px-3 py-1.5 rounded-lg
                      text-green-400
                      bg-green-500/10
                      border border-green-500/30
                    "
                  >
                    Bạn bè
                  </span>
                ) : (
                  <button
                    onClick={() => handleSendRequest(result.id)}
                    disabled={sending[result.id]}
                    className="
                      text-sm px-3 py-1.5 rounded-lg text-white
                      bg-[rgb(79_70_229)]
                      hover:bg-[rgb(79_70_229/0.9)]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center gap-1
                    "
                  >
                    {sending[result.id] && <LoadingSpinner size="sm" />}
                    {sending[result.id] ? 'Đang gửi...' : 'Thêm bạn'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
