import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { createPost } from '../services/postService.js';
import { Camera } from 'lucide-react';

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Ảnh phải nhỏ hơn 10MB');
      return;
    }

    setImageFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!imageFile && !caption.trim()) {
      setError('Vui lòng thêm ảnh hoặc nội dung');
      return;
    }

    setUploading(true);
    setError('');

    try {
      await createPost(user.uid, caption.trim(), imageFile);
      
      // Reset form
      setCaption('');
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err) {
      setError(err.message || 'Không thể đăng bài');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3">
          <img
            src={user?.photoURL || ''}
            alt={user?.displayName || 'User'}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="flex-1">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Bạn đang nghĩ gì?"
              className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500 resize-none"
              rows={3}
              disabled={uploading}
            />
          </div>
        </div>

        {imagePreview && (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full rounded-xl max-h-96 object-contain"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="text-xl"><Camera className="w-5 h-5" /></span>
            <span className="text-sm">Ảnh</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="submit"
            disabled={uploading || (!imageFile && !caption.trim())}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Đang đăng...' : 'Đăng'}
          </button>
        </div>
      </form>
    </div>
  );
}


