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
    <header className="flex items-center justify-between my-[5px] w-full select-none shrink-0">
      {/* زر القائمة أو الخروج */}
      <button
        type="button"
        onClick={onMenuClick}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-white border border-outline-variant/40 flex items-center justify-center transition-all active:scale-95 shadow-xs"
        title="القائمة"
      >
        <span className="material-symbols-outlined text-[18px]">menu</span>
      </button>

      {/* شارة الجولة والمؤقت في المنتصف */}
      <div
        className={`flex items-center rounded-full px-3 py-1 sm:px-4 sm:py-1.5 gap-2 sm:gap-2.5 shadow-xs border transition-all ${
          isUrgent
            ? 'bg-rose-500/20 border-rose-500/80 ring-2 ring-rose-500/40 animate-pulse text-rose-300'
            : 'bg-surface-container-low border-outline-variant/60 text-white'
        }`}
      >
        {/* رقم الجولة */}
        <span className="text-[11px] sm:text-xs font-bold tracking-wide">
          الجولة {currentRound}/{totalRounds}
        </span>

        <span className="w-1 h-1 rounded-full bg-outline-variant" />

        {/* المؤقت / الحالة */}
        <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-extrabold">
          {centerType === 'timer' && (
            <>
              <span className={`material-symbols-outlined text-[16px] sm:text-[18px] ${isUrgent ? 'text-rose-400' : 'text-white'}`}>
                timer
              </span>
              <span className={isUrgent ? 'text-rose-400 font-black' : 'text-white'}>
                {formattedTime}
              </span>
            </>
          )}
          {centerType === 'correct' && (
            <>
              <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-emerald-400">check_circle</span>
              <span className="text-[11px] sm:text-xs text-emerald-300">إجابة صحيحة</span>
            </>
          )}
          {centerType === 'crown' && (
            <>
              <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-amber-400">trophy</span>
              <span className="text-[11px] sm:text-xs text-amber-300">المتصدر</span>
            </>
          )}
        </div>
      </div>

      {/* أدوات الرأس: زر تبديل النمط ومقاس العرض والمشاركة */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <ThemeToggle />
        <GameScaleControl />
        {onShareClick && (
          <button
            type="button"
            onClick={onShareClick}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-white border border-outline-variant/40 flex items-center justify-center transition-all active:scale-95 shadow-xs"
            title="مشاركة"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">share</span>
          </button>
        )}
      </div>
    </header>
  );
};
