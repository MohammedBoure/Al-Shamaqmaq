import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ThumbsUp,
  ThumbsDown,
  LogOut,
  Volume2,
  VolumeX,
  ChevronRight,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ConsolePet } from '../common/ConsolePet';
import { GameTopHeader } from '../common/GameTopHeader';

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
  } = useGame();

  // الحالة بين كشف الإجابة (reveal) ولوحة النتائج (leaderboard)
  const [viewState, setViewState] = useState<'reveal' | 'leaderboard'>('reveal');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'game' | 'chat'>('game');
  const [liked, setLiked] = useState<boolean | null>(null);

  const isHost = player?.isHost;

  // إطلاق الـ Confetti عند التحميل وعند الانتقال للنتائج
  useEffect(() => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
    });
  }, [viewState]);

  if (!roundResult) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-300 font-bold">
        جارٍ احتساب وتجهيز نتائج الجولة... ⏳
      </div>
    );
  }

  const correctOption = roundResult.options.find((o) => o.isCorrect);
  const correctAnswerText = correctOption?.text || roundResult.correctAnswer;
  const bluffOptions = roundResult.options.filter((o) => !o.isCorrect);

  // اللاعبون الذين أجابوا بشكل صحيح
  const correctPlayers = roundResult.scoreBreakdown.filter((s) => s.votedForCorrect);
  const firstCorrectPlayer = correctPlayers[0] || (correctOption?.votes[0] ? {
    nickname: correctOption.votes[0].nickname,
    avatar: correctOption.votes[0].avatar,
  } : null);

  const handleShare = async () => {
    audio.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'نتائج جولة لعبة كلك!',
          text: `الإجابة الصحيحة كانت: ${correctAnswerText}`,
        });
      } catch (_) {}
    }
  };

  const toggleReaction = (isLike: boolean) => {
    audio.playClick();
    haptic.triggerHaptic('light');
    setLiked((prev) => (prev === isLike ? null : isLike));
  };

  const handleShowLeaderboard = () => {
    audio.playClick();
    haptic.triggerHaptic('success');
    setViewState('leaderboard');
  };

  const handleNextRound = () => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    nextRound();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#1b2245] bg-arcade-pattern px-3 pt-3 max-w-md mx-auto w-full select-none justify-between relative pb-1">
      {/* نافذة القائمة السريعة ☰ */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-start justify-start p-4 pt-16"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-56 bg-[#1e2337] border-3 border-black rounded-2xl p-3 shadow-[0_6px_0_#000] space-y-2 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-black text-gray-400 px-2 pb-1 border-b border-white/10">
              خيارات اللعبة
            </div>
            <button
              type="button"
              onClick={() => {
                audio.toggleMute();
                setIsMenuOpen(false);
              }}
              className="w-full text-right p-2 rounded-xl hover:bg-white/10 text-xs font-bold text-white flex items-center gap-2"
            >
              {audio.isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>{audio.isMuted ? 'تشغيل المؤثرات' : 'كتم المؤثرات'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                leaveRoom();
                setIsMenuOpen(false);
              }}
              className="w-full text-right p-2 rounded-xl hover:bg-rose-950/40 text-xs font-bold text-rose-400 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>مغادرة الجلسة</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. الشريط العلوي: الأخضر في شاشة الإجابة والتاجي الذهبي في لوحة النتائج */}
      <GameTopHeader
        currentRound={currentRound}
        totalRounds={totalRounds}
        centerType={viewState === 'reveal' ? 'correct' : 'crown'}
        onMenuClick={() => setIsMenuOpen(true)}
        onShareClick={handleShare}
      />

      {/* ======================= الشاشة 3: كشف الإجابة الصحيحة ======================= */}
      {viewState === 'reveal' && (
        <>
          {/* بطاقة الإجابة الصحيحة الذهبية المتوهجة المطابقة للصورة 3 */}
          <div className="relative mt-3 mb-2">
            {/* اللسان العلوي الشبه منحرف "الإجابة هي" */}
            <div className="flex justify-center -mb-2 relative z-10">
              <div className="bg-white border-2 border-black rounded-t-xl px-7 py-1 shadow-[0_2px_0_#000]">
                <span className="text-xs font-black text-black">الإجابة هي</span>
              </div>
            </div>

            {/* شخصية اللاعب الذي أجاب صحيحاً مثبتة على أعلى يسار البطاقة */}
            {firstCorrectPlayer && (
              <div className="absolute -top-3.5 left-2 z-20 flex flex-col items-center animate-bounce-subtle">
                <ConsolePet avatar={firstCorrectPlayer.avatar} size={42} />
                <span className="text-[10px] font-black text-white text-stroke-sm -mt-1">
                  {firstCorrectPlayer.nickname}
                </span>
              </div>
            )}

            {/* جسم البطاقة الذهبية المتوهجة مع انعكاس ضوئي مائل */}
            <div className="bg-gradient-to-b from-[#f59e0b] via-[#fbbf24] to-[#d97706] border-3 border-black rounded-3xl p-6 pt-7 shadow-[0_6px_0_#92400e] relative overflow-hidden text-center min-h-[140px] flex items-center justify-center">
              {/* شريط الإضاءة المائل */}
              <div className="absolute top-0 right-1/4 w-12 h-full bg-white/20 transform -skew-x-20 pointer-events-none" />

              <h2 className="text-2xl sm:text-3xl font-black text-white text-stroke-arcade tracking-wider leading-relaxed relative z-10 drop-shadow-[0_2px_0_#000]">
                {correctAnswerText}
              </h2>
            </div>

            {/* كبسولة التفاعل والإعجاب [ 👍 | 👎 ] أسفل البطاقة على اليمين */}
            <div className="flex justify-end mt-2 pr-2">
              <div className="bg-[#1e2337] border-2 border-black rounded-2xl p-1 flex items-center gap-1 shadow-[0_3px_0_#000]">
                <button
                  type="button"
                  onClick={() => toggleReaction(true)}
                  className={`p-1.5 rounded-xl transition-all ${
                    liked === true ? 'bg-emerald-500 text-white' : 'text-gray-300 hover:text-white'
                  }`}
                  title="إعجاب"
                >
                  <ThumbsUp className="w-4 h-4 fill-current" />
                </button>
                <div className="w-px h-4 bg-black/60" />
                <button
                  type="button"
                  onClick={() => toggleReaction(false)}
                  className={`p-1.5 rounded-xl transition-all ${
                    liked === false ? 'bg-rose-500 text-white' : 'text-gray-300 hover:text-white'
                  }`}
                  title="لم يعجبني"
                >
                  <ThumbsDown className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {/* القسم السفلي الأزرق: عرض الخدع وزر "أظهر النتيجة" */}
          <div className="w-full">
            <div className="bg-[#0070f3] border-3 border-black rounded-t-3xl p-3.5 space-y-3 shadow-[0_6px_0_#0047a5]">
              {/* عرض الخدع وأصحابها إن وُجدت */}
              {bluffOptions.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {bluffOptions.map((opt) => {
                    const author = opt.authors[0];
                    return (
                      <div key={opt.id} className="relative pt-1.5">
                        {author && (
                          <div className="absolute -top-1 right-3 z-10 bg-black text-white px-2 py-0.2 rounded border border-white/40 text-[10px] font-black shadow-sm">
                            {author.nickname}
                          </div>
                        )}
                        <div className="w-full py-3 px-3 rounded-2xl bg-[#e2e8f0] border-2 border-black text-center text-sm font-black text-black shadow-[0_2px_0_#94a3b8]">
                          {opt.text}
                          {opt.votes.length > 0 && (
                            <span className="text-[11px] font-bold text-purple-700 block mt-0.5">
                              خدع {opt.votes.length} لاعبين (+{opt.votes.length} نقطة) 🎭
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full py-3 rounded-2xl bg-white border-2 border-black text-center text-xs font-black text-black shadow-inner">
                  لم ينجح أحد في خداع الآخرين هذه الجولة!
                </div>
              )}

              {/* زر "أظهر النتيجة" الرمادي الداكن المطابق للصورة 3 */}
              <button
                type="button"
                onClick={handleShowLeaderboard}
                className="w-full py-3.5 rounded-2xl bg-[#2d354b] hover:bg-[#38435f] text-white font-black text-lg border-3 border-black shadow-[0_4px_0_#1a202c] active:translate-y-1 active:shadow-[0_1px_0_#1a202c] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>أظهر النتيجة</span>
              </button>
            </div>

            {/* كبسولة التبديل السفلية */}
            <div className="flex justify-center bg-[#1b2245] py-2">
              <div className="flex items-center bg-[#1e2337] border-2 border-black rounded-full p-1 shadow-[0_3px_0_#000]">
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('game')}
                  className={`px-6 py-1 rounded-full text-xs font-black transition-all ${
                    activeBottomTab === 'game'
                      ? 'bg-[#0070f3] text-white border border-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  لعبة
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('chat')}
                  className={`px-6 py-1 rounded-full text-xs font-black transition-all ${
                    activeBottomTab === 'chat'
                      ? 'bg-[#0070f3] text-white border border-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  دردشة
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======================= الشاشة 4: لوحة النتائج ======================= */}
      {viewState === 'leaderboard' && (
        <>
          {/* بطاقة النتائج الكحلية مع النجوم الثلاث في الأعلى المطابقة للصورة 4 */}
          <div className="relative mt-4 mb-auto">
            {/* النجوم الثلاث الذهبية المثبتة في أعلى الحاوية */}
            <div className="flex justify-center items-end gap-0.5 -mb-3 relative z-10">
              <span className="text-2xl drop-shadow-[0_2px_0_#000] transform -rotate-12">⭐</span>
              <span className="text-3xl drop-shadow-[0_2px_0_#000] -translate-y-1">⭐</span>
              <span className="text-2xl drop-shadow-[0_2px_0_#000] transform rotate-12">⭐</span>
            </div>

            {/* الحاوية الكحلية للنتائج */}
            <div className="bg-[#2d354b] border-3 border-black rounded-3xl overflow-hidden shadow-[0_6px_0_#000]">
              {/* شريط العنوان الأبيض "النتائج" */}
              <div className="py-2 text-center border-b-2 border-black bg-[#232a3c]">
                <h3 className="text-base font-black text-white tracking-wide">النتائج</h3>
              </div>

              {/* صفوف اللاعبين الصفراء المطابقة للصورة 4 */}
              <div className="p-3 space-y-2 bg-[#ccd7e6] max-h-72 overflow-y-auto">
                {leaderboard.map((entry, idx) => {
                  const scoreDetail = roundResult.scoreBreakdown.find((s) => s.playerId === entry.id);
                  const roundPointsEarned = scoreDetail?.roundPoints ?? 0;
                  const isCurrent = entry.id === player?.id;

                  // نسبة شريط التقدم نحو الفوز
                  const maxTarget = totalRounds * 3 || 15;
                  const progressPct = Math.min(100, Math.max(10, (entry.score / maxTarget) * 100));

                  return (
                    <div
                      key={entry.id}
                      className="bg-[#facc15] border-2 border-black rounded-2xl p-2.5 shadow-[0_3px_0_#000] relative overflow-hidden"
                    >
                      {/* لمعة صفراء في الزاوية العلوية */}
                      <div className="absolute top-0 right-0 w-8 h-8 bg-white/30 rounded-bl-2xl pointer-events-none" />

                      <div className="flex items-center justify-between mb-1.5">
                        {/* مربع الترتيب */}
                        <div className="w-7 h-7 bg-white border-2 border-black rounded-lg flex items-center justify-center font-black text-sm text-black shadow-[0_1px_0_#000]">
                          {idx + 1}
                        </div>

                        {/* حساب النقاط: 2 +2 */}
                        <div className="text-xs font-black text-black">
                          <span className="text-sm">{entry.score}</span>
                          {roundPointsEarned > 0 && (
                            <span className="text-emerald-700 font-black mr-1 text-[11px]">
                              +{roundPointsEarned}
                            </span>
                          )}
                        </div>

                        {/* اسم اللاعب */}
                        <div className="text-xs font-black text-black truncate max-w-[100px] text-right">
                          {entry.nickname} {isCurrent && '(أنت)'}
                        </div>

                        {/* صورة شخصية اللاعب */}
                        <div className="relative">
                          <ConsolePet avatar={entry.avatar} size={38} />
                        </div>
                      </div>

                      {/* شريط التقدم البرتقالي المخطط المطابق للصورة 4 */}
                      <div className="w-full h-3.5 bg-amber-200 border-2 border-black rounded-full overflow-hidden relative shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-[#0070f3] rounded-full transition-all duration-700"
                          style={{
                            width: `${progressPct}%`,
                            backgroundImage:
                              'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 8px)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* نتائج الفرق إن كان النمط مفعلاً */}
              {roundResult.teamScores && roundResult.teamScores.length > 0 && (
                <div className="p-2.5 bg-[#1e2337] border-t-2 border-black text-center">
                  <div className="text-[11px] font-black text-arcade-cyan mb-1">
                    ترتيب الفرق الحالي ⚔️
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-black">
                    {roundResult.teamScores.map((t) => (
                      <div
                        key={t.teamId}
                        className={`py-1 px-2 rounded-xl border ${
                          t.teamId === 'red'
                            ? 'bg-red-950/40 border-red-500 text-red-300'
                            : 'bg-blue-950/40 border-blue-500 text-blue-300'
                        }`}
                      >
                        {t.teamName}: {t.score} نقطة
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* القسم السفلي: زر "المتابعة" الأزرق المطابق للصورة 4 */}
          <div className="w-full mt-auto">
            <div className="bg-[#2d354b] border-3 border-black rounded-t-3xl p-3 shadow-[0_6px_0_#000]">
              {isHost ? (
                <button
                  type="button"
                  onClick={handleNextRound}
                  className="w-full py-4 rounded-2xl bg-[#0070f3] hover:bg-[#0060df] text-white font-black text-xl border-3 border-black shadow-[0_4px_0_#0047a5] active:translate-y-1 active:shadow-[0_1px_0_#0047a5] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isLastRound ? 'التتويج النهائي 🏆' : 'المتابعة'}</span>
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
              ) : (
                <div className="w-full py-3.5 rounded-2xl bg-[#1e2337] border-2 border-black text-center text-xs font-black text-white shadow-inner">
                  في انتظار مضيف الغرفة للمتابعة للجولة القادمة... ⏳
                </div>
              )}
            </div>

            {/* كبسولة التبديل السفلية */}
            <div className="flex justify-center bg-[#1b2245] py-2">
              <div className="flex items-center bg-[#1e2337] border-2 border-black rounded-full p-1 shadow-[0_3px_0_#000]">
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('game')}
                  className={`px-6 py-1 rounded-full text-xs font-black transition-all ${
                    activeBottomTab === 'game'
                      ? 'bg-[#0070f3] text-white border border-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  لعبة
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('chat')}
                  className={`px-6 py-1 rounded-full text-xs font-black transition-all ${
                    activeBottomTab === 'chat'
                      ? 'bg-[#0070f3] text-white border border-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  دردشة
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
