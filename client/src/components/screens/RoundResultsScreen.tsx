import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle, ChevronRight, Flame } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { AudioToggle } from '../common/AudioToggle';

export const RoundResultsScreen: React.FC = () => {
  const {
    roundResult,
    leaderboard,
    isLastRound,
    timeRemaining,
    player,
    nextRound,
    currentRound,
    totalRounds,
  } = useGame();

  const isHost = player?.isHost;

  // إطلاق الـ Confetti الاحتفالي عند عرض النتائج
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981'],
    });
  }, []);

  if (!roundResult) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 font-bold">
        جارٍ احتساب نتائج الجولة... ⏳
      </div>
    );
  }

  const correctOption = roundResult.options.find((o) => o.isCorrect);
  const bluffOptions = roundResult.options.filter((o) => !o.isCorrect);

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 max-w-lg mx-auto w-full">
      {/* الشريط العلوي */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-arcade-purple/30 border border-arcade-purple text-xs font-black text-arcade-cyan">
            نتائج الجولة {currentRound} / {totalRounds}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionBadge />
          <AudioToggle />
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto pr-0.5 pb-4">
        {/* 1. بطاقة الإجابة الحقيقية الأصلية */}
        {correctOption && (
          <div className="bg-gradient-to-r from-emerald-950/80 via-arcade-card to-emerald-950/80 border-2 border-arcade-green rounded-3xl p-5 shadow-neon-green relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-black text-arcade-green uppercase tracking-wider mb-1.5">
              <CheckCircle className="w-4 h-4 text-arcade-green" />
              <span>الإجابة الصحيحة الأصلية (+1 نقطة):</span>
            </div>
            <div className="text-xl font-black text-white mb-3">
              {correctOption.text}
            </div>

            {/* من صوّت للإجابة الصحيحة؟ */}
            <div className="pt-2 border-t border-arcade-border/40">
              <span className="text-[11px] font-bold text-gray-400 block mb-1.5">
                الأذكياء الذين اكتشفوها (+1 نقطة):
              </span>
              {correctOption.votes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {correctOption.votes.map((voter) => (
                    <span
                      key={voter.id}
                      className="px-2.5 py-1 rounded-xl bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 text-xs font-black flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{voter.avatar}</span>
                      <span>{voter.nickname}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-500 italic">لم يخترها أحد! الجميع انخدعوا 🎭</span>
              )}
            </div>
          </div>
        )}

        {/* 2. كشف الخدع والأذكياء المضللين */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-300 flex items-center gap-1.5 px-1">
            <Flame className="w-4 h-4 text-arcade-pink" />
            <span>كشف الإجابات المزيفة ومن صوّت لها (+1 نقطة لكل لاعب مخدوع):</span>
          </h3>

          {bluffOptions.map((opt) => {
            const authorNames = opt.authors.map((a) => `${a.avatar} ${a.nickname}`).join(' و ');
            return (
              <div
                key={opt.id}
                className="bg-arcade-card/80 border border-arcade-border/70 rounded-2xl p-4 space-y-2 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white">{opt.text}</span>
                  <span className="text-[11px] font-bold text-arcade-pink bg-pink-950/40 px-2 py-0.5 rounded-lg border border-pink-500/30">
                    كتبها: {authorNames || 'مجهول'}
                  </span>
                </div>

                <div className="pt-1.5 border-t border-arcade-border/30 flex items-center justify-between text-xs">
                  <span className="text-gray-400">انخدعوا بها:</span>
                  {opt.votes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {opt.votes.map((v) => (
                        <span
                          key={v.id}
                          className="px-2 py-0.5 rounded-lg bg-arcade-bg/80 border border-arcade-border/50 text-gray-300 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <span>{v.avatar}</span>
                          <span>{v.nickname}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-[11px]">لم ينخدع بها أحد</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. لوحة الصدارة الحية (Live Leaderboard) */}
        <div className="bg-arcade-card/90 border border-arcade-border rounded-3xl p-5 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-black text-arcade-yellow uppercase mb-3">
            <Trophy className="w-4 h-4 text-arcade-yellow" />
            <span>لوحة المتصدرين الحالية:</span>
          </div>

          <div className="space-y-2">
            {leaderboard.map((entry, idx) => {
              const isFirst = idx === 0;
              const isCurrentUser = entry.id === player?.id;

              return (
                <div
                  key={entry.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    isCurrentUser
                      ? 'bg-arcade-purple/20 border-arcade-purple font-black shadow-neon-purple'
                      : 'bg-arcade-bg/60 border-arcade-border/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        isFirst
                          ? 'bg-arcade-yellow text-black'
                          : idx === 1
                          ? 'bg-gray-300 text-black'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-arcade-card text-gray-400'
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <span className="text-xl">{entry.avatar}</span>
                    <span className="text-xs font-bold text-white">
                      {entry.nickname} {isCurrentUser && '(أنت)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-sm font-black text-arcade-cyan font-mono">
                      {entry.score}
                    </span>
                    <span className="text-[10px] text-gray-400">نقاط</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* زر المتابعة للمضيف أو عداد الوقت */}
      <footer className="mt-auto pt-3 border-t border-arcade-border/40">
        {isHost ? (
          <button
            type="button"
            onClick={nextRound}
            className="w-full py-4 bg-gradient-to-l from-arcade-cyan via-arcade-purple to-arcade-pink text-white font-black text-base rounded-2xl shadow-neon-purple hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>{isLastRound ? 'الانتقال للتتويج النهائي 🏆' : 'مواصلة الجولة التالية 🚀'}</span>
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        ) : (
          <div className="p-3 bg-arcade-card/80 border border-arcade-border rounded-2xl text-center text-xs font-bold text-gray-400">
            الانتقال تلقائياً خلال {timeRemaining} ثانية... ⏳
          </div>
        )}
      </footer>
    </div>
  );
};
