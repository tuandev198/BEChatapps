# Firebase Real-Time Chat Application

A production-ready real-time chat application built with React, Vite, and Firebase. Features include user authentication, friend system, real-time messaging, emoji support, and image sharing.

## 🚀 Features

- **Authentication**: Email/password sign up and sign in using Firebase Auth
- **User Profile**: Update display name and avatar image
- **Friend System**: Search users by email, send/accept/reject friend requests
- **Real-Time Chat**: 1-to-1 real-time messaging using Firestore listeners
- **Emoji Support**: Integrated emoji picker for expressive messaging
- **Image Messages**: Send images in chat conversations
- **Modern UI**: Clean, minimal interface with dark theme

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Firebase account (free Spark plan works)

## 🔧 Firebase Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard (disable Google Analytics if you want)
4. Click "Create project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password** provider
4. Click **Save**

### Step 3: Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Select **Start in test mode** (for development)
3. Choose a location (closest to your users)
4. Click **Enable**

**Important**: For production, you'll need to set up Firestore security rules. Here are the basic rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Friend requests
    match /friend_requests/{requestId} {
      allow read: if request.auth != null && 
        (resource.data.to == request.auth.uid || resource.data.from == request.auth.uid);
      allow create: if request.auth != null && request.auth.uid == request.resource.data.from;
      allow update: if request.auth != null && request.auth.uid == resource.data.to;
    }
    
    // Chats
    match /chats/{chatId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.participants;
      allow create: if request.auth != null && request.auth.uid in request.resource.data.participants;
      allow update: if request.auth != null && request.auth.uid in resource.data.participants;
    }
    
    // Messages subcollection
    match /messages/{chatId}/messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.senderId;
    }
  }
}
```

### Step 4: Enable Storage

1. Go to **Storage** → **Get started**
2. Click **Next** through the setup
3. Use default security rules (for development)
4. Click **Done**

**Storage Security Rules** (for production):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Avatar uploads
    match /avatars/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    
    // Chat images
    match /chat_images/{chatId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### Step 5: Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to **Your apps** section
4. Click the **Web** icon (`</>`) to add a web app
5. Register app (you can skip Firebase Hosting setup)
6. Copy the Firebase configuration object

### Step 6: Configure Environment Variables

1. In the project root, create a `.env` file:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

2. Replace the values with your Firebase configuration values

**Important**: Never commit `.env` file to version control. It's already in `.gitignore`.

### Step 7: Create Firestore Indexes (Optional but Recommended)

For better performance with chat queries, create a composite index:

1. Go to **Firestore Database** → **Indexes**
2. Click **Create Index**
3. Collection ID: `chats`
4. Fields:
   - `participants` (Array) - Ascending
   - `updatedAt` (Timestamp) - Descending
5. Click **Create**

## 📦 Installation

1. **Clone or navigate to the project directory**:
```bash
cd firebase-chat
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables** (see Step 6 above)

4. **Start development server**:
```bash
npm run dev
```

5. **Open your browser**:
Navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
firebase-chat/
├── src/
│   ├── components/          # React components
│   │   ├── ChatList.jsx     # List of all chats
│   │   ├── ChatRoom.jsx     # Chat window with messages
│   │   ├── MessageItem.jsx  # Individual message component
│   │   ├── EmojiPickerButton.jsx  # Emoji picker
│   │   ├── ChangeAvatar.jsx # Avatar upload component
│   │   ├── FriendList.jsx   # List of friends
│   │   ├── FriendRequests.jsx  # Friend request management
│   │   ├── UserSearch.jsx   # Search users by email
│   │   └── ProfileSettings.jsx  # Profile update form
│   ├── pages/               # Page components
│   │   ├── Login.jsx        # Login page
│   │   ├── Register.jsx     # Registration page
│   │   └── Chat.jsx         # Main chat page
│   ├── services/            # Firebase services
│   │   ├── firebase.js      # Firebase configuration
│   │   ├── friendService.js # Friend-related operations
│   │   ├── chatService.js   # Chat and message operations
│   │   └── storageService.js # File upload operations
│   ├── context/             # React context
│   │   └── AuthContext.jsx  # Authentication context
│   ├── utils/               # Utility functions
│   │   └── helpers.js       # Helper functions
│   ├── styles/              # CSS files
│   │   └── index.css        # Global styles
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── .env                     # Environment variables (create this)
├── package.json
├── vite.config.mts
├── tailwind.config.js
└── README.md
```

## 🔑 Firestore Collections Structure

### `users/{uid}`
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  friends: string[], // Array of friend UIDs
  createdAt: Timestamp
}
```

### `friend_requests/{requestId}`
```javascript
{
  from: string, // Sender UID
  to: string,   // Receiver UID
  status: 'pending' | 'accepted' | 'rejected',
  createdAt: Timestamp
}
```

### `chats/{chatId}`
```javascript
{
  participants: string[], // [uid1, uid2]
  lastMessage: string,
  updatedAt: Timestamp
}
```

### `messages/{chatId}/messages/{messageId}`
```javascript
{
  senderId: string,
  text: string,
  imageURL: string | null,
  createdAt: Timestamp
}
```

## 🎯 Usage

1. **Sign Up**: Create a new account with email and password
2. **Update Profile**: Go to Settings tab to update display name and avatar
3. **Add Friends**: 
   - Go to Search tab
   - Search users by email
   - Click "Add" to send friend request
4. **Accept Requests**: 
   - Go to Requests tab
   - Accept or reject pending friend requests
5. **Start Chatting**:
   - Go to Chats tab to see all conversations
   - Or go to Friends tab and click on a friend
   - Type messages, add emojis, or send images

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 📝 Notes

- This app works on Firebase **free Spark plan**
- All data is stored in Firestore (no custom backend needed)
- Real-time updates use Firestore `onSnapshot` listeners
- Images are stored in Firebase Storage
- Emojis are sent as Unicode text (no special handling needed)

## 🔒 Security Considerations

- Always set up proper Firestore security rules before deploying
- Set up Storage security rules to prevent unauthorized uploads
- Consider implementing rate limiting for production
- Validate file types and sizes on both client and server (via rules)

## 🐛 Troubleshooting

**Issue**: "Firebase: Error (auth/invalid-api-key)"
- **Solution**: Check your `.env` file and ensure all Firebase config values are correct

**Issue**: "Missing or insufficient permissions"
- **Solution**: Check Firestore security rules and ensure they allow the operation

**Issue**: Emoji picker not showing
- **Solution**: Run `npm install` to ensure `@emoji-mart/react` and `@emoji-mart/data` are installed

**Issue**: Images not uploading
- **Solution**: Check Storage security rules and ensure Storage is enabled in Firebase Console

## 📄 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!


