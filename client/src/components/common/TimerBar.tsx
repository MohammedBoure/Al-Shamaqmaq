import React from 'react';

interface TimerBarProps {
  timeRemaining: number;
  totalDuration?: number;
  label?: string;
}

export const TimerBar: React.FC<TimerBarProps> = ({
  timeRemaining,
  totalDuration = 60,
  label = 'الوقت المتبقي',
}) => {
  const percentage = Math.max(0, Math.min(100, (timeRemaining / totalDuration) * 100));
  const isUrgent = timeRemaining <= 10;

  return (
    <div className="w-full bg-surface-container-low/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-outline-variant/40 shadow-xs my-[5px]">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-on-surface-variant">
          <span className="material-symbols-outlined text-[15px]">timer</span>
          <span>{label}</span>
        </div>
        <div
          className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold border ${
            isUrgent
              ? 'bg-surface-container-high text-white border-white animate-pulse'
              : 'bg-surface-container text-on-surface border-outline-variant/50'
          }`}
        >
          {timeRemaining} ثانية
        </div>
      </div>
      <div className="w-full h-1.5 sm:h-2 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
