// File cấu hình Firebase
// Bạn chỉ cần điền các biến môi trường VITE_FIREBASE_* theo hướng dẫn ở cuối.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Kiểm tra Firebase config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase config missing! Please check your .env file.');
  console.error('Required variables:', {
    VITE_FIREBASE_API_KEY: !!firebaseConfig.apiKey,
    VITE_FIREBASE_AUTH_DOMAIN: !!firebaseConfig.authDomain,
    VITE_FIREBASE_PROJECT_ID: !!firebaseConfig.projectId,
    VITE_FIREBASE_STORAGE_BUCKET: !!firebaseConfig.storageBucket,
    VITE_FIREBASE_MESSAGING_SENDER_ID: !!firebaseConfig.messagingSenderId,
    VITE_FIREBASE_APP_ID: !!firebaseConfig.appId
  });
}

let app;
let auth;
let db;
let storage;

try {
  // Khởi tạo app Firebase duy nhất cho toàn bộ frontend
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Tạo fallback để app không crash hoàn toàn
  app = null;
  auth = null;
  db = null;
  storage = null;
}

export { auth, db, storage };
