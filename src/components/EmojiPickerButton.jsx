import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

export default function EmojiPickerButton({ onEmojiSelect }) {
  const [showPicker, setShowPicker] = useState(false);
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleEmojiSelect = (emoji) => {
    onEmojiSelect(emoji.native);
    setShowPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        !document.getElementById('emoji-portal')?.contains(e.target)
      ) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  // Tính toán vị trí picker
  useEffect(() => {
    if (showPicker && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 350, // hiển thị trên icon
        left: rect.left,
      });
    }
  }, [showPicker]);

  return (
    <>
      <div ref={buttonRef} className="flex-shrink-0 relative">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
        >
          😊
        </button>
      </div>

      {showPicker &&
        createPortal(
          <div
            id="emoji-portal"
            className="z-50 w-[350px] max-w-screen-sm rounded-lg overflow-hidden shadow-lg bg-slate-800"
            style={{
              position: 'fixed',
              top: Math.max(position.top, 10),
              left: Math.min(position.left, window.innerWidth - 360),
            }}
          >
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="dark"
              previewPosition="none"
            />
          </div>,
          document.body
        )}
    </>
  );
}

