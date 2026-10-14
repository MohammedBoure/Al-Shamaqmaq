import React from 'react';
import { useGame } from '../../context/GameContext';
import { TimerBar } from '../common/TimerBar';
import { AudioToggle } from '../common/AudioToggle';
import { ThemeToggle } from '../common/ThemeToggle';
import { GameScaleControl } from '../common/GameScaleControl';
import { PlayerScoreBars } from '../common/PlayerScoreBars';

export const TopicSelectionScreen: React.FC = () => {
  const {
    allowedTopics,
    currentPickerId,
    pickerNickname,
    player,
    room,
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

  // قائمة اللاعبين لحساب شريط النقاط
  const playersList = room?.players || [];

  return (
    <div className="flex flex-col min-h-full w-full max-w-4xl mx-auto px-2.5 sm:px-4 py-[5px] select-none gap-y-[5px] relative">
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

      {/* 1. الشريط العلوي */}
      <header className="flex items-center justify-between bg-surface-container-low/90 backdrop-blur-md px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border border-outline-variant/40 shadow-xs shrink-0 my-[5px]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-white flex items-center justify-center transition-all active:scale-95 shadow-xs"
            title="القائمة"
          >
            <span className="material-symbols-outlined text-[18px]">menu</span>
          </button>
          <span className="px-2.5 sm:px-3 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/60 text-[10px] sm:text-xs font-bold text-white">
            الجولة {currentRound} من {totalRounds}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <AudioToggle />
          <ThemeToggle />
          <GameScaleControl />
        </div>
      </header>

      {/* 2. شريط المؤقت الزمني لاختيار الموضوع */}
      <div className="shrink-0 my-[5px]">
        <TimerBar timeRemaining={timeRemaining} totalDuration={30} label="مهلة اختيار الموضوع" />
      </div>

      {/* 3. شريط نقاط اللاعبين (Bar fills with points) */}
      <div className="shrink-0 my-[5px]">
        <PlayerScoreBars
          players={playersList}
          myPlayerId={player?.id}
          currentPickerId={currentPickerId}
          targetScore={totalRounds * 2}
        />
      </div>

      {/* 4. بطاقة تنبيه صاحب الدور */}
      <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 flex items-center justify-between gap-2.5 shrink-0 my-[5px]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
              {isMyTurn ? 'touch_app' : 'hourglass_top'}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate">
              {isMyTurn ? 'دورك الآن لاختيار موضوع الجولة!' : `ينتظر الجميع: ${pickerNickname || 'اللاعب'}`}
            </h2>
            <p className="text-[9px] sm:text-[11px] text-on-surface-variant truncate">
              {isMyTurn ? 'اختر أحد المواضيع الـ ٦ المتاحة للجولة' : 'استعد للتخمين والخداع فور اختيار الموضوع'}
            </p>
          </div>
        </div>

        {isMyTurn && (
          <span className="px-2 py-0.5 rounded-full bg-white text-surface-container-lowest text-[10px] sm:text-xs font-bold shrink-0 animate-pulse">
            أنت المختار 🎯
          </span>
        )}
      </div>

      {/* 5. شبكة المواضيع (تصميم متراص وخفيف لا يفيض عن الشاشة) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 my-[5px] w-full">
        {allowedTopics.map((topic) => {
          return (
            <button
              key={topic.id}
              type="button"
              disabled={!isMyTurn}
              onClick={() => {
                if (isMyTurn) selectTopic(topic.id);
              }}
              className={`px-2.5 py-2 sm:py-2.5 rounded-xl border transition-all flex items-center justify-between group min-h-[46px] sm:min-h-[50px] ${
                isMyTurn
                  ? 'bg-surface-container-low hover:bg-surface-container-high border-outline-variant/60 hover:border-white shadow-xs active:scale-95 cursor-pointer text-right'
                  : 'bg-surface-container-low/60 border-outline-variant/30 opacity-75 cursor-default text-right'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-surface-container flex items-center justify-center text-white border border-outline-variant/40 shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">menu_book</span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                  {topic.title}
                </h3>
              </div>

              {isMyTurn && (
                <span className="material-symbols-outlined text-white text-[15px] sm:text-[16px] transform rotate-180 group-hover:-translate-x-1 transition-transform shrink-0">
                  arrow_back
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* تذييل الشاشة */}
      <footer className="text-center text-[10px] text-outline py-[5px] shrink-0 font-mono">
        ESC — لعبة الخداع والبديهة
      </footer>
    </div>
  );
};
