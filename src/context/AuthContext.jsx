import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo
} from 'react';
import {
  onAuthStateChanged,
  signOut,
  updateProfile as fbUpdateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase user
  const [profile, setProfile] = useState(null); // Firestore profile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lắng nghe trạng thái đăng nhập từ Firebase Auth
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);

      if (fbUser) {
        try {
          const ref = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            setProfile(snap.data());
          } else {
            // Nếu chưa có document user thì tạo mới
            const baseProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              photoURL: fbUser.photoURL || '',
              friends: [],
              createdAt: serverTimestamp()
            };
            
            try {
              await setDoc(ref, baseProfile, { merge: true });
              setProfile(baseProfile);
            } catch (writeError) {
              console.error('Failed to create user document:', writeError);
              // Fallback: use profile from Auth if Firestore write fails
              setProfile({
                uid: fbUser.uid,
                email: fbUser.email || '',
                displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                photoURL: fbUser.photoURL || '',
                friends: []
              });
            }
          }
        } catch (readError) {
          console.error('Failed to read user document:', readError);
          // Fallback: use profile from Auth if Firestore read fails
          setProfile({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            photoURL: fbUser.photoURL || '',
            friends: []
          });
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  // Cập nhật hồ sơ: đồng bộ Firebase Auth + Firestore
  const updateProfile = async (data) => {
    if (!user) return;

    const authUpdate = {};
    if (Object.prototype.hasOwnProperty.call(data, 'displayName')) {
      authUpdate.displayName = data.displayName || null;
    }
    if (Object.prototype.hasOwnProperty.call(data, 'photoURL')) {
      authUpdate.photoURL = data.photoURL || null;
    }

    if (Object.keys(authUpdate).length > 0) {
      await fbUpdateProfile(user, authUpdate);
    }

    const ref = doc(db, 'users', user.uid);
    await updateDoc(ref, data);
    setProfile((prev) => (prev ? { ...prev, ...data } : prev));
  };

  const value = useMemo(
    () => ({ user, profile, loading, logout, updateProfile }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}



