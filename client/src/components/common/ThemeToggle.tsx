import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../context/ThemeContext';
import { useGame } from '../../context/GameContext';
import { GAME_THEMES, GameThemeId } from '../../types/theme';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  const { audio, haptic } = useGame();
  const [isOpen, setIsOpen] = useState(false);

  const currentThemeObj = GAME_THEMES.find((t) => t.id === theme) || GAME_THEMES[0];

  const handleSelectTheme = (themeId: GameThemeId) => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          audio.playClick();
          haptic.triggerHaptic('light');
          setIsOpen((prev) => !prev);
        }}
        aria-label="تغيير مظهر اللعبة"
        title={`النمط الحالي: ${currentThemeObj.nameAr}`}
        className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-200 active:scale-95 border bg-surface-container-high border-outline-variant/40 text-on-surface-variant hover:text-white hover:border-white/40 shadow-sm ${className}`}
      >
        <span className="text-[16px] sm:text-[18px]" role="img" aria-label={currentThemeObj.name}>
          {currentThemeObj.icon}
        </span>
      </button>

      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="w-full max-w-sm max-h-[85dvh] flex flex-col dark-monochrome-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/20 text-right shadow-2xl space-y-3 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/30 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[20px]">palette</span>
                  <h3 className="text-sm sm:text-base font-bold text-white">اختر مظهر اللعبة (Themes)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              <p className="text-[11px] sm:text-xs text-on-surface-variant shrink-0">
                اختر السمة البصرية المفضلة لديك من ألوان Coolors المتناسقة:
              </p>

              <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[55dvh] pr-1">
                {GAME_THEMES.map((themeOption) => {
                  const isActive = theme === themeOption.id;
                  return (
                    <button
                      key={themeOption.id}
                      type="button"
                      onClick={() => handleSelectTheme(themeOption.id)}
                      className={`w-full p-2.5 sm:p-3 rounded-xl border flex items-center justify-between transition-all active:scale-98 ${
                        isActive
                          ? 'bg-surface-container-high border-white ring-1 ring-white/20 shadow-md'
                          : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/40 hover:border-white/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl shrink-0">{themeOption.icon}</span>
                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-bold text-white block">
                            {themeOption.nameAr}
                          </span>
                          <span className="text-[10px] text-on-surface-variant">
                            {themeOption.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* دوائر الألوان المعاينة */}
                        <div className="flex items-center -space-x-1 space-x-reverse">
                          {themeOption.previewColors.map((color, idx) => (
                            <span
                              key={idx}
                              className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-xs"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>

                        {isActive && (
                          <span className="w-5 h-5 rounded-full bg-white text-surface-container-lowest flex items-center justify-center text-[11px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
