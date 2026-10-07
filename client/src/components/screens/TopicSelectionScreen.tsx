import React, { useState } from 'react';
import { Sparkles, User, HelpCircle, X, Info } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { TimerBar } from '../common/TimerBar';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { AudioToggle } from '../common/AudioToggle';
import { CategoryCard } from '../common/CategoryCard';
import { TopicSummary } from '../../types';
import { ThemeToggle } from '../common/ThemeToggle';

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

  const [selectedTopicForInfo, setSelectedTopicForInfo] = useState<TopicSummary | null>(null);

  const isMyTurn = player?.id === currentPickerId;

  return (
    <div className="flex flex-col min-h-screen px-3 py-4 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto w-full select-none pb-8">
      {/* نافذة تفاصيل الموضوع المنبثقة عند الضغط على ℹ */}
      {selectedTopicForInfo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedTopicForInfo(null)}
        >
          <div
            className="w-full max-w-sm bg-[#1e2337] light:bg-white border-3 border-black rounded-3xl p-5 shadow-[0_8px_0_#000] text-right space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/20 light:border-black/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center border-2 border-black">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-black text-white light:text-slate-900">{selectedTopicForInfo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopicForInfo(null)}
                className="p-1 rounded-xl bg-black/40 hover:bg-black text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-300 light:text-slate-600 leading-relaxed">
              {selectedTopicForInfo.description}
            </p>

            <div className="flex items-center justify-between pt-2 text-xs font-bold text-gray-400 light:text-slate-500">
              <span>الفئة: {selectedTopicForInfo.categoryTitle || 'عام'}</span>
              <span>عدد الألغاز: {selectedTopicForInfo.puzzleCount}</span>
            </div>

            {isMyTurn && (
              <button
                type="button"
                onClick={() => {
                  selectTopic(selectedTopicForInfo.id);
                  setSelectedTopicForInfo(null);
                }}
                className="w-full py-2.5 rounded-xl arcade-btn-yellow text-black font-black text-xs border-2 border-black"
              >
                اختيار هذا الموضوع للجولة 🎯
              </button>
            )}
          </div>
        </div>
      )}

      {/* الشريط العلوي */}
      <header className="flex items-center justify-between mb-4 bg-[#1e2337]/90 light:bg-white/90 p-3 rounded-2xl border-2 border-black shadow-[0_3px_0_#000]">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#2d354b] light:bg-amber-100 border-2 border-black text-xs font-black text-arcade-cyan light:text-amber-800 shadow-[0_2px_0_#000]">
            الجولة {currentRound} من {totalRounds}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ConnectionBadge />
          <AudioToggle />
        </div>
      </header>

      {/* شريط المؤقت الزمني */}
      <div className="mb-4">
        <TimerBar timeRemaining={timeRemaining} totalDuration={30} label="وقت اختيار الموضوع" />
      </div>

      {/* بطاقة تنبيه صاحب الدور */}
      <div
        className={`p-4 rounded-3xl border-3 border-black mb-5 text-center shadow-[0_5px_0_#000] transition-all ${
          isMyTurn
            ? 'bg-gradient-to-r from-purple-900/60 to-pink-900/60 light:from-purple-100 light:to-pink-100 border-arcade-pink'
            : 'bg-[#2d354b] light:bg-white'
        }`}
      >
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-300 light:text-slate-600 mb-1">
          <User className="w-4 h-4 text-arcade-cyan light:text-purple-600" />
          <span>{isMyTurn ? 'دورك الآن!' : 'صاحب الاختيار لهذه الجولة:'}</span>
        </div>
        <div className="text-xl font-black text-white light:text-slate-900">
          {isMyTurn ? (
            <span className="text-arcade-yellow light:text-amber-600 flex items-center justify-center gap-1.5 animate-bounce-subtle">
              <Sparkles className="w-5 h-5" />
              اختر موضوع اللغز الذي تفضله!
            </span>
          ) : (
            <span>{pickerNickname || 'اللاعب المحدد'} يختار الآن...</span>
          )}
        </div>
      </div>

      {/* شبكة بطاقات المواضيع الآركيد */}
      <div className="flex-1 overflow-y-auto pr-0.5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {allowedTopics.map((topic) => {
            return (
              <CategoryCard
                key={topic.id}
                topic={topic}
                isSelected={false}
                disabled={!isMyTurn}
                onToggle={() => isMyTurn && selectTopic(topic.id)}
                onShowInfo={(t) => setSelectedTopicForInfo(t)}
              />
            );
          })}
        </div>

        {allowedTopics.length === 0 && (
          <div className="text-center py-12 text-gray-400 light:text-slate-400 text-xs">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <span>لا توجد مواضيع محددة</span>
          </div>
        )}
      </div>
    </div>
  );
};
