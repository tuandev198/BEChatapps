import { useAuth } from '../context/AuthContext.jsx';
import ProfileSettings from '../components/ProfileSettings.jsx';
import Navigation from '../components/Navigation.jsx';

export default function Settings() {
  const { logout } = useAuth();

  return (
    <div className="h-screen flex bg-[#F6F5FB]">
      <Navigation />
      <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">Cài đặt</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-4">
            <ProfileSettings />
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <button
              onClick={logout}
              className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


