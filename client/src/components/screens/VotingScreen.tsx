import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, LogOut, Volume2, VolumeX, Sparkles, Check } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ConsolePet } from '../common/ConsolePet';
import { GameTopHeader } from '../common/GameTopHeader';

export const VotingScreen: React.FC = () => {
  const {
    votingPrompt,
    votingOptions,
    timeRemaining,
    hasVoted,
    votedOptionId,
    submitVote,
    currentRound,
    totalRounds,
    currentTopicTitle,
    player,
    audio,
    haptic,
    leaveRoom,
  } = useGame();

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'game' | 'chat'>('game');
  const [liked, setLiked] = useState<boolean | null>(null);

  const handleVote = (optionId: string, isSelf: boolean) => {
    if (hasVoted || isSelf) return;
    audio.playClick();
    haptic.triggerHaptic('medium');
    submitVote(optionId);
  };

  const handleShare = async () => {
    audio.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'لعبة كلك! - مرحلة التصويت',
          text: `أي هذه الإجابات هي الحقيقية برأيك؟: ${votingPrompt}`,
        });
      } catch (_) {}
    }
  };

  const toggleReaction = (isLike: boolean) => {
    audio.playClick();
    haptic.triggerHaptic('light');
    setLiked((prev) => (prev === isLike ? null : isLike));
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

      {/* 1. الشريط العلوي المتزامن (1/10 • المؤقت الدائري • 0:56) */}
      <GameTopHeader
        currentRound={currentRound}
        totalRounds={totalRounds}
        timeRemaining={timeRemaining}
        centerType="timer"
        onMenuClick={() => setIsMenuOpen(true)}
        onShareClick={handleShare}
      />

      {/* 2. بطاقة السؤال البنفسجية المطابقة للصورة */}
      <div className="relative mt-2 mb-2">
        {/* شارة الفئة العلوية */}
        <div className="absolute -top-3.5 right-4 z-20 flex items-center gap-1">
          <div className="bg-[#1e2337] px-3 py-1 rounded-lg border-2 border-black shadow-[0_2px_0_#000] text-[11px] font-black text-white">
            {currentTopicTitle || 'الفلك و الفضاء'}
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#8b5cf6] border-2 border-black flex items-center justify-center text-white shadow-[0_2px_0_#000]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* جسم البطاقة البنفسجية بنمط النقاط */}
        <div className="bg-[#8b5cf6] border-3 border-black rounded-3xl p-5 pt-7 shadow-[0_6px_0_#4c1d95] relative overflow-hidden text-center min-h-[140px] flex flex-col justify-center">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)',
              backgroundSize: '16px 16px',
            }}
          />

          <h2 className="text-base sm:text-lg font-black text-white text-stroke-arcade leading-relaxed relative z-10 px-2 drop-shadow-[0_2px_0_#000]">
            {votingPrompt || 'ما هي قوة الجذب الكونية التي تنشأ بين جميع أجزاء المادة؟'}
          </h2>
        </div>

        {/* كبسولة التفاعل والإعجاب [ 👍 | 👎 ] */}
        <div className="flex justify-end mt-2 pr-2">
          <div className="bg-[#1e2337] border-2 border-black rounded-2xl p-1 flex items-center gap-1 shadow-[0_3px_0_#000]">
            <button
              type="button"
              onClick={() => toggleReaction(true)}
              className={`p-1.5 rounded-xl transition-all ${
                liked === true ? 'bg-emerald-500 text-white' : 'text-gray-300 hover:text-white'
              }`}
              title="إعجاب بالسؤال"
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

      {/* 3. كائن وشخصية اللاعب في المنتصف مع شارة النقاط في الأعلى والاسم بالأسفل */}
      <div className="flex flex-col items-center justify-center my-auto py-2">
        <div className="relative flex flex-col items-center">
          <span className="text-[11px] font-black font-mono text-black bg-white px-2 py-0.5 rounded-md border border-black shadow-[0_1px_0_#000] -mb-1 z-10">
            {player?.score ?? 0}
          </span>
          <div className="animate-bounce-subtle">
            <ConsolePet avatar={player?.avatar} size={70} />
          </div>
          <span className="text-xs font-black text-white text-stroke-sm mt-0.5">
            {player?.nickname || 'mouh'}
          </span>
        </div>
      </div>

      {/* 4. قسم خيارات التصويت السفلي المطابق تماماً للصورة 2 */}
      <div className="w-full">
        {/* اللسان العلوي الشبه منحرف "اختر إجابة" */}
        <div className="flex justify-center -mb-2 relative z-10">
          <div className="bg-white border-2 border-black rounded-t-xl px-6 py-1 shadow-[0_2px_0_#000]">
            <span className="text-xs font-black text-black">اختر إجابة</span>
          </div>
        </div>

        {/* الحاوية الزرقاء للخيارات */}
        <div className="bg-[#0070f3] border-3 border-black rounded-t-3xl p-3.5 pt-5 shadow-[0_6px_0_#0047a5]">
          <div className="grid grid-cols-2 gap-2.5">
            {votingOptions.map((opt) => {
              const isSelected = votedOptionId === opt.id;
              const isSelf = opt.isSelfSubmission;

              if (isSelf) {
                return (
                  <div key={opt.id} className="relative">
                    {/* شارة "إجابتك" السوداء المثبتة فوق الخيار المعطل */}
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 bg-black text-white px-2 py-0.2 rounded border border-white/50 text-[10px] font-black shadow-sm">
                      إجابتك
                    </div>
                    <button
                      type="button"
                      disabled
                      className="w-full py-4 px-2 rounded-2xl bg-[#9cb3cf] border-2 border-black text-[#5a6e85] font-black text-sm sm:text-base cursor-not-allowed opacity-90 shadow-[0_3px_0_#627d98] truncate"
                    >
                      {opt.text}
                    </button>
                  </div>
                );
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={hasVoted}
                  onClick={() => handleVote(opt.id, false)}
                  className={`w-full py-4 px-2 rounded-2xl border-3 border-black font-black text-sm sm:text-base transition-all transform flex items-center justify-center relative active:scale-95 shadow-[0_4px_0_#000] ${
                    isSelected
                      ? 'bg-[#10b981] text-white shadow-[0_4px_0_#047857] ring-2 ring-white scale-[1.02]'
                      : hasVoted
                      ? 'bg-gray-200 text-gray-500 cursor-default opacity-80'
                      : 'bg-white hover:bg-slate-100 text-black cursor-pointer hover:scale-[1.02]'
                  }`}
                >
                  <span className="truncate">{opt.text}</span>
                  {isSelected && (
                    <div className="absolute left-2 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {hasVoted && (
            <div className="mt-2.5 text-center text-xs font-black text-white/90">
              تم تسجيل تصويتك! في انتظار بقية اللاعبين... 🗳️
            </div>
          )}
        </div>

        {/* 5. كبسولة التبديل السفلية بين اللعبة والدردشة */}
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
    </div>
  );
};
