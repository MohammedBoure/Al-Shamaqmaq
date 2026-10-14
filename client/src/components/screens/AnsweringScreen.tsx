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
    <div className="flex flex-col min-h-full w-full max-w-3xl mx-auto px-2.5 sm:px-4 py-[5px] select-none gap-y-[5px] relative">
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
        />
      )}

      {/* 2. بطاقة السؤال المركزية */}
      <div className="dark-monochrome-card rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/10 text-center relative overflow-hidden my-[5px]">
        {/* شارة الموضوع */}
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/50 text-[10px] sm:text-xs font-medium text-on-surface-variant mb-1.5 sm:mb-2">
          <span className="material-symbols-outlined text-[13px] sm:text-[14px] text-white">category</span>
          <span>{currentTopicTitle || 'سؤال الجولة'}</span>
        </div>

        {/* نص السؤال */}
        <h2 className="text-sm sm:text-xl md:text-2xl font-bold text-white leading-relaxed tracking-tight max-w-xl mx-auto">
          {currentPuzzle?.prompt || 'جارٍ تحميل لغز الجولة...'}
        </h2>
      </div>

      {/* 3. منطقة الإدخال وحالة الخداع */}
      {isEnteringBluff ? (
        <div className="dark-monochrome-card rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-emerald-500/60 shadow-lg bg-surface-container-low/95 animate-fadeIn space-y-2 my-[5px]">
          {/* شارة التهنئة بالإجابة الصحيحة */}
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">verified</span>
              <span className="text-xs sm:text-sm font-extrabold text-white">
                إجابتك صحيحة 100%! 🎯
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              عبقري 🧠
            </span>
          </div>

          <div className="space-y-0.5">
            <h3 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              <span>الآن غيّر إجابتك واكتب خدعة مضللة:</span>
            </h3>
            <p className="text-[10px] sm:text-[11px] text-on-surface-variant leading-normal">
              اكتب إجابة كاذبة ولكنها تبدو مقنعة ليصوتوا عليها وتكسب نقطة إضافية عن كل لاعب ينخدع بها 🎭
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-1.5 pt-0.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب إجابتك المزيفة البديلة هنا..."
              maxLength={60}
              autoFocus
              className="flex-1 bg-surface-container border border-amber-400/50 rounded-xl px-3 py-1.5 sm:py-2 text-white text-xs sm:text-sm focus:border-amber-300 focus:outline-none placeholder:text-outline"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm transition-all disabled:opacity-40 shadow-xs shrink-0 flex items-center justify-center gap-1.5"
            >
              <span>تأكيد الخدعة</span>
              <span className="material-symbols-outlined text-[15px]">send</span>
            </button>
          </form>
        </div>
      ) : isWaitingForOthers ? (
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-surface-container-low border border-outline-variant/40 text-center animate-fadeIn space-y-1.5 flex flex-col items-center my-[5px]">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-surface-container-high border border-outline-variant/50 flex items-center justify-center overflow-hidden shadow-inner">
            <ConsolePet avatar={player?.avatar} size={42} />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-white">تم استلام إجابتك يا {player?.nickname}! 🎭</h3>
          <p className="text-[10px] sm:text-xs text-on-surface-variant max-w-sm">
            في انتظار بقية اللاعبين لتقديم إجاباتهم قبل بدء مرحلة التصويت...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-1.5 my-[5px]">
          <div className="bg-surface-container-low border border-outline-variant/50 p-1 sm:p-1.5 rounded-xl dark-pill-recessed flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب إجابتك أو تخمينك الذكي هنا..."
              maxLength={60}
              autoFocus
              className="flex-1 bg-transparent border-none text-white text-xs sm:text-sm md:text-base placeholder:text-outline focus:outline-none px-2.5 py-1.5 text-right placeholder:text-xs"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-white hover:bg-neutral-200 text-surface-container-lowest px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all shrink-0 disabled:opacity-40"
            >
              تأكيد الإجابة
            </button>
          </div>
          <p className="text-center text-[9px] sm:text-[10px] text-outline">
            إذا لم تكن متأكداً، اكتب إجابة تبدو مقنعة لخداع المنافسين!
          </p>
        </form>
      )}

      {/* تذييل */}
      <footer className="text-center text-[10px] text-outline py-[5px] font-mono shrink-0">
        ESC — مرحلة تقديم الإجابة والخداع
      </footer>
    </div>
  );
};
