import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import ChangeAvatar from './ChangeAvatar.jsx';

/**
 * Profile settings component for updating display name and avatar
 */
export default function ProfileSettings() {
  const { profile, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await updateProfile({ displayName: displayName.trim() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 border-b border-slate-700/50">
      <h2 className="text-sm font-semibold text-slate-300 mb-4">Profile Settings</h2>
      
      <ChangeAvatar />

      <form onSubmit={handleSave} className="mt-4">
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Display Name
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input flex-1"
            placeholder="Your display name"
          />
          <button
            type="submit"
            disabled={saving || !displayName.trim()}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {error && (
          <div className="mt-2 text-xs text-red-400">{error}</div>
        )}
        {success && (
          <div className="mt-2 text-xs text-green-400">Profile updated successfully!</div>
        )}
      </form>
    </div>
  );
}


