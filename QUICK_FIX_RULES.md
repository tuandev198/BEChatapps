# 🔧 QUICK FIX - Firestore Rules cho Tìm Kiếm Bạn Bè

## ⚡ Cách sửa nhanh lỗi "Missing or insufficient permissions" khi tìm bạn

### Bước 1: Vào Firebase Console
1. Mở [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Firestore Database** → **Rules** tab

### Bước 2: Copy và paste rules này

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

### Bước 3: Click "Publish"

### Bước 4: Đợi vài giây, refresh browser và thử lại

---

## ✅ Rules này cho phép:

- ✅ User đã đăng nhập có thể **đọc** tất cả documents
- ✅ User đã đăng nhập có thể **query/search** users collection
- ✅ User đã đăng nhập có thể **tạo** friend requests
- ✅ User đã đăng nhập có thể **gửi** messages

## ⚠️ Lưu ý:

- Rules này chỉ dùng cho **development/testing**
- Cho production, dùng rules chi tiết trong `FIRESTORE_RULES.md`

## 🐛 Nếu vẫn lỗi:

1. **Kiểm tra đã click "Publish" chưa**
2. **Đợi 1-2 phút** để rules propagate
3. **Refresh browser** (Ctrl+F5 hoặc Cmd+Shift+R)
4. **Kiểm tra Browser Console** (F12) để xem error chi tiết
5. **Kiểm tra user đã đăng nhập chưa** - rules yêu cầu `request.auth != null`

## 📋 Checklist:

- [ ] Đã vào Firestore Database → Rules
- [ ] Đã copy/paste rules ở trên
- [ ] Đã click "Publish"
- [ ] Đã đợi vài giây
- [ ] Đã refresh browser
- [ ] Đã đăng nhập vào app
- [ ] Đã thử tìm kiếm lại

---

## 🔍 Giải thích:

Lỗi xảy ra vì:
- Firestore rules mặc định không cho phép query/search
- Query `where('email', '>=', ...)` cần permission để đọc nhiều documents
- Rules cũ có thể chỉ cho phép đọc document cụ thể, không cho phép list/query

Rules mới cho phép:
- `read`: Đọc bất kỳ document nào (bao gồm query)
- `write`: Ghi bất kỳ document nào
- Điều kiện: User phải đã đăng nhập (`request.auth != null`)

