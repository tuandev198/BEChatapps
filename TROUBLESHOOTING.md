# Troubleshooting - Lỗi Đăng Ký Firebase

## Lỗi 400 khi đăng ký (identitytoolkit.googleapis.com)

Lỗi 400 từ Firebase Authentication có thể do các nguyên nhân sau:

### 1. **Email/Password Authentication chưa được bật**

**Kiểm tra:**
1. Vào Firebase Console → Authentication → Sign-in method
2. Tìm "Email/Password" provider
3. Đảm bảo nó đã được **Enable**

**Cách sửa:**
- Click vào "Email/Password"
- Bật toggle "Enable"
- Click "Save"

### 2. **Email đã tồn tại**

Nếu email đã được đăng ký trước đó, bạn sẽ nhận lỗi `auth/email-already-in-use`.

**Giải pháp:**
- Sử dụng email khác
- Hoặc đăng nhập với email đó thay vì đăng ký mới

### 3. **Password quá yếu**

Firebase yêu cầu password tối thiểu 6 ký tự.

**Giải pháp:**
- Sử dụng password có ít nhất 6 ký tự
- Nên kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt

### 4. **Email không hợp lệ**

Email phải có định dạng đúng: `user@example.com`

**Giải pháp:**
- Kiểm tra lại định dạng email
- Đảm bảo có ký tự `@` và domain hợp lệ

### 5. **Firebase Config không đúng**

Kiểm tra file `.env` có đầy đủ các biến:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Cách lấy config:**
1. Firebase Console → Project Settings (⚙️)
2. Scroll xuống "Your apps"
3. Click icon Web (`</>`)
4. Copy các giá trị vào `.env`

### 6. **API Key không có quyền**

**Kiểm tra:**
- Vào Firebase Console → Project Settings → General
- Kiểm tra API Key restrictions
- Đảm bảo không có restrictions hoặc đã thêm domain của bạn

### 7. **Firestore Rules chặn write**

Nếu Firestore rules quá strict, có thể chặn việc tạo user document.

**Kiểm tra Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 8. **Network/CORS Issues**

Nếu đang chạy localhost, đảm bảo:
- Không có firewall chặn
- Không có VPN/proxy gây conflict
- Browser không block requests

## Cách Debug

1. **Mở Browser Console (F12)**
   - Xem error message chi tiết
   - Check Network tab để xem request/response

2. **Kiểm tra Firebase Console**
   - Authentication → Users: xem user có được tạo không
   - Firestore Database: xem document có được tạo không

3. **Test với email/password đơn giản:**
   ```
   Email: test@example.com
   Password: 123456
   ```

4. **Kiểm tra code:**
   - Đảm bảo đã import đúng từ `firebase/auth`
   - Kiểm tra `auth` object đã được khởi tạo đúng

## Lỗi thường gặp và giải pháp

| Lỗi Code | Nguyên nhân | Giải pháp |
|----------|-------------|-----------|
| `auth/email-already-in-use` | Email đã tồn tại | Dùng email khác hoặc đăng nhập |
| `auth/invalid-email` | Email không hợp lệ | Kiểm tra định dạng email |
| `auth/weak-password` | Password < 6 ký tự | Dùng password dài hơn |
| `auth/operation-not-allowed` | Provider chưa enable | Bật Email/Password trong Console |
| `auth/network-request-failed` | Lỗi mạng | Kiểm tra internet connection |
| `auth/api-key-not-valid` | API key sai | Kiểm tra lại `.env` file |

## Kiểm tra nhanh

Chạy các bước sau để kiểm tra:

1. ✅ Firebase Console → Authentication → Sign-in method → Email/Password = **Enabled**
2. ✅ File `.env` có đầy đủ 6 biến VITE_FIREBASE_*
3. ✅ Password >= 6 ký tự
4. ✅ Email hợp lệ (có @ và domain)
5. ✅ Browser Console không có lỗi JavaScript
6. ✅ Network tab không có request bị block

Nếu vẫn lỗi, copy error message từ Browser Console và kiểm tra Firebase Console để xem chi tiết.

