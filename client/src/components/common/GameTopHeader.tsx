import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { GameScaleControl } from './GameScaleControl';

interface GameTopHeaderProps {
  currentRound: number;
  totalRounds: number;
  timeRemaining?: number;
  centerType?: 'timer' | 'correct' | 'crown';
  onMenuClick?: () => void;
  onShareClick?: () => void;
}

export const GameTopHeader: React.FC<GameTopHeaderProps> = ({
  currentRound,
  totalRounds,
  timeRemaining = 60,
  centerType = 'timer',
  onMenuClick,
  onShareClick,
}) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes}:${String(seconds).padStart(2, '0')}`;

  const isUrgent = centerType === 'timer' && timeRemaining <= 10 && timeRemaining > 0;

  return (
    <header className="flex items-center justify-between mb-4 sm:mb-6 w-full select-none">
      {/* زر القائمة أو الخروج */}
      <button
        type="button"
        onClick={onMenuClick}
        className="w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-white border border-outline-variant/40 flex items-center justify-center transition-all active:scale-95 shadow-sm"
        title="القائمة"
      >
        <span className="material-symbols-outlined text-[20px]">menu</span>
      </button>

      {/* شارة الجولة والمؤقت في المنتصف */}
      <div
        className={`flex items-center rounded-full px-3.5 sm:px-5 py-1.5 sm:py-2 gap-2.5 sm:gap-3.5 shadow-md border transition-all ${
          isUrgent
            ? 'bg-rose-500/20 border-rose-500/80 ring-2 ring-rose-500/40 animate-pulse text-rose-300'
            : 'bg-surface-container-low border-outline-variant/60 text-white'
        }`}
      >
        {/* رقم الجولة */}
        <span className="text-xs sm:text-sm font-bold tracking-wide">
          الجولة {currentRound}/{totalRounds}
        </span>

        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-outline-variant" />

        {/* المؤقت / الحالة */}
        <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-extrabold">
          {centerType === 'timer' && (
            <>
              <span className={`material-symbols-outlined text-[18px] sm:text-[20px] ${isUrgent ? 'text-rose-400' : 'text-white'}`}>
                timer
              </span>
              <span className={isUrgent ? 'text-rose-400 font-black' : 'text-white'}>
                {formattedTime}
              </span>
            </>
          )}
          {centerType === 'correct' && (
            <>
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-emerald-400">check_circle</span>
              <span className="text-xs sm:text-sm text-emerald-300">إجابة صحيحة</span>
            </>
          )}
          {centerType === 'crown' && (
            <>
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-amber-400">trophy</span>
              <span className="text-xs sm:text-sm text-amber-300">المتصدر</span>
            </>
          )}
        </div>
      </div>

      {/* أدوات الرأس: زر تبديل النمط ومقاس العرض والمشاركة */}
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <GameScaleControl />
        {onShareClick && (
          <button
            type="button"
            onClick={onShareClick}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-white border border-outline-variant/40 flex items-center justify-center transition-all active:scale-95 shadow-sm"
            title="مشاركة"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">share</span>
          </button>
        )}
      </div>
    </header>
  );
};
