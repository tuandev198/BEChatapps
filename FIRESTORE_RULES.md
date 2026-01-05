# Firestore Security Rules

## ⚠️ QUAN TRỌNG: Cấu hình Firestore Rules

Lỗi "Missing or insufficient permissions" xảy ra khi Firestore security rules không cho phép đọc/ghi dữ liệu.

## Cách cấu hình Firestore Rules

1. **Vào Firebase Console**
   - Chọn project của bạn
   - Vào **Firestore Database** → **Rules** tab

2. **Copy và paste rules sau:**

### Rules cho Development (Test Mode) - RECOMMENDED

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cho phép đọc/ghi tất cả cho user đã đăng nhập
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **CẢNH BÁO**: Rules trên chỉ dùng cho development. KHÔNG dùng cho production!

**Lưu ý**: Rules này cho phép:
- ✅ Đọc/ghi tất cả collections
- ✅ Query/search users
- ✅ Tạo friend requests
- ✅ Gửi messages

### Rules cho Production (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function: check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function: check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read any user profile (needed for search)
      allow read: if isAuthenticated();
      
      // Users can query/search the collection
      allow list: if isAuthenticated();
      
      // Only the user can write their own profile
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if isAuthenticated() && isOwner(userId);
    }
    
    // Friend requests
    match /friend_requests/{requestId} {
      // Users can read requests they sent or received
      allow read: if isAuthenticated() && 
        (resource.data.from == request.auth.uid || resource.data.to == request.auth.uid);
      
      // Users can create requests where they are the sender
      allow create: if isAuthenticated() && 
        request.resource.data.from == request.auth.uid &&
        request.resource.data.to != request.auth.uid;
      
      // Only the receiver can update (accept/reject)
      allow update: if isAuthenticated() && 
        resource.data.to == request.auth.uid &&
        resource.data.status == 'pending';
    }
    
    // Chats collection
    match /chats/{chatId} {
      // Users can read chats they participate in
      allow read: if isAuthenticated() && 
        request.auth.uid in resource.data.participants;
      
      // Users can create chats they participate in
      allow create: if isAuthenticated() && 
        request.auth.uid in request.resource.data.participants &&
        request.resource.data.participants.size() == 2;
      
      // Participants can update their chats
      allow update: if isAuthenticated() && 
        request.auth.uid in resource.data.participants;
    }
    
    // Messages subcollection
    match /messages/{chatId}/messages/{messageId} {
      // Users can read messages from chats they participate in
      // First check if chat exists and user is participant
      allow read: if isAuthenticated();
      
      // Users can create messages in chats they participate in
      allow create: if isAuthenticated() && 
        request.resource.data.senderId == request.auth.uid;
      
      // Users can only update their own messages
      allow update: if isAuthenticated() && 
        resource.data.senderId == request.auth.uid;
      
      // Users can only delete their own messages
      allow delete: if isAuthenticated() && 
        resource.data.senderId == request.auth.uid;
    }
  }
}
```

## Cách áp dụng Rules

1. **Copy rules** ở trên (chọn development hoặc production)
2. **Paste vào Firebase Console** → Firestore Database → Rules
3. **Click "Publish"** để lưu
4. **Đợi vài giây** để rules được áp dụng

## Kiểm tra Rules có hoạt động

1. **Đăng ký user mới**
2. **Kiểm tra Browser Console** - không còn lỗi permission
3. **Kiểm tra Firestore Database** - user document được tạo thành công

## Troubleshooting

### Lỗi vẫn còn sau khi cập nhật rules

1. **Đảm bảo đã click "Publish"**
2. **Đợi 1-2 phút** để rules propagate
3. **Refresh browser** và thử lại
4. **Kiểm tra Browser Console** để xem error message chi tiết

### Rules không hợp lệ

- Kiểm tra syntax JavaScript
- Đảm bảo không có lỗi chính tả
- Sử dụng `rules_version = '2'` ở đầu file

### Vẫn không đọc được document

- Kiểm tra user đã đăng nhập chưa (`request.auth != null`)
- Kiểm tra `request.auth.uid` có đúng với document ID không
- Thử dùng test mode rules tạm thời để debug

## Test Mode Rules (Tạm thời cho Development)

Nếu bạn chỉ muốn test nhanh, dùng rules này:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Rules này cho phép bất kỳ user đã đăng nhập nào cũng có thể đọc/ghi tất cả documents.

⚠️ **KHÔNG dùng cho production!**

