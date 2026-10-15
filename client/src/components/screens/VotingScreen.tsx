import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { GameTopHeader } from '../common/GameTopHeader';
import { ConsolePet } from '../common/ConsolePet';

export const VotingScreen: React.FC = () => {
  const {
    votingPrompt,
    votingOptions,
    timeRemaining,
    hasVoted,
    votedOptionId,
    submitVote,
    currentRound,
    totalRounds,
    player,
    audio,
    haptic,
    leaveRoom,
    abortGame,
    room,
  } = useGame();

  const isHost = player?.id === room?.hostId;

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const handleVote = (optionId: string, isSelf: boolean) => {
    if (hasVoted || isSelf) return;
    audio.playClick();
    haptic.triggerHaptic('medium');
    submitVote(optionId);
  };

  return (
    <div className="flex flex-col min-h-full w-full max-w-md mx-auto px-4 select-none relative">
      {/* Quick Session Menu */}
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

      {/* Floating Top Header */}
      <GameTopHeader
        currentRound={currentRound}
        totalRounds={totalRounds}
        timeRemaining={timeRemaining}
        centerType="timer"
        onMenuClick={() => setIsMenuOpen(true)}
      />

      {/* Main Single-Column Game Area */}
      <main className="flex-1 flex flex-col justify-center py-6 gap-6">
        {/* Question Hero Area */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-high border border-outline-variant/40 text-xs font-semibold text-on-surface-variant mb-3">
            <span>أي هذه الإجابات هي الحقيقة؟ 🕵️‍♂️</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white leading-relaxed tracking-tight">
            {votingPrompt || 'اختر الإجابة الصحيحة وتجنب الوقوع في فخ الخداع!'}
          </h1>
        </div>

        {/* Voting Options or Locked State */}
        {hasVoted ? (
          /* Privacy Locked Screen */
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 text-center flex flex-col items-center gap-3 animate-fadeIn">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-14 h-14 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden shadow-inner">
                <ConsolePet avatar={player?.avatar} size={44} />
              </div>
              <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[12px]">
                <span className="material-symbols-outlined text-[13px]">lock</span>
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">تم قفل تصويتك بنجاح 🔒</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                في انتظار بقية اللاعبين لاختيار إجاباتهم...
              </p>
            </div>
          </div>
        ) : (
          /* Single Column Vertical Stack of Answers (Kalak style) */
          <div className="flex flex-col gap-2.5">
            {votingOptions.map((opt) => {
              const isSelected = votedOptionId === opt.id;
              const isSelf = opt.isSelfSubmission;

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={hasVoted || isSelf}
                  onClick={() => handleVote(opt.id, isSelf)}
                  className={`w-full py-3 px-4 rounded-lg border text-center transition-all duration-150 flex items-center justify-between ${
                    isSelected
                      ? 'bg-surface-container-high border-2 border-white ring-2 ring-white/10 shadow-md scale-[1.01]'
                      : isSelf
                      ? 'bg-surface-container-low/40 border-outline-variant/30 opacity-40 cursor-not-allowed'
                      : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/50 text-white hover:border-white/60 active:scale-[0.99] cursor-pointer'
                  }`}
                >
                  <span className="text-sm sm:text-base font-bold text-white text-center flex-1">
                    {opt.text}
                  </span>

                  {isSelf && (
                    <span className="text-[10px] text-on-surface-variant font-semibold px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant/40 shrink-0">
                      إجابتك
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
