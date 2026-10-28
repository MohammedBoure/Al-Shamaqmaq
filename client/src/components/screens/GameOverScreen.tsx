import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext';
import { GameTopHeader } from '../common/GameTopHeader';
import { ConsolePet } from '../common/ConsolePet';
import { DEFAULT_TEAMS } from '../../types';

export const GameOverScreen: React.FC = () => {
  const { leaderboard, teamScores, leaveRoom, rematch, totalRounds, player, room } = useGame();
  const isHost = player?.id === room?.hostId;
  const isTeamsMode = room?.gameMode === 'teams' && teamScores && teamScores.length > 0;
  const activeTeams = room?.teams && room.teams.length > 0 ? room.teams : DEFAULT_TEAMS.slice(0, room?.teamCount || 2);

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
  const winningTeam = isTeamsMode ? teamScores[0] : null;

  return (
    <div className="flex flex-col min-h-full w-full max-w-lg mx-auto px-2.5 sm:px-4 py-[5px] select-none gap-y-[5px] relative">
      <GameTopHeader
        currentRound={totalRounds}
        totalRounds={totalRounds}
        centerType="crown"
        onMenuClick={leaveRoom}
      />

      <div className="text-center my-[5px]">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-white mx-auto mb-1.5 shadow-md">
          <span className="material-symbols-outlined text-[22px] sm:text-[26px]">emoji_events</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          {isTeamsMode && winningTeam ? `تتويج ${winningTeam.teamName}!` : 'تتويج بطل ESC!'}
        </h1>
        <p className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 max-w-xs sm:max-w-md mx-auto">
          تهانينا للأذكى والأكثر براعة في الخداع والتخمين 🎭
        </p>
      </div>

      {/* لوحة ترتيب الفرق النهائية (في طور الفرق) */}
      {isTeamsMode && (
        <div className="dark-monochrome-card rounded-xl p-2.5 sm:p-3.5 border border-white/10 my-[5px] max-w-lg mx-auto w-full">
          <h3 className="text-xs sm:text-sm font-bold text-white mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-amber-400">groups</span>
            <span>الترتيب النهائي للفرق:</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {teamScores.map((team, idx) => {
              const color =
                team.teamColor ||
                activeTeams.find((t) => t.id === team.teamId)?.color ||
                '#f43f5e';
              return (
                <div
                  key={team.teamId}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low border text-xs"
                  style={{ borderColor: idx === 0 ? color : `${color}55` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-black text-white">
                      {idx === 0 ? '👑' : `#${idx + 1}`}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-bold text-white truncate">{team.teamName}</span>
                  </div>
                  <span className="font-black text-amber-400 shrink-0">{team.score} نقطة</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* المنصة الثلاثية مع شخصيات كلك */}
      <div className="flex items-end justify-center gap-2 sm:gap-3 max-w-sm sm:max-w-md mx-auto w-full my-[5px] px-2 shrink-0">
        {/* المركز الثاني */}
        {secondPlace && (
          <div className="flex-1 flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mb-1 flex items-center justify-center">
              <ConsolePet avatar={secondPlace.avatar} size={40} />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-white mb-0.5 truncate max-w-[70px] sm:max-w-[80px]">
              {secondPlace.nickname}
            </span>
            <div className="w-full bg-surface-container-low border border-outline-variant/60 rounded-t-xl h-16 sm:h-20 flex flex-col items-center justify-center p-1 sm:p-1.5">
              <span className="text-sm sm:text-base font-bold text-white">2</span>
              <span className="text-[9px] sm:text-[10px] text-on-surface-variant">{secondPlace.score} نقطة</span>
            </div>
          </div>
        )}

        {/* المركز الأول */}
        {firstPlace && (
          <div className="flex-1 flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mb-1 relative flex items-center justify-center">
              <span className="material-symbols-outlined text-yellow-400 text-base sm:text-lg absolute -top-2.5 left-1/2 -translate-x-1/2 drop-shadow animate-bounce">
                crown
              </span>
              <ConsolePet avatar={firstPlace.avatar} size={50} />
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-white mb-0.5 truncate max-w-[85px] sm:max-w-[100px]">
              {firstPlace.nickname}
            </span>
            <div className="w-full bg-white text-surface-container-lowest rounded-t-xl h-22 sm:h-28 flex flex-col items-center justify-center p-1 sm:p-1.5 shadow-xl">
              <span className="text-lg sm:text-xl font-black">1</span>
              <span className="text-[9px] sm:text-[10px] font-bold">{firstPlace.score} نقطة</span>
            </div>
          </div>
        )}

        {/* المركز الثالث */}
        {thirdPlace && (
          <div className="flex-1 flex flex-col items-center">
            <div className="w-9 h-9 sm:w-10 sm:h-10 mb-1 flex items-center justify-center">
              <ConsolePet avatar={thirdPlace.avatar} size={34} />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-white mb-0.5 truncate max-w-[70px] sm:max-w-[80px]">
              {thirdPlace.nickname}
            </span>
            <div className="w-full bg-surface-container-low border border-outline-variant/60 rounded-t-xl h-12 sm:h-14 flex flex-col items-center justify-center p-1">
              <span className="text-sm sm:text-base font-bold text-white">3</span>
              <span className="text-[9px] sm:text-[10px] text-on-surface-variant">{thirdPlace.score} نقطة</span>
            </div>
          </div>
        )}
      </div>

      {/* لوحة الترتيب الكاملة */}
      <div className="dark-monochrome-card rounded-xl p-2.5 sm:p-3.5 border border-white/10 my-[5px] max-w-lg mx-auto w-full">
        <h3 className="text-xs sm:text-sm font-bold text-white mb-1.5 sm:mb-2">الترتيب النهائي لجميع اللاعبين:</h3>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-0.5">
          {leaderboard.map((entry, idx) => {
            const entryTeam = activeTeams.find((t) => t.id === entry.teamId);
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-surface-container-low text-[10px] sm:text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-outline w-4 text-center">#{idx + 1}</span>
                  <div className="w-6 h-6 rounded-md bg-surface-container flex items-center justify-center overflow-hidden shrink-0 border border-outline-variant/40">
                    <ConsolePet avatar={entry.avatar} size={22} />
                  </div>
                  <span className="font-bold text-white truncate">{entry.nickname}</span>
                  {room?.gameMode === 'teams' && entryTeam && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-surface-container border border-outline-variant/30"
                      style={{ borderColor: entryTeam.color }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: entryTeam.color }}
                      />
                      <span>{entryTeam.name}</span>
                    </span>
                  )}
                  {(entry.cheatCount ?? 0) > 0 && (
                    <span
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-[9px] font-bold text-rose-300 shrink-0"
                      title="تم رصد محاولة غش أو مغادرة المتصفح أثناء الأسئلة"
                    >
                      <span>🚨 غش ×{entry.cheatCount}</span>
                    </span>
                  )}
                </div>
                <span className="font-bold text-white shrink-0">{entry.score} نقطة</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* أزرار الإجراءات: إعادة التحدي أو مغادرة الجلسة */}
      <div className="py-[5px] max-w-sm mx-auto w-full space-y-1.5 shrink-0">
        {isHost ? (
          <button
            type="button"
            onClick={rematch}
            className="w-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-extrabold py-2 sm:py-2.5 px-4 rounded-lg shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 text-xs sm:text-sm"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">replay</span>
            <span>إعادة التحدي (مباراة جديدة بنفس اللاعبين)</span>
          </button>
        ) : (
          <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-center text-[10px] sm:text-xs text-on-surface-variant flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-amber-400 animate-spin">sync</span>
            <span>في انتظار المضيف لبدء إعادة التحدي أو العودة للردهة...</span>
          </div>
        )}

        <button
          type="button"
          onClick={leaveRoom}
          className="w-full bg-surface-container-low hover:bg-surface-container text-white border border-outline-variant/50 font-bold py-2 px-4 rounded-lg shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 text-xs sm:text-sm"
        >
          <span>مغادرة الجلسة والعودة للرئيسية</span>
          <span className="material-symbols-outlined text-[15px] sm:text-[16px]">logout</span>
        </button>
      </div>
    </div>
  );
};
