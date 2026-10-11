import React from 'react';
import { useGame } from '../../context/GameContext';

export const ConnectionBadge: React.FC = () => {
  const { wsStatus } = useGame();

  if (wsStatus === 'connected') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low border border-outline-variant/40 text-on-surface-variant text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-white" />
        <span>متصل</span>
      </div>
    );
  }

  if (wsStatus === 'connecting') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low border border-outline-variant/40 text-on-surface-variant text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span>الاتصال...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low border border-outline-variant/40 text-outline text-xs font-medium">
      <span className="w-2 h-2 rounded-full bg-outline" />
      <span>منقطع</span>
    </div>
  );
};
