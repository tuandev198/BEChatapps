import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { createStory } from '../services/storyService.js';
import { X, Camera, Video, Image as ImageIcon } from 'lucide-react';
import { LoadingSpinner } from './Loading.jsx';

/**
 * Component để tạo story mới
 */
export default function CreateStory({ isOpen, onClose, onStoryCreated }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
      setError('Chỉ chấp nhận file ảnh hoặc video');
      return;
    }

    // Validate file size
    const maxSize = selectedFile.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(`File quá lớn. Tối đa ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setFile(selectedFile);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    if (selectedFile.type.startsWith('image/')) {
      reader.readAsDataURL(selectedFile);
    } else {
      // For video, create object URL
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !user) return;

    setUploading(true);
    setError('');

    try {
      await createStory(user.uid, file, caption);
      onStoryCreated?.();
      handleClose();
    } catch (err) {
      setError(err.message || 'Không thể đăng story');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setCaption('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">Tạo Story</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {!preview ? (
              // Upload area
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Camera className="w-10 h-10 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-slate-800 mb-2">
                      Chọn ảnh hoặc video
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                      Ảnh: tối đa 10MB | Video: tối đa 50MB
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Chọn file
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Preview area
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black">
                  {file?.type.startsWith('image/') ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-h-[400px] object-contain"
                    />
                  ) : (
                    <video
                      src={preview}
                      controls
                      className="w-full max-h-[400px]"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Chú thích (tùy chọn)
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Viết chú thích..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {caption.length}/200 ký tự
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 flex gap-2">
            {preview && (
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Chọn lại
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {uploading && <LoadingSpinner size="sm" />}
              {uploading ? 'Đang đăng...' : 'Đăng Story'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

