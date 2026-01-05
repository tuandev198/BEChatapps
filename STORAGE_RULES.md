# Firebase Storage Security Rules

## ⚠️ QUAN TRỌNG: Cấu hình Storage Rules

Lỗi "storage/unauthorized" xảy ra khi Firebase Storage security rules không cho phép upload/đọc files.

## Cách cấu hình Storage Rules

1. **Vào Firebase Console**
   - Chọn project của bạn
   - Vào **Storage** → **Rules** tab

2. **Copy và paste rules sau:**

### Rules cho Development (Test Mode) - RECOMMENDED

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Cho phép user đã đăng nhập upload/đọc tất cả files
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **CẢNH BÁO**: Rules trên chỉ dùng cho development. KHÔNG dùng cho production!

**Lưu ý**: Rules này cho phép:
- ✅ User đã đăng nhập có thể upload avatar
- ✅ User đã đăng nhập có thể upload chat images
- ✅ User đã đăng nhập có thể đọc tất cả files

### Rules cho Production (Recommended)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper function: check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function: check file size (max 5MB for avatars)
    function isAvatarSize() {
      return request.resource.size < 5 * 1024 * 1024;
    }
    
    // Helper function: check file size (max 10MB for chat images)
    function isChatImageSize() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // Helper function: check if file is image
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    // Avatar uploads: users can only upload to their own folder
    match /avatars/{userId} {
      // Anyone authenticated can read avatars
      allow read: if isAuthenticated();
      
      // Only the owner can write their avatar
      allow write: if isAuthenticated() 
        && request.auth.uid == userId
        && isImage()
        && isAvatarSize();
    }
    
    // Chat images: users can upload to chats they participate in
    match /chat_images/{chatId}/{allPaths=**} {
      // Anyone authenticated can read chat images
      allow read: if isAuthenticated();
      
      // Users can upload images to chats they're in
      // Note: You may need to verify chat participation via Firestore
      allow write: if isAuthenticated()
        && isImage()
        && isChatImageSize();
    }
  }
}
```

## Cách áp dụng Rules

1. **Copy rules** ở trên (chọn development hoặc production)
2. **Paste vào Firebase Console** → Storage → Rules
3. **Click "Publish"** để lưu
4. **Đợi vài giây** để rules được áp dụng

## Kiểm tra Rules có hoạt động

1. **Đăng nhập vào app**
2. **Vào Settings** → Click avatar để upload
3. **Chọn image file**
4. **Kiểm tra Browser Console** - không còn lỗi permission
5. **Kiểm tra Storage** - file được upload thành công

## Troubleshooting

### Lỗi vẫn còn sau khi cập nhật rules

1. **Đảm bảo đã click "Publish"**
2. **Đợi 1-2 phút** để rules propagate
3. **Refresh browser** và thử lại
4. **Kiểm tra Browser Console** để xem error message chi tiết
5. **Kiểm tra user đã đăng nhập chưa** - rules yêu cầu `request.auth != null`

### Rules không hợp lệ

- Kiểm tra syntax JavaScript
- Đảm bảo không có lỗi chính tả
- Sử dụng `rules_version = '2'` ở đầu file
- Đảm bảo có `service firebase.storage` và `match /b/{bucket}/o`

### File quá lớn

- Avatar: tối đa 5MB
- Chat images: tối đa 10MB
- Kiểm tra file size trước khi upload

### File không phải image

- Chỉ chấp nhận files có `contentType` bắt đầu bằng `image/`
- Ví dụ: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

## Test Mode Rules (Tạm thời cho Development)

Nếu bạn chỉ muốn test nhanh, dùng rules này:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Rules này cho phép bất kỳ user đã đăng nhập nào cũng có thể upload/đọc tất cả files.

⚠️ **KHÔNG dùng cho production!**

## Cấu trúc Storage

```
storage/
├── avatars/
│   └── {userId}          # Avatar của user
└── chat_images/
    └── {chatId}/
        └── {messageId}    # Image trong chat
```

## Checklist

- [ ] Đã vào Storage → Rules
- [ ] Đã copy/paste rules ở trên
- [ ] Đã click "Publish"
- [ ] Đã đợi vài giây
- [ ] Đã refresh browser
- [ ] Đã đăng nhập vào app
- [ ] Đã thử upload avatar lại


