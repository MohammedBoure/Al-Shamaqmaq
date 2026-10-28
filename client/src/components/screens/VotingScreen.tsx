import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { GameTopHeader } from '../common/GameTopHeader';
import { ConsolePet } from '../common/ConsolePet';
import { DEFAULT_TEAMS } from '../../types';
import { useAntiCheat } from '../../hooks/useAntiCheat';

export const VotingScreen: React.FC = () => {
  const {
    votingPrompt,
    votingOptions,
    timeRemaining,
    hasVoted,
    votedOptionId,
    submitVote,
    reportCheat,
    cheatAlerts,
    currentRound,
    totalRounds,
    teamScores,
    player,
    audio,
    haptic,
    leaveRoom,
    abortGame,
    room,
  } = useGame();

  const isHost = player?.id === room?.hostId;
  const isTeamsMode = room?.gameMode === 'teams';
  const activeTeams = room?.teams && room.teams.length > 0 ? room.teams : DEFAULT_TEAMS.slice(0, room?.teamCount || 2);
  const myTeam = activeTeams.find((t) => t.id === player?.teamId);

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const { isScreenShieldActive, shieldReason } = useAntiCheat({
    enabled: !hasVoted,
    onCheatDetected: (cheatType) => {
      reportCheat(cheatType);
    },
  });

  const latestCheatAlert = cheatAlerts[0];

  const handleVote = (optionId: string, isSelf: boolean) => {
    if (isSelf) return;
    if (hasVoted && !isTeamsMode) return;
    audio.playClick();
    haptic.triggerHaptic('medium');
    submitVote(optionId);
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
        timeRemaining={timeRemaining}
        centerType="timer"
        onMenuClick={() => setIsMenuOpen(true)}
      />

      {/* Live Anti-Cheat Radar Banner */}
      {latestCheatAlert && Date.now() - latestCheatAlert.timestamp < 12000 && (
        <div className="mt-2 px-3 py-2 rounded-lg bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-[16px] text-rose-400 shrink-0">gpp_maybe</span>
            <span className="truncate">{latestCheatAlert.message}</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 text-[10px] font-black shrink-0">
            ×{latestCheatAlert.cheatCount}
          </span>
        </div>
      )}

      {/* Team Scores Strip */}
      {isTeamsMode && teamScores && teamScores.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {teamScores.map((ts) => (
            <div
              key={ts.teamId}
              className="px-2.5 py-1 rounded-md bg-surface-container-low border border-outline-variant/30 flex items-center gap-1.5 shrink-0 text-[11px]"
              style={{
                borderColor: ts.teamId === myTeam?.id ? ts.teamColor : undefined,
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

      {/* Main Single-Column Game Area */}
      <main className="flex-1 flex flex-col justify-center py-6 gap-6">
        {/* Question Hero Area */}
        <div
          className="text-center relative select-none"
          onContextMenu={(e) => e.preventDefault()}
          onCopy={(e) => {
            e.preventDefault();
            reportCheat('COPY_PASTE');
          }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-high border border-outline-variant/40 text-xs font-semibold text-on-surface-variant mb-3">
            <span>
              {isTeamsMode
                ? 'إجابات الفرق المتنافسة — أيّها هي الحقيقة؟ 🕵️‍♂️'
                : 'أي هذه الإجابات هي الحقيقة؟ 🕵️‍♂️'}
            </span>
          </div>

          <div className="relative">
            <h1
              className={`text-xl sm:text-2xl font-black text-white leading-relaxed tracking-tight transition-all duration-150 ${
                isScreenShieldActive ? 'blur-lg opacity-20 select-none pointer-events-none' : ''
              }`}
            >
              {votingPrompt || 'اختر الإجابة الصحيحة وتجنب الوقوع في فخ الخداع!'}
            </h1>
            {isScreenShieldActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-xl p-2 border border-rose-500/50 text-center">
                <span className="text-xs font-bold text-white">
                  {shieldReason || 'تم إخفاء السؤال لمنع الغش وتصوير الشاشة 📸'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Voting Options or Locked State (In Teams mode, keep options visible so players can see what their team chose and choose like them) */}
        {hasVoted && !isTeamsMode ? (
          /* Privacy Locked Screen (Individual Mode) */
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
          /* Single Column Vertical Stack of Answers (1 per team + truth) */
          <div className="flex flex-col gap-2.5">
            {isTeamsMode && hasVoted && (
              <div className="px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                ✅ تم تسجيل اختيارك! يمكنك رؤية اختيارات زملائك في الفريق بالأسفل أو التغيير للاختيار مثلهم
              </div>
            )}

            {votingOptions.map((opt) => {
              const isSelected = votedOptionId === opt.id;
              const isSelf = opt.isSelfSubmission;
              const isTeamHint = opt.isTeamCorrectHint;
              const teamVoters = opt.teamVoters || [];
              const hasTeammateVotes = isTeamsMode && teamVoters.length > 0;

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={(!isTeamsMode && hasVoted) || isSelf}
                  onClick={() => handleVote(opt.id, isSelf)}
                  className={`w-full py-3 px-4 rounded-lg border text-right transition-all duration-150 flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-surface-container-high border-2 border-white ring-2 ring-white/10 shadow-md scale-[1.01]'
                      : isSelf
                      ? 'bg-surface-container-low/40 border-outline-variant/30 opacity-40 cursor-not-allowed'
                      : isTeamHint
                      ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/70 text-white cursor-pointer shadow-xs'
                      : hasTeammateVotes
                      ? 'bg-surface-container hover:bg-surface-container-high border-amber-400/70 text-white cursor-pointer shadow-xs'
                      : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/50 text-white hover:border-white/60 active:scale-[0.99] cursor-pointer'
                  }`}
                >
                  <div className="w-full flex items-center justify-between gap-2">
                    <span className="text-sm sm:text-base font-bold text-white text-center flex-1">
                      {opt.text}
                    </span>

                    {isSelf && (
                      <span className="text-[10px] text-on-surface-variant font-semibold px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant/40 shrink-0">
                        {isTeamsMode ? 'إجابة فريقك' : 'إجابتك'}
                      </span>
                    )}

                    {isTeamHint && !isSelf && (
                      <span className="text-[10px] text-emerald-300 font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 shrink-0">
                        الإجابة الصحيحة (اكتشفها فريقك 🎯)
                      </span>
                    )}
                  </div>

                  {/* عرض اختيارات أعضاء الفريق مباشرة حتى يتمكن اللاعب من الاختيار مثل فريقه */}
                  {hasTeammateVotes && (
                    <div className="w-full flex items-center justify-between gap-2 pt-1.5 border-t border-outline-variant/30">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">groups</span>
                          <span>اختارها من فريقك:</span>
                        </span>
                        {teamVoters.map((voter) => (
                          <span
                            key={voter.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/40"
                          >
                            <span>
                              {voter.id === player?.id ? `${voter.nickname} (أنت)` : voter.nickname}
                            </span>
                          </span>
                        ))}
                      </div>
                      {!isSelected && !isSelf && (
                        <span className="text-[10px] font-extrabold text-amber-300 shrink-0">
                          اضغط للاختيار مثلهم 👈
                        </span>
                      )}
                    </div>
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
