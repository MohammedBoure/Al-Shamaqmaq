import React from 'react';
import { useGame } from '../../context/GameContext';

export const AudioToggle: React.FC = () => {
  const { audio } = useGame();

  return (
    <button
      type="button"
      onClick={audio.toggleMute}
      aria-label={audio.isMuted ? 'تشغيل المؤثرات الصوتية' : 'كتم المؤثرات الصوتية'}
      title={audio.isMuted ? 'تشغيل المؤثرات الصوتية' : 'كتم المؤثرات الصوتية'}
      className="relative flex items-center justify-center w-10 h-10 text-on-surface-variant hover:text-white hover:bg-surface-container transition-colors duration-150 rounded-full active:scale-95 border border-outline-variant/30"
    >
      <span className="material-symbols-outlined text-[20px]">
        {audio.isMuted ? 'volume_off' : 'volume_up'}
      </span>
      {!audio.isMuted && (
        <span className="absolute top-2 left-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
      )}
    </button>
  );
};
