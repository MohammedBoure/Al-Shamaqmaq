import React from 'react';
import { useGame } from '../../context/GameContext';
import { AudioToggle } from '../common/AudioToggle';
import { ThemeToggle } from '../common/ThemeToggle';
import { GameScaleControl } from '../common/GameScaleControl';

export const TopicSelectionScreen: React.FC = () => {
  const {
    allowedTopics,
    currentPickerId,
    pickerNickname,
    player,
    room,
    teamScores,
    timeRemaining,
    selectTopic,
    currentRound,
    totalRounds,
    leaveRoom,
    abortGame,
    audio,
  } = useGame();

  const [isMenuOpen, setIsMenuOpen] = React.useState<boolean>(false);
  const isHost = player?.id === room?.hostId;
  const isMyTurn = player?.id === currentPickerId;
  const isTeamsMode = room?.gameMode === 'teams';

  // 30-second default timer progress calculation
  const totalDuration = 30;
  const progressPercent = Math.max(0, Math.min(100, (timeRemaining / totalDuration) * 100));

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col min-h-full w-full select-none relative">
      {/* 2px–3px Smooth Progress Bar directly at top edge */}
      <div className="w-full h-1 bg-surface-container fixed top-0 inset-x-0 z-50 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            timeRemaining <= 5 ? 'bg-rose-400' : 'bg-white'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Quick Menu Modal */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-start justify-start p-4 pt-16 backdrop-blur-md"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-56 bg-surface-container-low border border-outline-variant/60 rounded-xl p-3 shadow-2xl space-y-2 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-bold text-on-surface-variant px-2 pb-1 border-b border-outline-variant/30">
              خيارات الجلسة
            </div>
            <button
              type="button"
              onClick={() => {
                audio.toggleMute();
                setIsMenuOpen(false);
              }}
              className="w-full text-right p-2 rounded-lg hover:bg-surface-container text-xs font-semibold text-white flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                {audio.isMuted ? 'volume_off' : 'volume_up'}
              </span>
              <span>{audio.isMuted ? 'تشغيل المؤثرات' : 'كتم المؤثرات'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                leaveRoom();
                setIsMenuOpen(false);
              }}
              className="w-full text-right p-2 rounded-lg hover:bg-red-950/40 text-xs font-semibold text-rose-400 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>مغادرة الجلسة</span>
            </button>
            {isHost && (
              <button
                type="button"
                onClick={() => {
                  abortGame();
                  setIsMenuOpen(false);
                }}
                className="w-full text-right p-2 rounded-lg hover:bg-amber-950/40 text-xs font-semibold text-amber-400 flex items-center gap-2 border-t border-outline-variant/30 pt-2"
              >
                <span className="material-symbols-outlined text-[18px]">stop_circle</span>
                <span>إنهاء المباراة للجميع</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Minimal Floating Header */}
      <header className="w-full max-w-md mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/50 text-white flex items-center justify-center transition-all active:scale-95"
          title="القائمة"
        >
          <span className="material-symbols-outlined text-[18px]">menu</span>
        </button>

        {/* Center Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-lg bg-surface-container-high border border-outline-variant/50 text-xs font-bold text-white shadow-xs">
          <span>الجولة {currentRound}/{totalRounds}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span className="font-mono text-on-surface-variant">{formatTimer(timeRemaining)}</span>
        </div>

        <div className="flex items-center gap-1">
          <AudioToggle />
          <ThemeToggle />
          <GameScaleControl />
        </div>
      </header>

      {/* Live Team Scores Strip */}
      {isTeamsMode && teamScores && teamScores.length > 0 && (
        <div className="w-full max-w-md mx-auto px-4 pt-1 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {teamScores.map((ts) => (
            <div
              key={ts.teamId}
              className="px-2.5 py-1 rounded-md bg-surface-container-low border border-outline-variant/30 flex items-center gap-1.5 shrink-0 text-[11px]"
              style={{
                borderColor: ts.teamId === player?.teamId ? ts.teamColor : undefined,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ts.teamColor || '#ffffff' }}
              />
              <span className="font-bold text-white">{ts.teamName}</span>
              <span className="font-black text-amber-400">{ts.score}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Topic Selection Stack */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 flex flex-col justify-center">
        {/* Turn Prompt (Clean, no sub-description bloat) */}
        <div className="text-center mb-5">
          <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center justify-center gap-2">
            {isMyTurn ? (
              <>
                <span>اختر موضوع الجولة</span>
                <span className="text-amber-400">🎯</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>دور {pickerNickname || 'المنافس'} لاختيار الموضوع</span>
              </>
            )}
          </h1>
        </div>

        {/* Vertical Card Stack */}
        <div className="flex flex-col gap-2.5">
          {allowedTopics.map((topic) => {
            return (
              <button
                key={topic.id}
                type="button"
                disabled={!isMyTurn}
                onClick={() => {
                  if (isMyTurn) {
                    audio.playClick();
                    selectTopic(topic.id);
                  }
                }}
                className={`w-full py-3 px-4 rounded-lg border text-right transition-all duration-150 flex items-center justify-between ${
                  isMyTurn
                    ? 'bg-surface-container-low hover:bg-surface-container-high border-outline-variant/60 hover:border-white shadow-xs hover:-translate-x-1 active:scale-[0.99] cursor-pointer'
                    : 'bg-surface-container-low/60 border-outline-variant/30 opacity-60 cursor-default'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-white border border-outline-variant/40 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                  </div>
                  <span className="text-sm font-bold text-white truncate">
                    {topic.title}
                  </span>
                </div>

                {isMyTurn && (
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px] rotate-180 shrink-0">
                    arrow_back
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};
