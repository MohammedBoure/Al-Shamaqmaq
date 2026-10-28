import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext';
import { GameTopHeader } from '../common/GameTopHeader';
import { ConsolePet } from '../common/ConsolePet';
import { DEFAULT_TEAMS } from '../../types';

export const RoundResultsScreen: React.FC = () => {
  const {
    roundResult,
    leaderboard,
    teamScores,
    isLastRound,
    player,
    room,
    nextRound,
    currentRound,
    totalRounds,
    audio,
    haptic,
    leaveRoom,
    abortGame,
  } = useGame();

  const [isMenuOpen, setIsMenuOpen] = React.useState<boolean>(false);
  const isHost = player?.isHost || player?.id === room?.hostId;
  const activeTeams = room?.teams && room.teams.length > 0 ? room.teams : DEFAULT_TEAMS.slice(0, room?.teamCount || 2);

  useEffect(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#c7c6c6', '#8e9192', '#343535'],
    });
  }, []);

  if (!roundResult) {
    return (
      <div className="flex items-center justify-center min-h-screen text-on-surface-variant font-medium">
        جارٍ احتساب نتائج الجولة... ⏳
      </div>
    );
  }

  const correctOption = roundResult.options.find((o) => o.isCorrect);
  const correctAnswerText = correctOption?.text || roundResult.correctAnswer;
  const bluffOptions = roundResult.options.filter((o) => !o.isCorrect);

  // Split bluffs into active traps (fooled someone) and unpicked lies (0 victims)
  const activeTraps = bluffOptions
    .filter((opt) => opt.votes && opt.votes.length > 0)
    .sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));

  const unpickedLies = bluffOptions.filter(
    (opt) => !opt.votes || opt.votes.length === 0
  );

  const displayedTeamScores =
    roundResult.teamScores && roundResult.teamScores.length > 0
      ? roundResult.teamScores
      : teamScores;

  const handleNextRound = () => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    nextRound();
  };

  return (
    <div className="flex flex-col min-h-full w-full max-w-lg mx-auto px-4 select-none relative">
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
        centerType="correct"
        onMenuClick={() => setIsMenuOpen(true)}
      />

      {/* Main Single-Column Unified Screen */}
      <main className="flex-1 flex flex-col py-4 gap-5 pb-24">
        {/* SECTION A: The Answers & Traps Breakdown */}
        <section className="flex flex-col gap-3">
          {/* 1. The Correct Answer Card */}
          <div className="bg-surface-container-low border border-white/20 rounded-xl p-4 text-center shadow-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold mb-2">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              الإجابة الصحيحة (+2)
            </span>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {correctAnswerText}
            </h1>

            {/* Players who found the truth */}
            <div className="mt-3 pt-3 border-t border-outline-variant/30 flex items-center justify-center gap-2 flex-wrap">
              {correctOption?.votes && correctOption.votes.length > 0 ? (
                <>
                  <span className="text-[11px] text-emerald-400 font-semibold">عرفوا الحقيقة:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {correctOption.votes.map((voter) => (
                      <span
                        key={voter.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high border border-outline-variant/40 text-xs font-bold text-white"
                      >
                        <span className="w-4 h-4 rounded-full overflow-hidden inline-flex items-center justify-center">
                          <ConsolePet avatar={voter.avatar} size={16} />
                        </span>
                        <span>{voter.nickname}</span>
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <span className="text-xs text-on-surface-variant">
                  لم يعرف أحد الحقيقة هذه الجولة!
                </span>
              )}
            </div>
          </div>

          {/* 2. The Bluff / Trap Cards (Who Fooled Whom) */}
          <div className="flex flex-col gap-2">
            {activeTraps.map((opt) => {
              const authors = opt.authors || [];
              const authorNames =
                authors.length > 0
                  ? authors.map((a) => a.nickname).join('، ')
                  : 'إجابتنا';
              const fooledCount = opt.votes ? opt.votes.length : 0;

              return (
                <div
                  key={opt.id}
                  className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs"
                >
                  {/* Right Side: The Trap Text & Author / Team */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-bold text-white truncate">
                      {opt.text}
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      {opt.teamName && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-surface-container border border-outline-variant/40"
                          style={{ borderColor: opt.teamColor || undefined }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: opt.teamColor || '#ffffff' }}
                          />
                          <span>{opt.teamName}</span>
                        </span>
                      )}
                      <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                        <span>صاحب الخدعة:</span>
                        <strong className="text-white font-bold">{authorNames}</strong>
                      </span>
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                        +{fooledCount}
                      </span>
                    </div>
                  </div>

                  {/* Left Side: The Victims ("وقع في الفخ") */}
                  <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1.5 rounded-lg border border-outline-variant/40 shrink-0">
                    <span className="material-symbols-outlined text-[15px] text-amber-400">
                      theater_comedy
                    </span>
                    <div className="flex -space-x-1 items-center">
                      {opt.votes?.map((victim) => (
                        <div
                          key={victim.id}
                          className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant/60 flex items-center justify-center overflow-hidden"
                          title={`وقع في الفخ: ${victim.nickname}`}
                        >
                          <ConsolePet avatar={victim.avatar} size={22} />
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-white mr-1 max-w-[80px] sm:max-w-[120px] truncate">
                      {opt.votes?.map((v) => v.nickname).join('، ')}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* 3. Unpicked Lies (Zero Victims) — Collapsed ultra-slim muted row */}
            {unpickedLies.length > 0 && (
              <div className="bg-surface-container/50 border border-outline-variant/30 rounded-lg p-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-on-surface-variant">
                <span className="font-semibold text-outline">خدع لم تنطلِ على أحد:</span>
                {unpickedLies.map((lie) => {
                  const author =
                    lie.authors && lie.authors.length > 0
                      ? lie.authors.map((a) => a.nickname).join('، ')
                      : 'إجابتنا';
                  return (
                    <span
                      key={lie.id}
                      className="px-2 py-0.5 rounded-md bg-surface-container-high/60 border border-outline-variant/30 text-on-surface-variant inline-flex items-center gap-1"
                    >
                      {lie.teamName && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: lie.teamColor || '#ffffff' }}
                        />
                      )}
                      <span>{lie.text}</span>
                      <span className="opacity-60">
                        ({lie.teamName ? `${lie.teamName} - ${author}` : author})
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SECTION B: Compact Inline Scoreboard (Directly Below Answers) */}
        <section className="flex flex-col gap-2.5 pt-2 border-t border-outline-variant/30">
          {/* Team Scores Grid (if mode is teams) */}
          {displayedTeamScores && displayedTeamScores.length > 0 && (
            <div className="flex flex-col gap-2 mb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-400">groups</span>
                  <span>ترتيب الفرق ({displayedTeamScores.length})</span>
                </h2>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  مجموع نقاط كل فريق
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {displayedTeamScores.map((team, idx) => {
                  const teamColor =
                    team.teamColor ||
                    activeTeams.find((t) => t.id === team.teamId)?.color ||
                    '#f43f5e';
                  return (
                    <div
                      key={team.teamId}
                      className="p-2.5 rounded-lg border bg-surface-container-low flex items-center justify-between gap-2"
                      style={{
                        borderColor: idx === 0 ? teamColor : `${teamColor}66`,
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-white shrink-0">
                          {idx === 0 ? '👑' : `#${idx + 1}`}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: teamColor }}
                        />
                        <span className="text-xs font-bold text-white truncate">
                          {team.teamName}
                        </span>
                        {typeof team.playerCount === 'number' && (
                          <span className="text-[10px] text-on-surface-variant">
                            ({team.playerCount})
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-black text-amber-400 shrink-0">
                        {team.score} نقطة
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-amber-400">leaderboard</span>
              <span>ترتيب اللاعبين</span>
            </h2>
            <span className="text-[10px] text-on-surface-variant font-medium">
              بعد الجولة {currentRound}
            </span>
          </div>

          {/* Compact Leaderboard Rows */}
          <div className="flex flex-col gap-1.5">
            {leaderboard.map((entry, idx) => {
              const detail = roundResult.scoreBreakdown?.find((b) => b.playerId === entry.id);
              const isMe = entry.id === player?.id;
              const roundEarned = detail?.roundPoints ?? 0;
              const entryTeam = activeTeams.find((t) => t.id === entry.teamId);

              return (
                <div
                  key={entry.id}
                  className={`py-2 px-3 rounded-lg border flex items-center justify-between transition-all ${
                    idx === 0
                      ? 'bg-surface-container-high border-white/60 text-white shadow-xs'
                      : isMe
                      ? 'bg-surface-container border-white/40 shadow-xs'
                      : 'bg-surface-container-low border-outline-variant/40'
                  }`}
                >
                  {/* Rank, Avatar, Nickname */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 text-center text-xs font-black text-on-surface-variant shrink-0">
                      {idx === 0 ? '👑' : idx + 1}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden shrink-0 border border-outline-variant/40">
                      <ConsolePet avatar={entry.avatar} size={24} />
                    </div>
                    <span className="text-xs font-bold text-white truncate max-w-[120px]">
                      {entry.nickname}
                    </span>
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
                    {isMe && (
                      <span className="text-[9px] font-bold text-on-surface-variant">
                        (أنت)
                      </span>
                    )}
                    {(entry.cheatCount ?? detail?.cheatCount ?? 0) > 0 && (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-[9px] font-bold text-rose-300 shrink-0"
                        title="تم رصد محاولة غش أو مغادرة المتصفح أثناء الأسئلة"
                      >
                        <span>🚨 غش ×{entry.cheatCount ?? detail?.cheatCount}</span>
                      </span>
                    )}
                  </div>

                  {/* Round Delta & Total Points */}
                  <div className="flex items-center gap-2 shrink-0">
                    {roundEarned > 0 && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                        +{roundEarned}
                      </span>
                    )}
                    <span className="text-xs font-black text-white">
                      {entry.score} <span className="text-[10px] font-normal text-on-surface-variant">نقطة</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Sticky Bottom Next Round Button */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 py-3 px-4">
        <div className="max-w-lg mx-auto">
          {isHost ? (
            <button
              type="button"
              onClick={handleNextRound}
              className="w-full bg-white hover:bg-neutral-200 text-surface-container-lowest font-bold text-xs sm:text-sm py-2.5 px-4 rounded-lg shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>{isLastRound ? 'إعلان النتائج النهائية والتتويج' : 'الانتقال إلى الجولة التالية'}</span>
              <span className="material-symbols-outlined text-[16px] rotate-180">arrow_back</span>
            </button>
          ) : (
            <div className="text-center text-xs text-on-surface-variant flex items-center justify-center gap-1.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>في انتظار المضيف للانتقال للجولة التالية...</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
