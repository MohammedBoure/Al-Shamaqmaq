import React, { useState } from 'react';
import { Send, EyeOff, CheckCircle2, Clock, Flame } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { TimerBar } from '../common/TimerBar';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { AudioToggle } from '../common/AudioToggle';

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
  } = useGame();

  const [initialInput, setInitialInput] = useState<string>('');
  const [bluffInput, setBluffInput] = useState<string>('');

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialInput.trim()) return;
    submitAnswer(initialInput.trim());
  };

  const handleBluffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bluffInput.trim()) return;
    submitBluff(bluffInput.trim());
  };

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 max-w-lg mx-auto w-full">
      {/* الشريط العلوي */}
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-arcade-purple/30 border border-arcade-purple text-xs font-black text-arcade-cyan">
            الجولة {currentRound} / {totalRounds}
          </span>
          <span className="text-xs font-bold text-gray-400 bg-arcade-card/60 px-2.5 py-1 rounded-xl border border-arcade-border/40 truncate max-w-[150px]">
            {currentTopicTitle || 'الموضوع'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionBadge />
          <AudioToggle />
        </div>
      </header>

      {/* المؤقت الزمني */}
      <div className="mb-4">
        <TimerBar timeRemaining={timeRemaining} totalDuration={60} label="وقت الإجابة والخداع" />
      </div>

      {/* بطاقة السؤال / اللغز */}
      <div className="bg-gradient-to-b from-arcade-card to-arcade-bg border-2 border-arcade-border/80 rounded-3xl p-5 shadow-xl mb-4 relative overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-black text-arcade-pink uppercase tracking-wider mb-2">
          <Flame className="w-4 h-4 text-arcade-pink" />
          <span>اللغز المطلوب:</span>
        </div>

        {/* صورة السؤال إن وجدت */}
        {currentPuzzle?.image_url && (
          <div className="mb-3 rounded-2xl overflow-hidden border border-arcade-border/60 max-h-48 bg-black/40 flex items-center justify-center">
            <img
              src={currentPuzzle.image_url}
              alt="صورة اللغز"
              className="max-h-48 w-full object-contain"
            />
          </div>
        )}

        <h2 className="text-lg sm:text-xl font-black text-white leading-relaxed">
          {currentPuzzle?.prompt || 'جارٍ تحميل نص اللغز...'}
        </h2>
      </div>

      {/* مرحلة تقديم الإجابة الأولية */}
      {!hasSubmittedInitial && (
        <form onSubmit={handleInitialSubmit} className="space-y-3 mt-auto pt-2">
          <label className="block text-xs font-bold text-gray-300">
            اكتب إجابتك الحرة هنا:
          </label>
          <div className="relative">
            <input
              type="text"
              value={initialInput}
              onChange={(e) => setInitialInput(e.target.value)}
              placeholder="اكتب إجابتك الحقيقية هنا..."
              maxLength={80}
              required
              autoFocus
              className="w-full px-4 py-4 bg-arcade-card/90 border-2 border-arcade-border rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-arcade-cyan focus:ring-4 focus:ring-arcade-cyan/20 text-base font-bold shadow-inner transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!initialInput.trim()}
            className="w-full py-4 bg-gradient-to-l from-arcade-cyan via-arcade-purple to-arcade-pink text-white font-black text-base rounded-2xl shadow-neon-cyan hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Send className="w-5 h-5" />
            <span>إرسال الإجابة</span>
          </button>
        </form>
      )}

      {/* الحالة الخاصة 1: إذا كانت الإجابة صحيحة ويُطلب منه صياغة خدعة كاذبة ومقنعة */}
      {hasSubmittedInitial && requiresBluff && !hasSubmittedBluff && (
        <div className="bg-gradient-to-tr from-purple-950/80 via-arcade-card to-pink-950/80 border-2 border-arcade-purple rounded-3xl p-5 shadow-neon-purple space-y-4 animate-glow mt-auto">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-arcade-purple/30 border border-arcade-purple text-2xl animate-bounce-subtle">
              🤫
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-arcade-green text-sm font-black mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>إجابتك صحيحة! لكن لا تكشف سرك...</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                اكتب الآن <span className="text-arcade-pink font-black">إجابة كاذبة ومقنعة</span> لتخدع بها باقي اللاعبين وتكسب (+1 نقطة) عن كل شخص يصوّت لخدعتك!
              </p>
            </div>
          </div>

          <form onSubmit={handleBluffSubmit} className="space-y-3">
            <input
              type="text"
              value={bluffInput}
              onChange={(e) => setBluffInput(e.target.value)}
              placeholder="اكتب إجابة مزيفة تبدو حقيقية جداً..."
              maxLength={80}
              required
              autoFocus
              className="w-full px-4 py-3.5 bg-arcade-bg border-2 border-arcade-pink/60 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-arcade-pink focus:ring-4 focus:ring-arcade-pink/20 text-sm font-bold transition-all"
            />

            <button
              type="submit"
              disabled={!bluffInput.trim()}
              className="w-full py-4 bg-gradient-to-l from-arcade-pink to-arcade-purple text-white font-black text-sm rounded-2xl shadow-neon-pink hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <EyeOff className="w-4 h-4" />
              <span>إرسال الخدعة لتضليل الآخرين 🎭</span>
            </button>
          </form>
        </div>
      )}

      {/* الحالة العادية 2: عند اكتمال الإجابة (سواء أخطأ فاعتُمدت، أو أنهى خدعته) */}
      {hasSubmittedInitial && (!requiresBluff || hasSubmittedBluff) && (
        <div className="bg-arcade-card/90 border border-arcade-border rounded-3xl p-6 text-center space-y-3 mt-auto shadow-lg animate-pulse">
          <div className="text-4xl animate-bounce-subtle">🎭</div>
          <h3 className="text-base font-black text-white">
            {requiresBluff
              ? 'تم تسجيل خدعتك بنجاح!'
              : 'تم تسجيل إجابتك كإجابة مضللة!'}
          </h3>
          <p className="text-xs text-gray-400 font-semibold leading-relaxed">
            انتظر حتى ينتهي باقي المتسابقين من الإجابة والخداع... سننتقل لمرحلة التصويت قريباً! ⏳
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-arcade-cyan font-bold pt-2">
            <Clock className="w-4 h-4 animate-spin" />
            <span>في انتظار اكتمال الجميع</span>
          </div>
        </div>
      )}
    </div>
  );
};
