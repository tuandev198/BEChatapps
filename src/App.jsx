import { Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Chat from './pages/Chat.jsx';
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import Friends from './pages/Friends.jsx';
import FriendRequestsPage from './pages/FriendRequests.jsx';
import Search from './pages/Search.jsx';
import Settings from './pages/Settings.jsx';
import { PageLoading } from './components/Loading.jsx';

// Wrapper để bảo vệ route cần đăng nhập
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoading text="Đang tải..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <PrivateRoute>
              <Friends />
            </PrivateRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <PrivateRoute>
              <FriendRequestsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/search"
          element={
            <PrivateRoute>
              <Search />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
