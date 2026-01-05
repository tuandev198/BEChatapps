import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { uploadAvatar } from '../services/storageService.js';
import { getInitials } from '../utils/helpers.js';

/**
 * Component for changing user avatar
 */
export default function ChangeAvatar() {
  const { user, profile, updateProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      // Upload to Firebase Storage
      const downloadURL = await uploadAvatar(user.uid, file);
      
      // Update Firebase Auth profile
      await updateProfile({ photoURL: downloadURL });
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Avatar upload error:', err);
      let errorMessage = 'Failed to upload avatar';
      
      if (err.code === 'storage/unauthorized' || err.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please check Firebase Storage rules allow uploading avatars.';
      } else if (err.code === 'storage/unauthorized') {
        errorMessage = 'You do not have permission to upload. Please check Storage rules.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={uploading}
        className="relative group"
        aria-label="Change avatar"
      >
        {profile?.photoURL ? (
          <img
            src={profile.photoURL}
            alt={profile.displayName || 'Avatar'}
            className="avatar w-12 h-12 group-hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className="avatar w-12 h-12 bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg group-hover:opacity-80 transition-opacity">
            {getInitials(profile?.displayName || user?.email || 'U')}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-200 truncate">
          {profile?.displayName || user?.email || 'User'}
        </div>
        <div className="text-xs text-slate-400 truncate">
          {user?.email}
        </div>
        {error && (
          <div className="text-xs text-red-400 mt-1">{error}</div>
        )}
      </div>
    </div>
  );
}


