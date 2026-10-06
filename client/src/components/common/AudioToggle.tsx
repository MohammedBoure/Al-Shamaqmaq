import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useGame } from '../../context/GameContext';

export const AudioToggle: React.FC = () => {
  const { audio } = useGame();

  return (
    <button
      type="button"
      onClick={audio.toggleMute}
      aria-label={audio.isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
      className="p-2.5 rounded-xl bg-arcade-card/80 hover:bg-arcade-cardHover border border-arcade-border text-gray-300 hover:text-white transition-all transform active:scale-95 shadow-md flex items-center justify-center"
    >
      {audio.isMuted ? (
        <VolumeX className="w-5 h-5 text-gray-400" />
      ) : (
        <Volume2 className="w-5 h-5 text-arcade-cyan animate-pulse" />
      )}
    </button>
  );
};
