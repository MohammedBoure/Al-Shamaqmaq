import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { GameTopHeader } from '../common/GameTopHeader';
import { ConsolePet } from '../common/ConsolePet';
import { DEFAULT_TEAMS } from '../../types';
import { useAntiCheat } from '../../hooks/useAntiCheat';

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
    submitTeamVote,
    reportCheat,
    cheatAlerts,
    teamRoundState,
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
  const myTeam = activeTeams.find((t) => t.id === (player?.teamId || teamRoundState?.teamId));

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

  const handleVoteCandidate = (candidateId: string) => {
    audio.playClick();
    haptic.triggerHaptic('light');
    submitTeamVote(candidateId);
  };

  const isWaitingForOthers = hasSubmittedInitial && (!requiresBluff || hasSubmittedBluff);
  const isEnteringBluff = hasSubmittedInitial && requiresBluff && !hasSubmittedBluff;
  const isTeamVotingSubPhase = Boolean(isTeamsMode && teamRoundState?.isTeamVotingPhase);

  // تفعيل نظام كشف الغش وحماية الشاشة طالما لم يُكمل اللاعب إجابته
  const { isScreenShieldActive, shieldReason } = useAntiCheat({
    enabled: !isWaitingForOthers,
    onCheatDetected: (cheatType) => {
      reportCheat(cheatType);
    },
  });

  const latestCheatAlert = cheatAlerts[0];

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

      {/* Team Status & Live Team Scores Strip */}
      {isTeamsMode && (
        <div className="mt-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: myTeam?.color || '#ffffff' }}
              />
              <span className="text-xs font-bold text-white truncate">
                فريقك: {myTeam?.name || 'فريق'}
              </span>
            </div>
            <span className="text-[10px] text-on-surface-variant font-semibold shrink-0">
              تُعرض إجابة واحدة لكل فريق
            </span>
          </div>

          {teamScores && teamScores.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
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
        </div>
      )}

      {/* Main Single-Column Game Area */}
      <main className="flex-1 flex flex-col justify-center py-4 gap-5">
        {/* Question Hero Area (With Anti-Screenshot & Focus Blur Shield) */}
        <div
          className="text-center relative select-none"
          onContextMenu={(e) => e.preventDefault()}
          onCopy={(e) => {
            e.preventDefault();
            reportCheat('COPY_PASTE');
          }}
        >
          {/* Category Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-high border border-outline-variant/40 text-xs font-semibold text-on-surface-variant mb-3">
            <span className="material-symbols-outlined text-[14px] text-white">category</span>
            <span>{currentTopicTitle || 'سؤال الجولة'}</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mr-1" title="حماية ضد الغش وتصوير الشاشة مفعلة">
              <span className="material-symbols-outlined text-[12px]">shield</span>
            </span>
          </div>

          {/* Question Prompt */}
          <div className="relative">
            <h1
              className={`text-xl sm:text-2xl font-black text-white leading-relaxed tracking-tight transition-all duration-150 ${
                isScreenShieldActive ? 'blur-lg opacity-20 select-none pointer-events-none' : ''
              }`}
            >
              {currentPuzzle?.prompt || 'جارٍ تحميل لغز الجولة...'}
            </h1>

            {isScreenShieldActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-xl p-3 border border-rose-500/50 text-center">
                <span className="material-symbols-outlined text-rose-400 text-2xl mb-1">
                  visibility_off
                </span>
                <span className="text-xs font-bold text-white">
                  {shieldReason || 'تم إخفاء السؤال لمنع الغش وتصوير الشاشة 📸'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TEAM CORRECT ANSWER REVEAL BANNER (If any teammate wrote the correct answer!) */}
        {isTeamsMode && teamRoundState?.hasCorrectAnswer && (
          <div className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-xl p-3.5 text-right shadow-md animate-fadeIn">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>
                  {teamRoundState.correctFinderId === player?.id
                    ? 'أحسنت! لقد كتبت الإجابة الصحيحة وتم كشفها لفريقك:'
                    : `اكتشف زميلك (${teamRoundState.correctFinderNickname}) الإجابة الصحيحة!`}
                </span>
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                حقيقة مكشوفة لفريقك
              </span>
            </div>
            <div className="mt-1.5 p-2.5 rounded-lg bg-black/40 border border-emerald-500/30 text-center">
              <span className="text-[11px] text-emerald-300/80 block mb-0.5">الإجابة الصحيحة هي:</span>
              <span className="text-base sm:text-lg font-black text-white">
                {teamRoundState.correctAnswerText}
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80 mt-2">
              الآن اكتبوا خدعة لتضليل الفرق الأخرى أو صوّتوا لأقوى خدعة من فريقكم بالأسفل!
            </p>
          </div>
        )}

        {/* Action Phase */}
        {isEnteringBluff ? (
          /* Bluff Input Phase (Correct answer found, now write a lie) */
          <div className="bg-surface-container-low border border-amber-400/50 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                عرفت الحقيقة! الآن اكتب خدعة بديلة لتمثيل فريقك:
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
        ) : isTeamVotingSubPhase ? (
          /* 15-Second Intra-Team Voting Sub-Phase (After everyone has typed their answer) */
          <div className="bg-amber-950/40 border-2 border-amber-400/70 rounded-xl p-3.5 text-center flex flex-col items-center gap-1.5 shadow-md animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs sm:text-sm">
              <span className="material-symbols-outlined text-[20px]">how_to_vote</span>
              <span>وقت تصويت الفريق ({timeRemaining} ثانية)</span>
            </div>
            <p className="text-[11px] text-amber-100/90">
              أكمل الجميع كتابة إجاباتهم! صوّتوا الآن بالأسفل لاختيار إجابة واحدة تُمثّل فريقكم أمام الفرق الأخرى.
            </p>
          </div>
        ) : isWaitingForOthers ? (
          /* Waiting for Others Phase */
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-inner">
              <ConsolePet avatar={player?.avatar} size={40} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">تم استلام إجابتك!</h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                {isTeamsMode
                  ? 'في انتظار انتهاء بقية اللاعبين من الكتابة ليبدأ وقت تصويت الفريق (15 ثانية)...'
                  : 'في انتظار بقية اللاعبين لتقديم إجاباتهم...'}
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
                onPaste={(e) => {
                  e.preventDefault();
                  reportCheat('COPY_PASTE');
                }}
                placeholder={
                  isTeamsMode && teamRoundState?.hasCorrectAnswer
                    ? 'اكتب خدعة ذكية باسم فريقك لتضليل المنافسين...'
                    : 'اكتب إجابتك أو تخمينك الذكي...'
                }
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
              <span>
                {isTeamsMode && teamRoundState?.hasCorrectAnswer
                  ? 'إرسال خدعة الفريق'
                  : 'إرسال الإجابة'}
              </span>
              <span className="material-symbols-outlined text-[16px] rotate-180">arrow_back</span>
            </button>
          </form>
        )}

        {/* INTRA-TEAM ANSWER VOTING PANEL (Shown once the player finished typing or during the 15s Team Voting phase) */}
        {isTeamsMode && teamRoundState && (isWaitingForOthers || isTeamVotingSubPhase) && (
          <div
            className={`bg-surface-container-low border rounded-xl p-3.5 flex flex-col gap-2.5 transition-all ${
              isTeamVotingSubPhase
                ? 'border-amber-400/80 ring-1 ring-amber-400/30 shadow-lg'
                : 'border-outline-variant/50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-400">how_to_vote</span>
                <span className="text-xs font-bold text-white">
                  {teamRoundState.hasCorrectAnswer
                    ? 'صوّت لاختيار خدعة فريقك المعروضة للآخرين:'
                    : 'إجابات أعضاء فريقك — صوّت لإجابة واحدة لعرضها للفرق الأخرى:'}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                  isTeamVotingSubPhase
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                    : 'text-on-surface-variant'
                }`}
              >
                {isTeamVotingSubPhase
                  ? `⏱️ ${timeRemaining} ثانية للتصويت`
                  : `${teamRoundState.candidates.length} إجابات`}
              </span>
            </div>

            {teamRoundState.candidates.length === 0 ? (
              <div className="py-3 text-center text-xs text-on-surface-variant border border-dashed border-outline-variant/30 rounded-lg">
                لم يكتب أحد من فريقك إجابة للعرض بعد...
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-0.5">
                {teamRoundState.candidates.map((cand) => {
                  const isMyVote = player?.id ? cand.voterIds.includes(player.id) : false;
                  const isSelectedForTeam = teamRoundState.selectedCandidateId === cand.id;
                  const voteCount = cand.voterIds.length;
                  const voterNames = cand.voterIds
                    .map((vid) => {
                      const p = room?.players.find((pl) => pl.id === vid);
                      if (!p) return null;
                      return p.id === player?.id ? `${p.nickname} (أنت)` : p.nickname;
                    })
                    .filter(Boolean);

                  return (
                    <button
                      key={cand.id}
                      type="button"
                      onClick={() => handleVoteCandidate(cand.id)}
                      className={`w-full p-2.5 rounded-lg border text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelectedForTeam
                          ? 'bg-surface-container-high border-amber-400/80 shadow-xs'
                          : isMyVote
                          ? 'bg-surface-container border-white/60'
                          : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/40'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-white break-words">
                            {cand.text}
                          </span>
                          {isSelectedForTeam && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                              مختارة لعرضها للآخرين ⭐
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-on-surface-variant">
                          كتبها: <strong className="text-white">{cand.authorNickname}</strong>
                        </span>
                        {voterNames.length > 0 && (
                          <span className="text-[10px] text-amber-300 font-semibold mt-0.5">
                            اختارها من فريقك: {voterNames.join('، ')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 border ${
                            isMyVote
                              ? 'bg-white text-surface-container-lowest border-white'
                              : 'bg-surface-container text-on-surface-variant border-outline-variant/40'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">thumb_up</span>
                          <span>{voteCount}</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
