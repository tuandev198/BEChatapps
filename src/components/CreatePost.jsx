import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { createPost } from '../services/postService.js';
import { Camera } from 'lucide-react';
import { LoadingSpinner } from './Loading.jsx';

/* =====================================================
   IMAGE PROCESS: CROP → RESIZE → COMPRESS
   ===================================================== */
const processImage = (
  file,
  {
    aspectRatio = 4 / 5,      // Tỷ lệ app
    outputWidth = 1080,       // Kích thước chuẩn
    outputHeight = 1350,
    quality = 0.8,
    mimeType = 'image/jpeg',
  } = {}
) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => (img.src = reader.result);

    img.onload = () => {
      const imgRatio = img.width / img.height;

      let cropWidth, cropHeight, cropX, cropY;

      // 🔥 CẮT ẢNH THEO TỶ LỆ APP (CENTER CROP)
      if (imgRatio > aspectRatio) {
        // Ảnh quá ngang → cắt bớt chiều ngang
        cropHeight = img.height;
        cropWidth = img.height * aspectRatio;
        cropX = (img.width - cropWidth) / 2;
        cropY = 0;
      } else {
        // Ảnh quá dọc → cắt bớt chiều dọc
        cropWidth = img.width;
        cropHeight = img.width / aspectRatio;
        cropX = 0;
        cropY = (img.height - cropHeight) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Xử lý ảnh thất bại'));

          const processedFile = new File(
            [blob],
            file.name.replace(/\.\w+$/, '.jpg'),
            {
              type: mimeType,
              lastModified: Date.now(),
            }
          );

          resolve(processedFile);
        },
        mimeType,
        quality
      );
    };

    img.onerror = reject;
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
/* ===================================================== */

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();

  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  /* ================= HANDLE IMAGE ================= */
  const handleFileSelect = async (e) => {
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

    try {
      setUploading(true);
      setError('');

      // 🔥 CROP + RESIZE + NÉN ẢNH
      const processedFile = await processImage(file, {
        aspectRatio: 4 / 5,
        outputWidth: 1080,
        outputHeight: 1350,
        quality: 0.8,
      });

      setImageFile(processedFile);

      // Preview từ ảnh đã xử lý
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(processedFile);
    } catch {
      setError('Không thể xử lý ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile && !caption.trim()) {
      setError('Vui lòng thêm ảnh hoặc nội dung');
      return;
    }

    try {
      setUploading(true);
      setError('');

      await createPost(user.uid, caption.trim(), imageFile);

      setCaption('');
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      onPostCreated?.();
    } catch (err) {
      setError(err.message || 'Không thể đăng bài');
    } finally {
      setUploading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3">
          <img
            src={user?.photoURL || ''}
            alt="User"
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => (e.target.style.display = 'none')}
          />

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Bạn đang nghĩ gì?"
            rows={3}
            disabled={uploading}
            className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {imagePreview && (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full rounded-xl max-h-[500px] object-contain"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
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
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Camera className="w-5 h-5" />
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
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {uploading && <LoadingSpinner size="sm" />}
            {uploading ? 'Đang đăng...' : 'Đăng'}
          </button>
        </div>
      </form>
    </div>
  );
}
