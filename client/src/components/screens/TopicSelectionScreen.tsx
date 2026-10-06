import React from 'react';
import { BookOpen, Sparkles, User, HelpCircle } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { TimerBar } from '../common/TimerBar';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { AudioToggle } from '../common/AudioToggle';

export const TopicSelectionScreen: React.FC = () => {
  const {
    allowedTopics,
    currentPickerId,
    pickerNickname,
    player,
    timeRemaining,
    selectTopic,
    currentRound,
    totalRounds,
  } = useGame();

  const isMyTurn = player?.id === currentPickerId;

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 max-w-lg mx-auto w-full">
      {/* الشريط العلوي */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-arcade-purple/30 border border-arcade-purple text-xs font-black text-arcade-cyan">
            الجولة {currentRound} من {totalRounds}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionBadge />
          <AudioToggle />
        </div>
      </header>

      {/* شريط المؤقت */}
      <div className="mb-6">
        <TimerBar timeRemaining={timeRemaining} totalDuration={30} label="وقت اختيار الموضوع" />
      </div>

      {/* بطاقة تنبيه صاحب الدور */}
      <div
        className={`p-4 rounded-3xl border mb-6 text-center shadow-lg transition-all ${
          isMyTurn
            ? 'bg-gradient-to-r from-arcade-purple/30 to-arcade-pink/30 border-arcade-pink shadow-neon-pink'
            : 'bg-arcade-card/80 border-arcade-border'
        }`}
      >
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-300 mb-1">
          <User className="w-4 h-4 text-arcade-cyan" />
          <span>{isMyTurn ? 'دورك الآن!' : 'صاحب الاختيار لهذه الجولة:'}</span>
        </div>
        <div className="text-xl font-black text-white">
          {isMyTurn ? (
            <span className="text-arcade-yellow flex items-center justify-center gap-1.5 animate-bounce-subtle">
              <Sparkles className="w-5 h-5 text-arcade-yellow" />
              اختر موضوع اللغز الذي تفضله!
            </span>
          ) : (
            <span>{pickerNickname || 'اللاعب المحدد'} يختار الآن...</span>
          )}
        </div>
      </div>

      {/* قائمة بطاقات المواضيع */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
        {allowedTopics.map((topic) => {
          return (
            <button
              key={topic.id}
              type="button"
              disabled={!isMyTurn}
              onClick={() => isMyTurn && selectTopic(topic.id)}
              className={`w-full p-5 rounded-2xl border text-right transition-all transform flex flex-col gap-1.5 relative overflow-hidden ${
                isMyTurn
                  ? 'bg-arcade-card hover:bg-arcade-cardHover border-arcade-purple/60 hover:border-arcade-cyan hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-neon-cyan cursor-pointer'
                  : 'bg-arcade-card/60 border-arcade-border/40 opacity-90 cursor-default'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-arcade-purple/20 border border-arcade-purple/40 text-arcade-cyan">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-white">{topic.title}</h3>
                </div>
                <span className="text-xs font-mono text-gray-400 bg-arcade-bg/60 px-2 py-1 rounded-lg border border-arcade-border/40">
                  {topic.puzzleCount} ألغاز
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{topic.description}</p>
            </button>
          );
        })}

        {allowedTopics.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-xs">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <span>لا توجد مواضيع محددة</span>
          </div>
        )}
      </div>
    </div>
  );
};
