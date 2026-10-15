import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { GameTopHeader } from '../common/GameTopHeader';
import { ConsolePet } from '../common/ConsolePet';

export const AnsweringScreen: React.FC = () => {
  const {
    currentPuzzle,
    currentTopicTitle,
    currentRound,
    totalRounds,
    timeRemaining,
    requiresBluff,
    hasSubmittedInitial,
    hasSubmittedBluff,
    submitAnswer,
    submitBluff,
    player,
    audio,
    haptic,
    leaveRoom,
    abortGame,
    room,
  } = useGame();

  const isHost = player?.id === room?.hostId;

  const [inputText, setInputText] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    audio.playClick();
    haptic.triggerHaptic('medium');

    if (requiresBluff && hasSubmittedInitial) {
      submitBluff(inputText.trim());
    } else {
      submitAnswer(inputText.trim());
    }
    setInputText('');
  };

  const isWaitingForOthers = hasSubmittedInitial && (!requiresBluff || hasSubmittedBluff);
  const isEnteringBluff = hasSubmittedInitial && requiresBluff && !hasSubmittedBluff;

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
          {/* Category Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-high border border-outline-variant/40 text-xs font-semibold text-on-surface-variant mb-3">
            <span className="material-symbols-outlined text-[14px] text-white">category</span>
            <span>{currentTopicTitle || 'سؤال الجولة'}</span>
          </div>

          {/* Question Prompt */}
          <h1 className="text-xl sm:text-2xl font-black text-white leading-relaxed tracking-tight">
            {currentPuzzle?.prompt || 'جارٍ تحميل لغز الجولة...'}
          </h1>
        </div>

        {/* Action Phase */}
        {isEnteringBluff ? (
          /* Bluff Input Phase (Correct answer found, now write a lie) */
          <div className="bg-surface-container-low border border-amber-400/50 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                عرفت الحقيقة! الآن اكتب خدعة بديلة:
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                +2 نقطة
              </span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 w-full">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="اكتب خدعة مضللة ليصوت عليها المنافسون..."
                maxLength={60}
                autoFocus
                className="w-full bg-surface-container border border-outline-variant/60 rounded-lg px-3.5 py-2.5 text-white text-sm focus:border-white focus:outline-none placeholder:text-outline text-right"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold py-2.5 px-4 rounded-lg text-xs sm:text-sm transition-all disabled:opacity-40 shadow-xs active:scale-[0.99] flex items-center justify-center gap-1.5"
              >
                <span>تأكيد الخدعة</span>
                <span className="material-symbols-outlined text-[16px] rotate-180">arrow_back</span>
              </button>
            </form>
          </div>
        ) : isWaitingForOthers ? (
          /* Waiting for Others Phase */
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-inner">
              <ConsolePet avatar={player?.avatar} size={44} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">تم استلام إجابتك!</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                في انتظار بقية اللاعبين لتقديم إجاباتهم...
              </p>
            </div>
          </div>
        ) : (
          /* Standard Answer Input Phase */
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 w-full">
            <div className="bg-surface-container-low border border-outline-variant/60 rounded-lg p-2.5 shadow-xs focus-within:border-white transition-colors">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="اكتب إجابتك أو تخمينك الذكي..."
                maxLength={60}
                autoFocus
                className="w-full bg-transparent border-none text-white text-sm sm:text-base placeholder:text-outline focus:outline-none px-1 text-right"
              />
            </div>
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-full bg-white hover:bg-neutral-200 text-surface-container-lowest py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold shadow-xs active:scale-[0.99] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <span>إرسال الإجابة</span>
              <span className="material-symbols-outlined text-[16px] rotate-180">arrow_back</span>
            </button>
          </form>
        )}
      </main>
    </div>
  );
};
