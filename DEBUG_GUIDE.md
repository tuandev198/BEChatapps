# 🐛 Debug Guide - Không hiển thị tin nhắn

## ✅ Đã sửa các vấn đề

1. **Bỏ orderBy khỏi query ban đầu** - Tránh cần Firestore index
2. **Sort manually** - Sort sau khi fetch data
3. **Đảm bảo callback luôn được gọi** - Ngay cả khi error
4. **Set initial state là []** - Không bị stuck ở "Đang tải..."

## 🔍 Cách kiểm tra

### 1. Mở Browser Console (F12)

Bạn sẽ thấy các log:
- `🔍 listenToChats: Starting listener for UID: ...`
- `📦 listenToChats: Snapshot received: ...`
- `✅ listenToChats: Calling callback with X chats`

### 2. Kiểm tra Firestore Database

1. Vào Firebase Console → Firestore Database
2. Kiểm tra collection `chats`:
   - Có documents không?
   - Documents có field `participants` chứa UID của bạn không?
   - Documents có field `updatedAt` không?

3. Kiểm tra collection `messages`:
   - Có subcollection `messages/{chatId}/messages` không?
   - Có messages trong đó không?

### 3. Kiểm tra Firestore Rules

Đảm bảo rules cho phép đọc:
```javascript
match /chats/{chatId} {
  allow read: if request.auth != null && 
    request.auth.uid in resource.data.participants;
}

match /messages/{chatId}/messages/{messageId} {
  allow read: if request.auth != null;
}
```

## 🐛 Các lỗi thường gặp

### Lỗi: "Đang tải cuộc trò chuyện..." mãi mãi

**Nguyên nhân**: 
- Firestore query bị block bởi rules
- Listener không được setup đúng
- Callback không được gọi

**Cách fix**:
1. Kiểm tra Browser Console xem có error không
2. Kiểm tra Firestore Rules
3. Refresh browser

### Lỗi: Không hiển thị tin nhắn

**Nguyên nhân**:
- Messages collection không tồn tại
- Firestore rules chặn đọc messages
- ChatId không đúng

**Cách fix**:
1. Kiểm tra Browser Console logs
2. Kiểm tra xem có messages trong Firestore không
3. Kiểm tra chatId có đúng format không (uid1_uid2)

### Lỗi: "Chưa có cuộc trò chuyện nào" nhưng có chat trong Firestore

**Nguyên nhân**:
- Query không match documents
- `participants` array không chứa UID của bạn
- Firestore rules chặn query

**Cách fix**:
1. Kiểm tra document trong Firestore:
   - `participants` phải là array: `["uid1", "uid2"]`
   - Phải chứa UID của bạn
2. Kiểm tra Firestore Rules cho phép query

## 📋 Checklist Debug

- [ ] Browser Console không có error màu đỏ
- [ ] Firestore Database có collection `chats`
- [ ] Chats có field `participants` chứa UID của bạn
- [ ] Firestore Rules cho phép đọc chats
- [ ] Firestore Rules cho phép đọc messages
- [ ] Console logs hiển thị "Snapshot received"
- [ ] Console logs hiển thị "Calling callback with X chats/messages"

## 🔧 Test nhanh

1. **Tạo chat thủ công trong Firestore**:
   ```javascript
   // Collection: chats
   // Document ID: test_chat_123
   {
     participants: ["your-uid", "other-uid"],
     lastMessage: "Test",
     updatedAt: Timestamp.now()
   }
   ```

2. **Tạo message thủ công**:
   ```javascript
   // Collection: messages/test_chat_123/messages
   // Document ID: msg_1
   {
     senderId: "your-uid",
     text: "Test message",
     createdAt: Timestamp.now()
   }
   ```

3. **Refresh browser** và kiểm tra xem có hiển thị không

## 💡 Tips

- Luôn kiểm tra Browser Console trước
- Firestore Rules là nguyên nhân phổ biến nhất
- Đảm bảo user đã đăng nhập (`request.auth != null`)
- Kiểm tra UID có đúng không

