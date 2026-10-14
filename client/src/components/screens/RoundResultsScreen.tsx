import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext';
import { GameTopHeader } from '../common/GameTopHeader';
import { ConsolePet } from '../common/ConsolePet';

export const RoundResultsScreen: React.FC = () => {
  const {
    roundResult,
    leaderboard,
    isLastRound,
    player,
    nextRound,
    currentRound,
    totalRounds,
    audio,
    haptic,
    leaveRoom,
    abortGame,
  } = useGame();

  const [viewState, setViewState] = useState<'reveal' | 'leaderboard'>('reveal');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const isHost = player?.isHost;

  useEffect(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#c7c6c6', '#8e9192', '#343535'],
    });
  }, [viewState]);

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

  const handleNextRound = () => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    nextRound();
  };

  const handleSwitchTab = (tab: 'reveal' | 'leaderboard') => {
    audio.playClick();
    haptic.triggerHaptic('light');
    setViewState(tab);
  };

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

      {/* الشريط العلوي مع زر الوضع الليلي/النهاري */}
      <GameTopHeader
        currentRound={currentRound}
        totalRounds={totalRounds}
        centerType="correct"
        onMenuClick={() => setIsMenuOpen(true)}
      />

      {/* تبديل العرض بين كشف الخدعة ولوحة النقاط */}
      <div className="mono-well p-1 rounded-xl grid grid-cols-2 gap-1.5 my-[5px] max-w-sm mx-auto w-full shrink-0">
        <button
          type="button"
          onClick={() => handleSwitchTab('reveal')}
          className={`py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 ${
            viewState === 'reveal'
              ? 'font-bold bg-white text-surface-container-lowest shadow-xs'
              : 'font-semibold text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">theater_comedy</span>
          <span>الإجابة والخدع</span>
        </button>
        <button
          type="button"
          onClick={() => handleSwitchTab('leaderboard')}
          className={`py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 ${
            viewState === 'leaderboard'
              ? 'font-bold bg-white text-surface-container-lowest shadow-xs'
              : 'font-semibold text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">leaderboard</span>
          <span>ترتيب النقاط</span>
        </button>
      </div>

      {/* محتوى الشاشة */}
      <div className="flex-1 space-y-2 sm:space-y-3 my-[5px]">
        {viewState === 'reveal' ? (
          <div className="space-y-2 sm:space-y-3 animate-fadeIn">
            {/* الإجابة الصحيحة */}
            <div className="dark-monochrome-card rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/20 text-center my-[5px]">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-white text-surface-container-lowest text-[11px] sm:text-xs font-bold mb-2.5 sm:mb-3">
                <span className="material-symbols-outlined text-[14px] sm:text-[15px]">verified</span>
                الإجابة الحقيقية الصحيحة (+٢ نقطة)
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {correctAnswerText}
              </h2>

              {/* من صوت للإجابة الصحيحة */}
              {correctOption?.votes && correctOption.votes.length > 0 ? (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-outline-variant/30 text-xs text-on-surface-variant">
                  <span className="font-semibold text-emerald-400 ml-1">عرفوا الحقيقة (+٢ نقطة):</span>
                  <span className="text-white font-medium">
                    {correctOption.votes.map((v) => v.nickname).join('، ')}
                  </span>
                </div>
              ) : (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-outline-variant/30 text-xs text-on-surface-variant">
                  لم يعرف أحد الحقيقة في هذه الجولة! 😲
                </div>
              )}
            </div>

            {/* الخدع المكشوفة مع شخصيات كلك */}
            <div className="space-y-2.5 sm:space-y-3">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">theater_comedy</span>
                <span>الخدع التي أوقعَت اللاعبين (+١ نقطة لكل مخدوع):</span>
              </h3>

              <div className="space-y-2 sm:space-y-2.5">
                {bluffOptions.map((opt) => {
                  const author = opt.authors && opt.authors[0];
                  const authorNames = opt.authors && opt.authors.length > 0
                    ? opt.authors.map((a) => a.nickname).join('، ')
                    : 'أحد اللاعبين';

                  const fooledCount = opt.votes ? opt.votes.length : 0;

                  return (
                    <div
                      key={opt.id}
                      className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/50 flex items-center justify-center overflow-hidden shrink-0">
                          <ConsolePet avatar={author?.avatar} size={36} />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-white block">{opt.text}</span>
                          <span className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 block">
                            صاحب الخدعة: <strong className="text-white">{authorNames}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] sm:text-xs font-medium self-end sm:self-auto flex items-center gap-2">
                        {fooledCount > 0 ? (
                          <>
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                              +{fooledCount} {fooledCount === 1 ? 'نقطة' : 'نقاط'}
                            </span>
                            <span className="text-white bg-surface-container-high px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg">
                              وقع في الفخ: {opt.votes?.map((v) => v.nickname).join('، ')}
                            </span>
                          </>
                        ) : (
                          <span className="text-on-surface-variant">لم يقع أحد في الفخ</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* زر سريع للاطلاع على لوحة المتصدرين */}
            <button
              type="button"
              onClick={() => handleSwitchTab('leaderboard')}
              className="w-full p-3 sm:p-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 flex items-center justify-between text-xs font-bold text-white transition-all shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-400">leaderboard</span>
                <span>عرض جدول ترتيب المتصدرين ونقاط الجولة {currentRound}</span>
              </div>
              <span className="material-symbols-outlined text-[16px] rotate-180 text-on-surface-variant">
                arrow_back
              </span>
            </button>
          </div>
        ) : (
          /* لوحة المتصدرين الشاملة بعد كل جولة */
          <div className="space-y-4 animate-fadeIn">
            {/* بطاقة نظام النقاط التوضيحية */}
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-around text-center text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-xs">
                  +٢
                </span>
                <span className="text-on-surface-variant font-medium">للإجابة الصحيحة</span>
              </div>
              <div className="w-px h-6 bg-outline-variant/30" />
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-extrabold flex items-center justify-center text-xs">
                  +١
                </span>
                <span className="text-on-surface-variant font-medium">عن كل لاعب مخدوع</span>
              </div>
            </div>

            {/* ترتيب الفرق إن وجد */}
            {roundResult.teamScores && roundResult.teamScores.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-2">
                {roundResult.teamScores.map((team) => (
                  <div
                    key={team.teamId}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      team.teamId === 'red'
                        ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                        : 'bg-blue-950/20 border-blue-500/40 text-blue-300'
                    }`}
                  >
                    <span className="text-xs font-bold">{team.teamName}</span>
                    <span className="text-sm font-extrabold">{team.score} نقطة</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-amber-400">trophy</span>
                <span>جدول ترتيب اللاعبين بعد الجولة {currentRound}:</span>
              </h3>
              <span className="text-[11px] text-on-surface-variant font-medium">
                الجولة {currentRound} من {totalRounds}
              </span>
            </div>

            {/* قائمة اللاعبين وترتيبهم ونقاطهم */}
            <div className="space-y-2 sm:space-y-2.5">
              {leaderboard.map((entry, idx) => {
                const detail = roundResult.scoreBreakdown?.find((b) => b.playerId === entry.id);
                const isMe = entry.id === player?.id;
                const roundEarned = detail?.roundPoints ?? 0;

                return (
                  <div
                    key={entry.id}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                      idx === 0
                        ? 'bg-surface-container-high border-white/60 text-white shadow-md'
                        : isMe
                        ? 'bg-surface-container border-white/40 shadow-sm'
                        : 'bg-surface-container-low border-outline-variant/40'
                    }`}
                  >
                    {/* معلومات اللاعب والترتيب */}
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-xs sm:text-sm text-white shrink-0">
                        {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </span>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shrink-0 border border-outline-variant/40">
                        <ConsolePet avatar={entry.avatar} size={34} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-white block">
                            {entry.nickname}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white text-surface-container-lowest">
                              أنت
                            </span>
                          )}
                          {idx === 0 && (
                            <span className="text-[10px] text-amber-400 font-bold">المتصدر</span>
                          )}
                        </div>

                        {/* شارات أداء هذه الجولة */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {detail?.votedForCorrect && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <span>+٢ إجابة صحيحة</span>
                              <span className="material-symbols-outlined text-[11px]">check</span>
                            </span>
                          )}
                          {detail && detail.fooledPlayerCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <span>+{detail.deceptionPoints} خدع ({detail.fooledPlayerNames.join('، ')})</span>
                            </span>
                          )}
                          {roundEarned === 0 && (
                            <span className="text-[10px] text-on-surface-variant font-medium">
                              لم يحصد نقاطاً في هذه الجولة
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* إجمالي النقاط ونقاط الجولة */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-outline-variant/20">
                      {roundEarned > 0 && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          +{roundEarned} نقطة
                        </span>
                      )}
                      <div className="text-right">
                        <span className="text-sm sm:text-lg font-extrabold text-white">
                          {entry.score}
                        </span>
                        <span className="text-[11px] sm:text-xs font-normal text-on-surface-variant mr-1">
                          نقطة كليّة
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* زر المتابعة للجولة التالية */}
      <div className="py-[5px] shrink-0">
        {isHost ? (
          <button
            type="button"
            onClick={handleNextRound}
            className="w-full bg-white hover:bg-neutral-200 text-surface-container-lowest font-bold text-xs sm:text-sm py-2 sm:py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <span>{isLastRound ? 'إعلان النتائج النهائية والتتويج' : 'الانتقال إلى الجولة التالية'}</span>
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_back</span>
          </button>
        ) : (
          <div className="text-center text-[10px] sm:text-xs text-on-surface-variant py-1 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>في انتظار المضيف للانتقال للجولة التالية...</span>
          </div>
        )}
      </div>
    </div>
  );
};
