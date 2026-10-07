import React from 'react';
import { Check, Vote, CheckCircle2 } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { TimerBar } from '../common/TimerBar';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { AudioToggle } from '../common/AudioToggle';
import { ConsolePet } from '../common/ConsolePet';

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
    player,
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
      <div className="mb-3">
        <TimerBar timeRemaining={timeRemaining} totalDuration={40} label="وقت التصويت" />
      </div>

      {/* السؤال المدمج في الأعلى */}
      <div className="bg-[#8b5cf6] border-3 border-black rounded-3xl p-5 shadow-[0_5px_0_#5b21b6] mb-3 text-center">
        <span className="text-xs font-bold text-purple-200 block mb-1">اللغز المطروح:</span>
        <h2 className="text-base sm:text-lg font-black text-stroke-arcade leading-relaxed">
          {votingPrompt || 'اختر الإجابة التي تعتقد أنها الحقيقية'}
        </h2>
      </div>

      {/* تنبيه الحالة إذا صوّت */}
      {hasVoted && (
        <div className="mb-2 p-2.5 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-300 text-center text-xs font-bold flex items-center justify-center gap-2 animate-bounce-subtle">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>تم تسجيل تصويتك بنجاح! في انتظار باقي اللاعبين... 🗳️</span>
        </div>
      )}

      {/* صورة واسم شخصية اللاعب في المنتصف تطفو بحركة كرتونية */}
      <div className="flex flex-col items-center justify-center my-auto py-2">
        <div className="relative flex flex-col items-center animate-bounce-subtle">
          <ConsolePet avatar={player?.avatar} size={70} />
          <span className="text-xs font-black text-stroke-sm mt-0.5">
            {player?.nickname || 'أنت'}
          </span>
        </div>
      </div>

      {/* تبويب الحاوية "اختر إجابة" والخيارات */}
      <div className="w-full mt-auto">
        <div className="flex justify-center -mb-1">
          <div className="px-5 py-1.5 bg-[#0080ff] border-t-3 border-x-3 border-black rounded-t-2xl font-black text-xs text-white text-stroke-sm">
            اختر إجابة
          </div>
        </div>

        <div className="bg-[#0080ff] border-3 border-black rounded-3xl p-3 shadow-2xl space-y-2.5">
          {votingOptions.map((opt) => {
            const isSelected = votedOptionId === opt.id;
            const isSelf = opt.isSelfSubmission;

            return (
              <button
                key={opt.id}
                type="button"
                disabled={hasVoted || isSelf}
                onClick={() => handleVote(opt.id, isSelf)}
                className={`w-full p-3.5 rounded-2xl border-3 border-black text-center transition-all transform flex items-center justify-between text-base font-black relative active:scale-98 ${
                  isSelf
                    ? 'bg-[#9fb3c8] text-gray-700 opacity-80 cursor-not-allowed shadow-[0_4px_0_#627d98]'
                    : isSelected
                    ? 'bg-[#00e676] text-black shadow-[0_4px_0_#00a352] ring-3 ring-yellow-300 scale-[1.02]'
                    : hasVoted
                    ? 'bg-[#e2e8f0] text-gray-600 opacity-70 cursor-default shadow-[0_3px_0_#94a3b8]'
                    : 'bg-white hover:bg-[#f0f9ff] text-black shadow-[0_4px_0_#cbd5e1] hover:scale-[1.01] cursor-pointer'
                }`}
              >
                {/* وسم "إجابتك" عند إجابة اللاعب الذاتية */}
                {isSelf && (
                  <span className="absolute top-1 right-2 px-1.5 py-0.2 bg-black text-white text-[9px] font-black rounded-md">
                    إجابتك
                  </span>
                )}

                <span className="w-full text-center text-sm sm:text-base font-black text-stroke-sm text-black">
                  {opt.text}
                </span>

                {isSelected && (
                  <div className="absolute left-3 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
