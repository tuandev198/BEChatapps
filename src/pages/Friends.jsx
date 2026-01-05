import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import FriendList from '../components/FriendList.jsx';
import Navigation from '../components/Navigation.jsx';

export default function Friends() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelectFriend = (chatId, friend) => {
    // Navigate to chat with this friend
    navigate('/chat', { state: { chatId, otherUser: friend } });
  };

  return (
    <div className="h-screen flex bg-[#F6F5FB]">
      <Navigation />
      <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">Bạn bè</h1>
          <FriendList onSelectFriend={handleSelectFriend} />
        </div>
      </div>
    </div>
  );
}
