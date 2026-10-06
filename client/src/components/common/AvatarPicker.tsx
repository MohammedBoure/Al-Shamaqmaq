import React from 'react';

interface AvatarPickerProps {
  selectedAvatar: string;
  onSelectAvatar: (avatar: string) => void;
}

const AVATAR_LIST = [
  '🎭', '🦊', '🦁', '🤖',
  '👾', '🧙‍♂️', '🥷', '👑',
  '🦄', '🐼', '🐯', '👻',
  '🤠', '🐱', '🐸', '🐙'
];

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  selectedAvatar,
  onSelectAvatar,
}) => {
  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-gray-300 mb-2">
        اختر شخصيتك الرمزية (الأفاتار):
      </label>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-3 bg-arcade-bg/60 rounded-2xl border border-arcade-border/50 max-h-44 overflow-y-auto">
        {AVATAR_LIST.map((avatar) => {
          const isSelected = selectedAvatar === avatar;
          return (
            <button
              key={avatar}
              type="button"
              onClick={() => onSelectAvatar(avatar)}
              className={`text-2xl p-2 rounded-xl transition-all duration-200 flex items-center justify-center transform active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-tr from-arcade-purple to-arcade-pink shadow-neon-pink scale-110 border border-white/50'
                  : 'bg-arcade-card/80 hover:bg-arcade-cardHover hover:scale-105 border border-arcade-border/40'
              }`}
            >
              <span className={isSelected ? 'animate-bounce-subtle' : ''}>{avatar}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
