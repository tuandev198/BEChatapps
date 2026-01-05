import { useAuth } from '../context/AuthContext.jsx';
import UserSearch from '../components/UserSearch.jsx';
import Navigation from '../components/Navigation.jsx';

export default function Search() {
  return (
    <div className="h-screen flex bg-[#F6F5FB]">
      <Navigation />
      <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">Tìm kiếm</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <UserSearch />
          </div>
        </div>
      </div>
    </div>
  );
}

