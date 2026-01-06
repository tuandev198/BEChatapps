import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { markStoryAsViewed, deleteStory } from '../services/storyService.js';
import { getUserById } from '../services/friendService.js';
import { X, ChevronLeft, ChevronRight, Trash2, MoreVertical } from 'lucide-react';
import { formatTimestamp } from '../utils/helpers.js';

/**
 * Story viewer component để xem story full screen (giống Instagram)
 */
export default function StoryViewer({ 
  isOpen, 
  onClose, 
  userId, 
  stories,
  onNextUser,
  onPrevUser,
  onStoryDeleted
}) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [storyUser, setStoryUser] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const progressIntervalRef = useRef(null);
  const videoRef = useRef(null);

  const currentStory = stories[currentIndex];
  const isMyStory = userId === user?.uid;

  useEffect(() => {
    if (!isOpen || !userId) return;

    // Fetch user data
    getUserById(userId).then(setStoryUser);

    // Reset to first story
    setCurrentIndex(0);
    setProgress(0);
  }, [isOpen, userId]);

  useEffect(() => {
    if (!isOpen || !currentStory || isPaused) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    // Mark as viewed (only for other users' stories)
    if (currentStory && user && !isMyStory && !currentStory.views?.includes(user.uid)) {
      markStoryAsViewed(currentStory.id, user.uid);
    }

    // Auto progress
    const duration = 5000; // 5 seconds per story
    const interval = 100; // Update every 100ms
    const increment = (interval / duration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isOpen, currentIndex, currentStory, isPaused, isMyStory, user]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      // Move to next user or close
      if (onNextUser) {
        onNextUser();
      } else {
        onClose();
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    } else {
      // Move to prev user or close
      if (onPrevUser) {
        onPrevUser();
      } else {
        onClose();
      }
    }
  };

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPosition = x / rect.width;

    if (clickPosition < 0.33) {
      handlePrev();
    } else if (clickPosition > 0.66) {
      handleNext();
    } else {
      // Pause/resume
      setIsPaused(!isPaused);
      if (videoRef.current) {
        if (isPaused) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      }
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory || !user || deleting) return;

    if (!confirm('Bạn có chắc muốn xóa story này?')) {
      setShowDeleteMenu(false);
      return;
    }

    setDeleting(true);
    try {
      await deleteStory(currentStory.id, user.uid);
      
      // Remove deleted story from list
      const updatedStories = stories.filter(s => s.id !== currentStory.id);
      
      if (updatedStories.length === 0) {
        // No more stories, close viewer
        onStoryDeleted?.();
        onClose();
      } else {
        // Move to next story or previous
        if (currentIndex >= updatedStories.length) {
          setCurrentIndex(updatedStories.length - 1);
        }
        onStoryDeleted?.(updatedStories);
      }
      
      setShowDeleteMenu(false);
    } catch (err) {
      alert(err.message || 'Không thể xóa story');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {stories.map((story, index) => (
          <div
            key={story.id}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className={`h-full bg-white transition-all ${
                index < currentIndex ? 'w-full' : index === currentIndex ? 'w-full' : 'w-0'
              }`}
              style={{
                width: index === currentIndex ? `${progress}%` : index < currentIndex ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-12 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-3">
          {storyUser?.photoURL ? (
            <img
              src={storyUser.photoURL}
              alt={storyUser.displayName}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold border-2 border-white">
              {storyUser?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <div className="text-white font-semibold">
              {storyUser?.displayName || storyUser?.email || 'User'}
              {isMyStory && <span className="text-white/70 text-xs ml-2">(Của bạn)</span>}
            </div>
            {currentStory.createdAt && (
              <div className="text-white/70 text-xs">
                {formatTimestamp(currentStory.createdAt)}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Delete button - chỉ hiển thị khi xem story của chính mình */}
          {isMyStory && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteMenu(!showDeleteMenu);
                }}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                title="Xóa story"
              >
                <MoreVertical className="w-5 h-5 text-white" />
              </button>

              {showDeleteMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDeleteMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 min-w-[150px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStory();
                      }}
                      disabled={deleting}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">{deleting ? 'Đang xóa...' : 'Xóa story'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Story content */}
      <div
        className="w-full h-full flex items-center justify-center cursor-pointer"
        onClick={handleClick}
      >
        {currentStory.mediaType === 'image' ? (
          <img
            src={currentStory.mediaURL}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            src={currentStory.mediaURL}
            className="max-w-full max-h-full"
            autoPlay
            loop={false}
            onEnded={handleNext}
            onPlay={() => setIsPaused(false)}
            onPause={() => setIsPaused(true)}
          />
        )}

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-0 right-0 px-4">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
              {currentStory.caption}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}

