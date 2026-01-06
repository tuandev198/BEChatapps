# 📸 Story 24h Setup Guide

## ✅ Đã tạo các components và services

### Components:
1. **CreateStory.jsx** - Modal để đăng story (ảnh/video)
2. **StoryBar.jsx** - Thanh hiển thị story ở đầu trang (giống Instagram)
3. **StoryViewer.jsx** - Viewer full screen để xem story

### Services:
1. **storyService.js** - Quản lý stories trong Firestore và Storage

## 🔧 Cấu hình Firestore Rules

Thêm vào Firestore Rules:

```javascript
// Stories collection
match /stories/{storyId} {
  // Anyone authenticated can read active stories
  allow read: if isAuthenticated() && 
    resource.data.expiresAt > request.time;
  
  // Users can create their own stories
  allow create: if isAuthenticated() && 
    request.resource.data.userId == request.auth.uid &&
    request.resource.data.expiresAt > request.time;
  
  // Users can update their own stories (for mediaURL after upload)
  allow update: if isAuthenticated() && 
    resource.data.userId == request.auth.uid;
  
  // Users can delete their own stories
  allow delete: if isAuthenticated() && 
    resource.data.userId == request.auth.uid;
}
```

## 🔧 Cấu hình Storage Rules

Thêm vào Storage Rules:

```javascript
// Story media uploads
match /stories/{userId}/{storyId} {
  // Anyone authenticated can read story media
  allow read: if request.auth != null;
  
  // Users can upload to their own folder
  allow write: if request.auth != null && 
    request.auth.uid == userId &&
    (request.resource.size < 50 * 1024 * 1024) && // Max 50MB
    (request.resource.contentType.matches('image/.*') || 
     request.resource.contentType.matches('video/.*'));
}
```

## 📋 Firestore Collection Structure

### `stories/{storyId}`
```javascript
{
  userId: string,
  caption: string,
  mediaType: 'image' | 'video',
  mediaURL: string,
  createdAt: Timestamp,
  expiresAt: Timestamp, // createdAt + 24 hours
  views: string[], // Array of viewer UIDs
  viewCount: number
}
```

## 🎯 Cách sử dụng

1. **Đăng story**:
   - Click vào avatar của bạn trong StoryBar (có icon +)
   - Chọn ảnh hoặc video
   - Thêm chú thích (tùy chọn)
   - Click "Đăng Story"

2. **Xem story**:
   - Click vào avatar của bạn hoặc bạn bè trong StoryBar
   - Story sẽ tự động chuyển sau 5 giây
   - Click trái/phải để chuyển story
   - Click giữa để pause/resume

3. **Story tự động xóa sau 24h**:
   - Story có field `expiresAt`
   - Query tự động filter stories đã hết hạn
   - Có thể chạy cron job để xóa expired stories

## 🔄 Auto-delete expired stories

Để tự động xóa stories đã hết hạn, bạn có thể:

1. **Sử dụng Firebase Functions** (recommended):
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.deleteExpiredStories = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const expired = await admin.firestore()
      .collection('stories')
      .where('expiresAt', '<=', now)
      .get();
    
    const batch = admin.firestore().batch();
    expired.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  });
```

2. **Hoặc chạy manual** khi cần:
```javascript
import { deleteExpiredStories } from './services/storyService.js';
deleteExpiredStories();
```

## 📝 Lưu ý

- Story tối đa 10MB cho ảnh, 50MB cho video
- Story tự động hết hạn sau 24 giờ
- Views được track để hiển thị story đã xem/chưa xem
- Story chỉ hiển thị từ bạn bè và chính bạn

## 🐛 Troubleshooting

**Story không hiển thị:**
- Kiểm tra Firestore Rules cho phép đọc stories
- Kiểm tra Storage Rules cho phép đọc media
- Kiểm tra `expiresAt` chưa hết hạn

**Không upload được story:**
- Kiểm tra Storage Rules cho phép upload
- Kiểm tra file size và type
- Kiểm tra Browser Console để xem error

**Story không tự động chuyển:**
- Kiểm tra video có autoplay không
- Kiểm tra progress bar có chạy không
- Thử click để chuyển thủ công

