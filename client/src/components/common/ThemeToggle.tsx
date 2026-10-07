import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useGame } from '../../context/GameContext';

export const ThemeToggle: React.FC = () => {
  const { audio, haptic } = useGame();
  const [isLight, setIsLight] = useState<boolean>(() => {
    return localStorage.getItem('deception_theme') === 'light';
  });

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('deception_theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('deception_theme', 'dark');
    }
  }, [isLight]);

  const toggleTheme = () => {
    audio.playClick();
    haptic.triggerHaptic('light');
    setIsLight((prev) => !prev);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? 'تفعيل الوضع الداكن' : 'تفعيل الوضع الفاتح'}
      title={isLight ? 'الوضع الداكن' : 'الوضع الفاتح'}
      className="p-2.5 rounded-2xl bg-arcade-card/80 hover:bg-arcade-cardHover border-2 border-black shadow-[0_3px_0_#000] text-gray-200 hover:text-white transition-all transform active:translate-y-0.5 flex items-center justify-center"
    >
      {isLight ? (
        <Moon className="w-5 h-5 text-arcade-purple" />
      ) : (
        <Sun className="w-5 h-5 text-arcade-yellow animate-spin-slow" />
      )}
    </button>
  );
};
