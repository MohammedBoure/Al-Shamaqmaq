import React from 'react';
import { Clock } from 'lucide-react';

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
  const isCritical = timeRemaining <= 5;

  let colorClasses = 'bg-gradient-to-r from-arcade-cyan to-arcade-purple shadow-neon-cyan';
  let badgeColor = 'text-arcade-cyan border-arcade-cyan/30';

  if (isCritical) {
    colorClasses = 'bg-gradient-to-r from-arcade-red to-arcade-pink shadow-neon-pink animate-pulse-fast';
    badgeColor = 'text-arcade-red border-arcade-red/40 animate-pulse-fast';
  } else if (isUrgent) {
    colorClasses = 'bg-gradient-to-r from-arcade-yellow to-arcade-red shadow-neon-yellow';
    badgeColor = 'text-arcade-yellow border-arcade-yellow/40';
  }

  return (
    <div className="w-full bg-arcade-card/90 backdrop-blur-md p-3 rounded-2xl border border-arcade-border/60 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
          <Clock className={`w-4 h-4 ${isUrgent ? 'animate-spin' : ''}`} />
          <span>{label}</span>
        </div>
        <div
          className={`px-2.5 py-0.5 rounded-full text-sm font-black border tracking-wider ${badgeColor}`}
        >
          {timeRemaining} ث
        </div>
      </div>
      <div className="w-full h-3 bg-arcade-bg/80 rounded-full overflow-hidden p-0.5 border border-arcade-border/40">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${colorClasses}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
