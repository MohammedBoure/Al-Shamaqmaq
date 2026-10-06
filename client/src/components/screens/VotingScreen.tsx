import React from 'react';
import { Check, ShieldAlert, Vote, CheckCircle2 } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { TimerBar } from '../common/TimerBar';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { AudioToggle } from '../common/AudioToggle';

// لوحة ألوان الألعاب الحيوية للبطاقات
const CARD_COLOR_STYLES = [
  'from-purple-900/40 to-purple-950/60 border-purple-500/50 hover:border-purple-400 text-purple-200 shadow-neon-purple',
  'from-cyan-900/40 to-cyan-950/60 border-cyan-500/50 hover:border-cyan-400 text-cyan-200 shadow-neon-cyan',
  'from-pink-900/40 to-pink-950/60 border-pink-500/50 hover:border-pink-400 text-pink-200 shadow-neon-pink',
  'from-amber-900/40 to-amber-950/60 border-amber-500/50 hover:border-amber-400 text-amber-200 shadow-neon-yellow',
  'from-emerald-900/40 to-emerald-950/60 border-emerald-500/50 hover:border-emerald-400 text-emerald-200 shadow-neon-green',
  'from-indigo-900/40 to-indigo-950/60 border-indigo-500/50 hover:border-indigo-400 text-indigo-200 shadow-neon-purple',
];

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
  } = useGame();

  const handleVote = (optionId: string, isSelf: boolean) => {
    if (hasVoted || isSelf) return;
    submitVote(optionId);
  };

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 max-w-lg mx-auto w-full">
      {/* الشريط العلوي */}
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-arcade-purple/30 border border-arcade-purple text-xs font-black text-arcade-cyan">
            الجولة {currentRound} / {totalRounds}
          </span>
          <span className="text-xs font-bold text-gray-300 flex items-center gap-1">
            <Vote className="w-3.5 h-3.5 text-arcade-pink" />
            <span>حلبة التصويت</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionBadge />
          <AudioToggle />
        </div>
      </header>

      {/* المؤقت الزمني */}
      <div className="mb-4">
        <TimerBar timeRemaining={timeRemaining} totalDuration={40} label="وقت التصويت" />
      </div>

      {/* السؤال المدمج في الأعلى */}
      <div className="bg-arcade-card/90 border border-arcade-border rounded-2xl p-4 shadow-md mb-4 text-center">
        <span className="text-[11px] font-bold text-gray-400 block mb-1">اللغز المطروح:</span>
        <h2 className="text-sm sm:text-base font-black text-white leading-relaxed">
          {votingPrompt || 'اختر الإجابة التي تعتقد أنها الحقيقية'}
        </h2>
      </div>

      {/* تنبيه الحالة إذا صوّت */}
      {hasVoted && (
        <div className="mb-3 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-center text-xs font-bold flex items-center justify-center gap-2 animate-bounce-subtle">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>تم تسجيل تصويتك بنجاح! في انتظار باقي اللاعبين... 🗳️</span>
        </div>
      )}

      {/* شبكة خيارات الإجابات */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
        {votingOptions.map((opt, index) => {
          const colorStyle = CARD_COLOR_STYLES[index % CARD_COLOR_STYLES.length];
          const isSelected = votedOptionId === opt.id;
          const isSelf = opt.isSelfSubmission;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={hasVoted || isSelf}
              onClick={() => handleVote(opt.id, isSelf)}
              className={`w-full p-4 rounded-2xl border-2 text-right transition-all transform flex items-center justify-between text-base font-black relative overflow-hidden active:scale-98 ${
                isSelf
                  ? 'bg-arcade-bg/80 border-gray-700/60 opacity-60 cursor-not-allowed text-gray-400'
                  : isSelected
                  ? 'bg-gradient-to-r from-arcade-green/40 to-emerald-950 border-arcade-green text-white shadow-neon-green scale-[1.02]'
                  : hasVoted
                  ? 'bg-arcade-card/50 border-arcade-border/40 opacity-70 cursor-default text-gray-300'
                  : `bg-gradient-to-r ${colorStyle} hover:scale-[1.02] cursor-pointer`
              }`}
            >
              <div className="flex-1 pl-2">
                <span className="block leading-relaxed">{opt.text}</span>
                {isSelf && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 mt-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>إجابتك الذاتية (محظور التصويت لها)</span>
                  </span>
                )}
              </div>

              {isSelected && (
                <div className="p-2 rounded-xl bg-arcade-green text-black">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
