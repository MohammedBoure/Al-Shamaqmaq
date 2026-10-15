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
    <header className="flex items-center justify-between w-full select-none shrink-0 py-1 sm:py-1.5 max-w-lg mx-auto">
      {/* زر القائمة */}
      <button
        type="button"
        onClick={onMenuClick}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-white flex items-center justify-center transition-all active:scale-95"
        title="القائمة"
      >
        <span className="material-symbols-outlined text-[20px]">menu</span>
      </button>

      {/* شارة الجولة والمؤقت في المنتصف */}
      <div
        className={`flex items-center rounded-lg px-3 py-1 sm:px-3.5 sm:py-1 gap-2 shadow-xs transition-all ${
          isUrgent
            ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/50 animate-pulse'
            : 'bg-surface-container-low text-white border border-outline-variant/40'
        }`}
      >
        {/* رقم الجولة */}
        <span className="text-[11px] sm:text-xs font-bold tracking-tight">
          الجولة {currentRound}/{totalRounds}
        </span>

        <span className="w-1 h-1 rounded-full bg-outline-variant" />

        {/* المؤقت / الحالة */}
        <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-extrabold">
          {centerType === 'timer' && (
            <>
              <span className={`material-symbols-outlined text-[15px] sm:text-[16px] ${isUrgent ? 'text-rose-400' : 'text-on-surface-variant'}`}>
                timer
              </span>
              <span className={isUrgent ? 'text-rose-400 font-black' : 'text-white'}>
                {formattedTime}
              </span>
            </>
          )}
          {centerType === 'correct' && (
            <span className="text-[11px] sm:text-xs text-emerald-400 flex items-center gap-1 font-sans font-bold">
              <span className="material-symbols-outlined text-[15px]">check_circle</span>
              <span>النتائج</span>
            </span>
          )}
          {centerType === 'crown' && (
            <span className="text-[11px] sm:text-xs text-amber-400 flex items-center gap-1 font-sans font-bold">
              <span className="material-symbols-outlined text-[15px]">trophy</span>
              <span>الترتيب</span>
            </span>
          )}
        </div>
      </div>

      {/* أدوات الرأس: زر تبديل النمط ومقاس العرض والمشاركة */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <ThemeToggle />
        <GameScaleControl />
        {onShareClick && (
          <button
            type="button"
            onClick={onShareClick}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-white flex items-center justify-center transition-all active:scale-95"
            title="مشاركة"
          >
            <span className="material-symbols-outlined text-[17px] sm:text-[18px]">share</span>
          </button>
        )}
      </div>
    </header>
  );
};
