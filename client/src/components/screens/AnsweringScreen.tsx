import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { GameTopHeader } from '../common/GameTopHeader';
import { ConsolePet } from '../common/ConsolePet';
import { PlayerScoreBars } from '../common/PlayerScoreBars';

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

      {/* 1. الشريط العلوي المتزامن */}
      <GameTopHeader
        currentRound={currentRound}
        totalRounds={totalRounds}
        timeRemaining={timeRemaining}
        centerType="timer"
        onMenuClick={() => setIsMenuOpen(true)}
      />

      {/* شريط نقاط اللاعبين لمتابعة السباق أثناء الجولة */}
      {room?.players && room.players.length > 0 && (
        <PlayerScoreBars
          players={room.players}
          myPlayerId={player?.id}
          targetScore={totalRounds * 2}
          className="mb-2 sm:mb-3"
        />
      )}

      {/* 2. بطاقة السؤال المركزية */}
      <div className="my-auto space-y-3 sm:space-y-5">
        <div className="dark-monochrome-card rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-white/10 text-center relative overflow-hidden">
          {/* شارة الموضوع */}
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-surface-container-high border border-outline-variant/50 text-[11px] sm:text-xs font-medium text-on-surface-variant mb-2.5 sm:mb-4">
            <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-white">category</span>
            <span>{currentTopicTitle || 'سؤال الجولة'}</span>
          </div>

          {/* نص السؤال */}
          <h2 className="text-base sm:text-2xl md:text-3xl font-bold text-white leading-relaxed tracking-tight max-w-xl mx-auto">
            {currentPuzzle?.prompt || 'جارٍ تحميل لغز الجولة...'}
          </h2>
        </div>

        {/* 3. منطقة الإدخال وحالة الخداع */}
        {isEnteringBluff ? (
          <div className="dark-monochrome-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-emerald-500/60 shadow-xl bg-surface-container-low/95 animate-fadeIn space-y-3">
            {/* شارة التهنئة بالإجابة الصحيحة */}
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2.5">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="material-symbols-outlined text-[22px] sm:text-[24px]">verified</span>
                <span className="text-xs sm:text-sm md:text-base font-extrabold text-white">
                  إجابتك صحيحة 100%! 🎯
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                عبقري 🧠
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                <span>الآن غيّر إجابتك واكتب خدعة مضللة:</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed">
                لا تكشف السر لبقية اللاعبين! اكتب إجابة كاذبة ولكنها تبدو مقنعة وحقيقية ليصوتوا عليها وتكسب نقطة إضافية عن كل لاعب ينخدع بها 🎭
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="اكتب إجابتك المزيفة البديلة هنا..."
                maxLength={60}
                autoFocus
                className="flex-1 bg-surface-container border border-amber-400/50 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-white text-xs sm:text-sm focus:border-amber-300 focus:outline-none placeholder:text-outline"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all disabled:opacity-40 shadow-sm shrink-0 flex items-center justify-center gap-1.5"
              >
                <span>تأكيد الخدعة</span>
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </form>
          </div>
        ) : isWaitingForOthers ? (
          <div className="p-4 sm:p-6 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-center animate-fadeIn space-y-2 flex flex-col items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface-container-high border border-outline-variant/50 flex items-center justify-center overflow-hidden shadow-inner">
              <ConsolePet avatar={player?.avatar} size={50} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">تم استلام إجابتك يا {player?.nickname}! 🎭</h3>
            <p className="text-[11px] sm:text-xs text-on-surface-variant max-w-sm">
              في انتظار بقية اللاعبين لتقديم إجاباتهم قبل بدء مرحلة التصويت...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
            <div className="bg-surface-container-low border border-outline-variant/50 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl dark-pill-recessed flex items-center gap-2 sm:gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="اكتب إجابتك أو تخمينك الذكي هنا..."
                maxLength={60}
                autoFocus
                className="flex-1 bg-transparent border-none text-white text-xs sm:text-sm md:text-base placeholder:text-outline focus:outline-none px-2.5 py-1.5 sm:px-3 sm:py-2 text-right placeholder:text-xs"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-white hover:bg-neutral-200 text-surface-container-lowest px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all shrink-0 disabled:opacity-40"
              >
                تأكيد الإجابة
              </button>
            </div>
            <p className="text-center text-[10px] sm:text-xs text-outline">
              إذا لم تكن متأكداً، اكتب إجابة تبدو مقنعة لخداع المنافسين!
            </p>
          </form>
        )}
      </div>

      {/* تذييل */}
      <footer className="text-center text-xs text-outline pt-4 font-mono">
        ESC — مرحلة تقديم الإجابة والخداع
      </footer>
    </div>
  );
};
