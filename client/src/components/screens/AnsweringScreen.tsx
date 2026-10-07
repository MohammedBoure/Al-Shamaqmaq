import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, LogOut, Volume2, VolumeX, Sparkles, CheckCircle2 } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ConsolePet } from '../common/ConsolePet';
import { GameTopHeader } from '../common/GameTopHeader';

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
  } = useGame();

  const [inputText, setInputText] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'game' | 'chat'>('game');
  const [liked, setLiked] = useState<boolean | null>(null);

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

  const handleShare = async () => {
    audio.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'لعبة كلك! - سؤال الجولة',
          text: `السؤال: ${currentPuzzle?.prompt}`,
        });
      } catch (_) {}
    }
  };

  const toggleReaction = (isLike: boolean) => {
    audio.playClick();
    haptic.triggerHaptic('light');
    setLiked((prev) => (prev === isLike ? null : isLike));
  };

  const isWaitingForOthers = hasSubmittedInitial && (!requiresBluff || hasSubmittedBluff);
  const isEnteringBluff = hasSubmittedInitial && requiresBluff && !hasSubmittedBluff;

  return (
    <div className="flex flex-col min-h-screen bg-[#1b2245] light:bg-[#f4f7fb] bg-arcade-pattern px-3 pt-3 max-w-md md:max-w-3xl lg:max-w-4xl mx-auto w-full select-none justify-between relative pb-1">
      {/* نافذة القائمة السريعة ☰ */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-start justify-start p-4 pt-16 backdrop-blur-xs"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-56 bg-[#1e2337] light:bg-white border-3 border-black rounded-2xl p-3 shadow-[0_6px_0_#000] space-y-2 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-black text-gray-400 light:text-slate-500 px-2 pb-1 border-b border-white/10 light:border-black/10">
              خيارات اللعبة
            </div>
            <button
              type="button"
              onClick={() => {
                audio.toggleMute();
                setIsMenuOpen(false);
              }}
              className="w-full text-right p-2 rounded-xl hover:bg-white/10 light:hover:bg-black/5 text-xs font-bold text-white light:text-slate-900 flex items-center gap-2"
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
              className="w-full text-right p-2 rounded-xl hover:bg-rose-950/40 light:hover:bg-rose-100 text-xs font-bold text-rose-400 light:text-rose-600 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>مغادرة الجلسة</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. الشريط العلوي المتزامن (1/10 • المؤقت الدائري • 0:50) */}
      <GameTopHeader
        currentRound={currentRound}
        totalRounds={totalRounds}
        timeRemaining={timeRemaining}
        centerType="timer"
        onMenuClick={() => setIsMenuOpen(true)}
        onShareClick={handleShare}
      />

      {/* 2. بطاقة السؤال البنفسجية المطابقة للصورة */}
      <div className="relative mt-2 mb-2 w-full">
        {/* شارة الفئة العلوية المثبتة في أعلى يمين البطاقة */}
        <div className="absolute -top-3.5 right-4 z-20 flex items-center gap-1">
          <div className="bg-[#1e2337] light:bg-white px-3 py-1 rounded-lg border-2 border-black shadow-[0_2px_0_#000] text-[11px] font-black text-white light:text-slate-900">
            {currentTopicTitle || 'الفلك و الفضاء'}
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#8b5cf6] border-2 border-black flex items-center justify-center text-white shadow-[0_2px_0_#000]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* جسم البطاقة البنفسجية بنمط النقاط الدائرية */}
        <div className="bg-[#8b5cf6] border-3 border-black rounded-3xl p-5 pt-8 md:p-8 md:pt-10 shadow-[0_6px_0_#4c1d95] relative overflow-hidden text-center min-h-[140px] md:min-h-[180px] flex flex-col justify-center">
          {/* نمط النقاط البنفسجية الخلفي */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* صورة اللغز إن كانت متوفرة */}
          {currentPuzzle?.image_url && (
            <div className="mb-3 rounded-2xl overflow-hidden border-2 border-black max-h-48 bg-black/40 flex items-center justify-center">
              <img
                src={currentPuzzle.image_url}
                alt="صورة السؤال"
                className="max-h-48 w-full object-contain"
              />
            </div>
          )}

          {/* نص السؤال بالخط العربي العريض والمحدد بحد أسود */}
          <h2 className="text-base sm:text-lg md:text-2xl font-black text-white text-stroke-arcade leading-relaxed relative z-10 px-2 drop-shadow-[0_2px_0_#000]">
            {currentPuzzle?.prompt || 'ما هي قوة الجذب الكونية التي تنشأ بين جميع أجزاء المادة؟'}
          </h2>
        </div>

        {/* كبسولة التفاعل والإعجاب [ 👍 | 👎 ] أسفل البطاقة على اليمين */}
        <div className="flex justify-end mt-2 pr-2">
          <div className="bg-[#1e2337] light:bg-white border-2 border-black rounded-2xl p-1 flex items-center gap-1 shadow-[0_3px_0_#000]">
            <button
              type="button"
              onClick={() => toggleReaction(true)}
              className={`p-1.5 rounded-xl transition-all ${
                liked === true ? 'bg-emerald-500 text-white' : 'text-gray-300 light:text-slate-600 hover:text-white'
              }`}
              title="إعجاب بالسؤال"
            >
              <ThumbsUp className="w-4 h-4 fill-current" />
            </button>
            <div className="w-px h-4 bg-black/60 light:bg-slate-300" />
            <button
              type="button"
              onClick={() => toggleReaction(false)}
              className={`p-1.5 rounded-xl transition-all ${
                liked === false ? 'bg-rose-500 text-white' : 'text-gray-300 light:text-slate-600 hover:text-white'
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
          {/* شارة النقاط فوق رأس الكائن */}
          <span className="text-[11px] md:text-xs font-black font-mono text-black bg-white px-2.5 py-0.5 rounded-md border border-black shadow-[0_1px_0_#000] -mb-1 z-10">
            {player?.score ?? 0}
          </span>
          <div className="animate-bounce-subtle">
            <ConsolePet avatar={player?.avatar} size={76} />
          </div>
          <span className="text-xs md:text-sm font-black text-white light:text-slate-900 text-stroke-sm mt-0.5">
            {player?.nickname || 'mouh'}
          </span>
        </div>
      </div>

      {/* 4. قسم الإدخال والأزرار السفلي الأزرق */}
      <div className="w-full">
        {/* تنبيه الإجابة الصحيحة السرية (إذا كتب الإجابة الحقيقية ويطلب منه كتابة خدعة) */}
        {isEnteringBluff && (
          <div className="mb-2 p-2.5 rounded-2xl bg-emerald-950/90 light:bg-emerald-100 border-2 border-emerald-500 text-center animate-bounce-subtle">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 light:text-emerald-700 text-xs font-black mb-0.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>إجابتك صحيحة 100%! 🤫</span>
            </div>
            <p className="text-[11px] md:text-xs text-gray-200 light:text-slate-800 font-bold">
              اكتب الآن <span className="text-arcade-pink font-black">إجابة مزيفة مقنعة</span> لتخدع بها باقي اللاعبين وتكسب نقاطاً!
            </p>
          </div>
        )}

        {/* الحاوية الزرقاء لإدخال الإجابة */}
        <div className="bg-[#0070f3] border-3 border-black rounded-t-3xl p-3 md:p-5 pt-3.5 shadow-[0_6px_0_#0047a5]">
          {isWaitingForOthers ? (
            <div className="bg-white border-2 border-black rounded-2xl p-4 md:p-6 text-center space-y-1.5 shadow-inner">
              <div className="text-2xl md:text-3xl animate-bounce-subtle">🎭</div>
              <div className="text-sm md:text-base font-black text-black">تم تسجيل إجابتك بنجاح!</div>
              <div className="text-xs md:text-sm font-bold text-gray-500">
                في انتظار باقي اللاعبين للانتقال لمرحلة التصويت... ⏳
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5 max-w-xl mx-auto">
              {/* حقل الإدخال الأبيض المستطيل بزوايا دائرية */}
              <div className="relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isEnteringBluff
                      ? 'اكتب إجابة مزيفة لتضليل باقي اللاعبين'
                      : 'اكتب إجابة تخدع بها باقي اللاعبين'
                  }
                  maxLength={70}
                  required
                  autoFocus
                  className="w-full py-3.5 px-4 bg-white border-3 border-black rounded-2xl text-center text-sm sm:text-base md:text-lg font-black text-black placeholder:text-gray-400 focus:outline-none shadow-inner"
                />
              </div>

              {/* زر أجب الرمادي/الكحلي ثلاثي الأبعاد */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`w-full py-3.5 rounded-2xl font-black text-lg border-3 border-black transition-all flex items-center justify-center shadow-[0_4px_0_#1a202c] active:translate-y-1 active:shadow-[0_1px_0_#1a202c] ${
                  inputText.trim()
                    ? 'bg-[#2d354b] hover:bg-[#38435f] text-white cursor-pointer'
                    : 'bg-[#2d354b]/70 text-gray-400 cursor-not-allowed opacity-80'
                }`}
              >
                <span>أجب (Enter ↵)</span>
              </button>
            </form>
          )}
        </div>

        {/* 5. كبسولة التبديل السفلية بين اللعبة والدردشة */}
        <div className="flex justify-center bg-[#1b2245] light:bg-[#f4f7fb] py-2">
          <div className="flex items-center bg-[#1e2337] light:bg-white border-2 border-black rounded-full p-1 shadow-[0_3px_0_#000]">
            <button
              type="button"
              onClick={() => setActiveBottomTab('game')}
              className={`px-6 py-1 rounded-full text-xs font-black transition-all ${
                activeBottomTab === 'game'
                  ? 'bg-[#0070f3] text-white border border-black shadow-sm'
                  : 'text-gray-400 light:text-slate-600 hover:text-white'
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
                  : 'text-gray-400 light:text-slate-600 hover:text-white'
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
