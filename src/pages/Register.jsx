import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase.js';
import { LoadingSpinner } from '../components/Loading.jsx';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate inputs
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Email không hợp lệ');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      if (displayName.trim()) {
        await updateProfile(user, {
          displayName: displayName.trim()
        });
      }

      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName:
            displayName.trim() ||
            user.email?.split('@')[0] ||
            'Người dùng',
          photoURL: '',
          friends: [],
          createdAt: serverTimestamp()
        });
      } catch (firestoreError) {
        console.warn(
          'Không tạo được user Firestore, dùng fallback:',
          firestoreError
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      navigate('/');
    } catch (err) {
      let errorMessage = 'Tạo tài khoản thất bại';

      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email đã được đăng ký. Vui lòng đăng nhập.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email không hợp lệ';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Mật khẩu quá yếu (tối thiểu 6 ký tự)';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Lỗi mạng. Vui lòng kiểm tra kết nối.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#F6F5FB]">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-slate-800">
          Đăng ký
        </h1>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tên của bạn"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <LoadingSpinner size="sm" />}
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
