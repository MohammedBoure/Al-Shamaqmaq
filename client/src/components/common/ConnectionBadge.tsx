import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useGame } from '../../context/GameContext';

export const ConnectionBadge: React.FC = () => {
  const { wsStatus } = useGame();

  if (wsStatus === 'connected') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
        <span>متصل</span>
      </div>
    );
  }

  if (wsStatus === 'connecting') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span>جارٍ الاتصال...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-400 text-xs font-semibold">
      <WifiOff className="w-3.5 h-3.5" />
      <span>منقطع</span>
    </div>
  );
};
