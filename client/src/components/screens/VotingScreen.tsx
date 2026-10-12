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
    <div className="flex flex-col h-full max-h-full overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 max-w-3xl mx-auto w-full select-none justify-between relative">
      {/* القائمة السريعة */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-start justify-start p-4 pt-16 backdrop-blur-md"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-56 bg-surface-container-low border border-outline-variant/60 rounded-2xl p-3 shadow-2xl space-y-2 animate-fadeIn"
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
              className="w-full text-right p-2 rounded-xl hover:bg-surface-container text-xs font-semibold text-white flex items-center gap-2"
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
              className="w-full text-right p-2 rounded-xl hover:bg-red-950/40 text-xs font-semibold text-rose-400 flex items-center gap-2"
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
                className="w-full text-right p-2 rounded-xl hover:bg-amber-950/40 text-xs font-semibold text-amber-400 flex items-center gap-2 border-t border-outline-variant/30 pt-2"
              >
                <span className="material-symbols-outlined text-[18px]">stop_circle</span>
                <span>إنهاء المباراة للجميع (للمضيف)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* الشريط العلوي */}
      <GameTopHeader
        currentRound={currentRound}
        totalRounds={totalRounds}
        timeRemaining={timeRemaining}
        centerType="timer"
        onMenuClick={() => setIsMenuOpen(true)}
      />

      {/* بطاقة السؤال المركزية */}
      <div className="my-auto space-y-4 sm:space-y-6">
        <div className="dark-monochrome-card rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-white/10 text-center">
          <span className="text-[11px] sm:text-xs font-medium text-on-surface-variant mb-1.5 sm:mb-2 block">
            أي هذه الإجابات هي الحقيقة؟ 🕵️‍♂️
          </span>
          <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white tracking-tight">
            {votingPrompt || 'اختر الإجابة الصحيحة وتجنب الوقوع في فخ الخداع!'}
          </h2>
        </div>

        {/* إخفاء الإجابات بالكامل عند التصويت لحماية الخصوصية ومنع اختلاس النظر */}
        {hasVoted ? (
          <div className="dark-monochrome-card rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-white/10 text-center animate-fadeIn space-y-4 sm:space-y-5 shadow-xl">
            {/* Lock / Privacy Icon Well */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-surface-container-high border border-outline-variant/60 flex items-center justify-center overflow-hidden shadow-inner">
                <ConsolePet avatar={player?.avatar} size={60} />
              </div>
              <span className="absolute -bottom-1 -left-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">lock</span>
              </span>
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base sm:text-xl font-bold text-white flex items-center justify-center gap-2">
                <span>تم قفل إجابتك بنجاح! 🔒</span>
              </h3>
              <p className="text-xs sm:text-sm text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>تم إخفاء الخيارات حتى لا يختلس أصدقاؤك النظر إلى شاشتك 👀</span>
              </p>
            </div>

            {/* في انتظار بقية اللاعبين لاختيار إجاباتهم */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold text-white max-w-sm mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[18px] text-amber-400 animate-spin">
                sync
              </span>
              <span>في انتظار بقية اللاعبين لاختيار إجاباتهم...</span>
            </div>
          </div>
        ) : (
          /* شبكة خيارات التصويت (تظهر فقط قبل التصويت) */
          <div className="grid grid-cols-2 gap-2 sm:gap-3.5">
            {votingOptions.map((opt, idx) => {
              const isSelected = votedOptionId === opt.id;
              const isSelf = opt.isSelfSubmission;
              const isLastOdd = idx === votingOptions.length - 1 && votingOptions.length % 2 !== 0;

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={hasVoted || isSelf}
                  onClick={() => handleVote(opt.id, isSelf)}
                  className={`w-full relative text-center px-6 py-3.5 sm:py-4.5 rounded-2xl sm:rounded-3xl border transition-all duration-150 flex flex-col items-center justify-center min-h-[58px] sm:min-h-[66px] ${
                    isLastOdd ? 'col-span-2' : 'col-span-1'
                  } ${
                    isSelected
                      ? 'bg-surface-container-high border-2 border-white ring-2 ring-white/10 shadow-lg scale-[1.01]'
                      : isSelf
                      ? 'bg-surface-container-low/50 border-outline-variant/30 opacity-40 cursor-not-allowed'
                      : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/50 text-white active:scale-98 cursor-pointer'
                  }`}
                >
                  <span className="text-xs sm:text-sm md:text-base font-bold text-white text-center leading-snug w-full block">
                    {opt.text}
                  </span>

                  {isSelf && (
                    <span className="text-[10px] sm:text-[11px] text-outline mt-1 text-center font-medium block">
                      (إجابتك أنت — لا يمكنك التصويت عليها)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* تذييل */}
      <footer className="text-center text-xs text-outline pt-4 font-mono">
        ESC — مرحلة التصويت وكشف الخداع
      </footer>
    </div>
  );
};
