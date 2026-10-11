import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext';
import { GameTopHeader } from '../common/GameTopHeader';
import { ConsolePet } from '../common/ConsolePet';

export const GameOverScreen: React.FC = () => {
  const { leaderboard, leaveRoom, rematch, totalRounds, player, room } = useGame();
  const isHost = player?.id === room?.hostId;

  useEffect(() => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ffffff', '#c7c6c6', '#8e9192'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ffffff', '#c7c6c6', '#8e9192'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const firstPlace = leaderboard[0];
  const secondPlace = leaderboard[1];
  const thirdPlace = leaderboard[2];

  return (
    <div className="flex flex-col h-full max-h-full overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 max-w-3xl mx-auto w-full select-none justify-between relative">
      <GameTopHeader
        currentRound={totalRounds}
        totalRounds={totalRounds}
        centerType="crown"
        onMenuClick={leaveRoom}
      />

      <div className="text-center my-3 sm:my-5">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-white mx-auto mb-2 shadow-lg">
          <span className="material-symbols-outlined text-[26px] sm:text-[32px]">emoji_events</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          تتويج بطل ESC!
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-xs sm:max-w-md mx-auto">
          تهانينا للأذكى والأكثر براعة في الخداع والتخمين 🎭
        </p>
      </div>

      {/* المنصة الثلاثية مع شخصيات كلك */}
      <div className="flex items-end justify-center gap-2 sm:gap-3 max-w-sm sm:max-w-md mx-auto w-full my-3 sm:my-5 px-2 sm:px-4">
        {/* المركز الثاني */}
        {secondPlace && (
          <div className="flex-1 flex flex-col items-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mb-1 flex items-center justify-center">
              <ConsolePet avatar={secondPlace.avatar} size={48} />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-white mb-1 truncate max-w-[70px] sm:max-w-[80px]">
              {secondPlace.nickname}
            </span>
            <div className="w-full bg-surface-container-low border border-outline-variant/60 rounded-t-xl sm:rounded-t-2xl h-20 sm:h-24 flex flex-col items-center justify-center p-1.5 sm:p-2">
              <span className="text-base sm:text-lg font-bold text-white">٢</span>
              <span className="text-[10px] sm:text-xs text-on-surface-variant">{secondPlace.score} نقطة</span>
            </div>
          </div>
        )}

        {/* المركز الأول */}
        {firstPlace && (
          <div className="flex-1 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-1 relative flex items-center justify-center">
              <span className="material-symbols-outlined text-yellow-400 text-lg sm:text-xl absolute -top-3 left-1/2 -translate-x-1/2 drop-shadow animate-bounce">
                crown
              </span>
              <ConsolePet avatar={firstPlace.avatar} size={64} />
            </div>
            <span className="text-xs sm:text-base font-extrabold text-white mb-1 truncate max-w-[85px] sm:max-w-[100px]">
              {firstPlace.nickname}
            </span>
            <div className="w-full bg-white text-surface-container-lowest rounded-t-xl sm:rounded-t-2xl h-28 sm:h-36 flex flex-col items-center justify-center p-1.5 sm:p-2 shadow-2xl">
              <span className="text-xl sm:text-2xl font-black">١</span>
              <span className="text-[10px] sm:text-xs font-bold">{firstPlace.score} نقطة</span>
            </div>
          </div>
        )}

        {/* المركز الثالث */}
        {thirdPlace && (
          <div className="flex-1 flex flex-col items-center">
            <div className="w-11 h-11 sm:w-12 sm:h-12 mb-1 flex items-center justify-center">
              <ConsolePet avatar={thirdPlace.avatar} size={42} />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-white mb-1 truncate max-w-[70px] sm:max-w-[80px]">
              {thirdPlace.nickname}
            </span>
            <div className="w-full bg-surface-container-low border border-outline-variant/60 rounded-t-xl sm:rounded-t-2xl h-14 sm:h-16 flex flex-col items-center justify-center p-1.5 sm:p-2">
              <span className="text-base sm:text-lg font-bold text-white">٣</span>
              <span className="text-[10px] sm:text-xs text-on-surface-variant">{thirdPlace.score} نقطة</span>
            </div>
          </div>
        )}
      </div>

      {/* لوحة الترتيب الكاملة */}
      <div className="dark-monochrome-card rounded-2xl p-4 sm:p-5 border border-white/10 my-3 sm:my-4 max-w-lg mx-auto w-full">
        <h3 className="text-xs sm:text-sm font-bold text-white mb-2.5 sm:mb-3">الترتيب النهائي لجميع اللاعبين:</h3>
        <div className="space-y-1.5 sm:space-y-2">
          {leaderboard.map((entry, idx) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-surface-container-low text-[11px] sm:text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-outline w-5 text-center">#{idx + 1}</span>
                <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden shrink-0 border border-outline-variant/40">
                  <ConsolePet avatar={entry.avatar} size={26} />
                </div>
                <span className="font-bold text-white">{entry.nickname}</span>
              </div>
              <span className="font-bold text-white">{entry.score} نقطة</span>
            </div>
          ))}
        </div>
      </div>

      {/* أزرار الإجراءات: إعادة التحدي أو مغادرة الجلسة */}
      <div className="pt-2 sm:pt-4 max-w-sm mx-auto w-full space-y-2.5">
        {isHost ? (
          <button
            type="button"
            onClick={rematch}
            className="w-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-extrabold py-3 sm:py-3.5 px-5 sm:px-6 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">replay</span>
            <span>إعادة التحدي (مباراة جديدة بنفس اللاعبين)</span>
          </button>
        ) : (
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-center text-[11px] sm:text-xs text-on-surface-variant flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-400 animate-spin">sync</span>
            <span>في انتظار المضيف لبدء إعادة التحدي أو العودة للردهة...</span>
          </div>
        )}

        <button
          type="button"
          onClick={leaveRoom}
          className="w-full bg-surface-container-low hover:bg-surface-container text-white border border-outline-variant/50 font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-xs sm:text-sm"
        >
          <span>مغادرة الجلسة والعودة للرئيسية</span>
          <span className="material-symbols-outlined text-[16px] sm:text-[18px]">logout</span>
        </button>
      </div>
    </div>
  );
};
