# 🔧 QUICK FIX - Storage Rules cho Upload Avatar

## ⚡ Cách sửa nhanh lỗi "storage/unauthorized" khi đổi avatar

### Bước 1: Vào Firebase Console
1. Mở [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Storage** → **Rules** tab

### Bước 2: Copy và paste rules này

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

### Bước 3: Click "Publish"

### Bước 4: Đợi vài giây, refresh browser và thử lại

---

## ✅ Rules này cho phép:

- ✅ User đã đăng nhập có thể **upload** avatar vào `avatars/{userId}`
- ✅ User đã đăng nhập có thể **upload** chat images vào `chat_images/{chatId}/...`
- ✅ User đã đăng nhập có thể **đọc** tất cả files

## ⚠️ Lưu ý:

- Rules này chỉ dùng cho **development/testing**
- Cho production, dùng rules chi tiết trong `STORAGE_RULES.md`

## 🐛 Nếu vẫn lỗi:

1. **Kiểm tra đã click "Publish" chưa**
2. **Đợi 1-2 phút** để rules propagate
3. **Refresh browser** (Ctrl+F5 hoặc Cmd+Shift+R)
4. **Kiểm tra Browser Console** (F12) để xem error chi tiết
5. **Kiểm tra user đã đăng nhập chưa** - rules yêu cầu `request.auth != null`
6. **Kiểm tra file size** - avatar tối đa 5MB
7. **Kiểm tra file type** - chỉ chấp nhận images

## 📋 Checklist:

- [ ] Đã vào Storage → Rules
- [ ] Đã copy/paste rules ở trên
- [ ] Đã click "Publish"
- [ ] Đã đợi vài giây
- [ ] Đã refresh browser
- [ ] Đã đăng nhập vào app
- [ ] File là image (< 5MB)
- [ ] Đã thử upload avatar lại

---

## 🔍 Giải thích:

Lỗi xảy ra vì:
- Firebase Storage rules mặc định không cho phép upload
- Rules cần cho phép `write` trên path `avatars/{userId}`
- User phải đã đăng nhập (`request.auth != null`)

Rules mới cho phép:
- `read`: Đọc bất kỳ file nào
- `write`: Upload bất kỳ file nào
- Điều kiện: User phải đã đăng nhập (`request.auth != null`)

## 📝 Lưu ý về File:

- **Avatar**: Tối đa 5MB
- **Chat images**: Tối đa 10MB
- **File types**: Chỉ chấp nhận images (`image/jpeg`, `image/png`, `image/gif`, `image/webp`)

Nếu file quá lớn hoặc không phải image, sẽ có lỗi validation từ code, không phải từ Storage rules.

