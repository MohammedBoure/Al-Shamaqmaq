import React from 'react';
import { PlayerProfile } from '../../types';
import { ConsolePet } from './ConsolePet';

interface PlayerScoreBarsProps {
  players: PlayerProfile[];
  myPlayerId?: string;
  currentPickerId?: string | null;
  targetScore?: number;
  className?: string;
}


export const PlayerScoreBars: React.FC<PlayerScoreBarsProps> = ({
  players,
  myPlayerId,
  currentPickerId,
  targetScore = 12,
  className = '',
}) => {
  if (!players || players.length === 0) return null;

  // أعلى درجة بين اللاعبين لتحديد المقياس، بحد أدنى targetScore أو 6 نقاط
  const highestCurrentScore = Math.max(...players.map((p) => p.score || 0));
  const scaleMax = Math.max(highestCurrentScore, targetScore, 6);

  return (
    <div
      className={`p-1.5 sm:p-2 rounded-xl bg-surface-container-low border border-outline-variant/40 shadow-xs shrink-0 space-y-1 my-[5px] ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-[11px] font-bold text-white flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-amber-400">
            equalizer
          </span>
          <span>سباق النقاط في الجلسة</span>
        </span>
        <span className="text-[9px] sm:text-[10px] text-on-surface-variant font-mono">
          أعلى نتيجة: {highestCurrentScore} ن
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {players.map((p) => {
          const score = p.score || 0;
          // نسبة امتلاء شريط النقاط من 0 إلى 100%
          const fillPercent = scaleMax > 0 ? Math.min(100, Math.max(score > 0 ? 12 : 4, (score / scaleMax) * 100)) : 4;
          const isMe = p.id === myPlayerId;
          const isPicker = currentPickerId && p.id === currentPickerId;

          return (
            <div
              key={p.id}
              className={`p-1.5 rounded-lg border flex flex-col justify-between transition-all duration-300 ${
                isPicker
                  ? 'bg-surface-container-high border-amber-400/50 ring-1 ring-amber-400/20 shadow-xs'
                  : 'bg-surface-container border-outline-variant/30'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0 border border-outline-variant/30">
                    <ConsolePet avatar={p.avatar} size={20} />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-white truncate">
                    {p.nickname} {isMe && '(أنت)'}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-400 shrink-0 font-mono">
                  {score}{' '}
                  <span className="text-[8px] font-normal text-on-surface-variant">ن</span>
                </span>
              </div>

              {/* شريط تعبئة النقاط التفاعلي */}
              <div className="w-full bg-surface-container-highest rounded-full h-1 sm:h-1.5 overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 transition-all duration-700 ease-out shadow-xs"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
