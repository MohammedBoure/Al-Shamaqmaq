import React from 'react';
import { Menu, Upload, Check, Crown } from 'lucide-react';

interface GameTopHeaderProps {
  currentRound: number;
  totalRounds: number;
  timeRemaining?: number;
  centerType?: 'timer' | 'correct' | 'crown';
  onMenuClick?: () => void;
  onShareClick?: () => void;
}

export const GameTopHeader: React.FC<GameTopHeaderProps> = ({
  currentRound,
  totalRounds,
  timeRemaining = 60,
  centerType = 'timer',
  onMenuClick,
  onShareClick,
}) => {
  // تنسيق الثواني على شكل دقيقة:ثواني (0:50)
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <header className="flex items-center justify-between mb-4 w-full select-none">
      {/* زر القائمة الأيسر ☰ */}
      <button
        type="button"
        onClick={onMenuClick}
        className="w-11 h-11 bg-[#1e2337] hover:bg-[#282f49] text-white border-2 border-black rounded-2xl flex items-center justify-center shadow-[0_3px_0_#000] active:translate-y-0.5 transition-all"
        title="القائمة"
      >
        <Menu className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* العداد والمؤشر الأوسط المجنح المطابق للصور 1/10 [أيقونة] 0:50 */}
      <div className="relative flex items-center justify-center">
        {/* الجناح الأيمن والأيسر للحاوية */}
        <div className="flex items-center bg-[#2d354b] border-2 border-black rounded-xl overflow-hidden shadow-[0_3px_0_#000]">
          {/* رقم الجولة (يسار) */}
          <div className="px-3.5 py-1 text-xs font-black text-white tracking-wider border-l border-black/40 min-w-[50px] text-center">
            {currentRound}/{totalRounds}
          </div>

          {/* مسافة فارغة للأيقونة الدائرية في المنتصف */}
          <div className="w-12 h-6" />

          {/* الوقت المتبقي (يمين) */}
          <div className="px-3.5 py-1 text-xs font-mono font-black text-white tracking-wider border-r border-black/40 min-w-[50px] text-center">
            {centerType === 'timer' ? formattedTime : centerType === 'crown' ? 'متصدر' : 'صحيح'}
          </div>
        </div>

        {/* الأيقونة الدائرية البارزة في المنتصف */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 z-10">
          {centerType === 'timer' && (
            <div className="w-13 h-13 rounded-full bg-[#0070f3] border-3 border-black shadow-[0_3px_0_#0047a5] flex items-center justify-center relative animate-pulse-subtle">
              {/* عجلة المؤقت الزمني ذات الفتحات الزرقاء المطابقة للصورة */}
              <div className="w-9 h-9 rounded-full bg-[#0284c7] border-2 border-white/60 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-white/70" />
                  <div className="h-full w-0.5 bg-white/70 absolute" />
                  <div className="w-full h-0.5 bg-white/70 transform rotate-45 absolute" />
                  <div className="w-full h-0.5 bg-white/70 transform -rotate-45 absolute" />
                </div>
                <div className="w-3.5 h-3.5 rounded-full bg-cyan-200 border border-white z-10 shadow-[0_0_6px_#38bdf8]" />
              </div>
            </div>
          )}

          {centerType === 'correct' && (
            <div className="w-13 h-13 rounded-full bg-[#10b981] border-3 border-black shadow-[0_3px_0_#047857] flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-[#059669] border-2 border-emerald-200 flex items-center justify-center text-white">
                <Check className="w-6 h-6 stroke-[3.5]" />
              </div>
            </div>
          )}

          {centerType === 'crown' && (
            <div className="w-13 h-13 rounded-full bg-[#f59e0b] border-3 border-black shadow-[0_3px_0_#b45309] flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-[#d97706] border-2 border-amber-200 flex items-center justify-center text-white">
                <Crown className="w-5 h-5 fill-white stroke-[2.5]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* زر المشاركة الأيمن [↑] */}
      <button
        type="button"
        onClick={onShareClick}
        className="w-11 h-11 bg-[#1e2337] hover:bg-[#282f49] text-white border-2 border-black rounded-2xl flex items-center justify-center shadow-[0_3px_0_#000] active:translate-y-0.5 transition-all"
        title="مشاركة"
      >
        <Upload className="w-5 h-5 stroke-[2.5]" />
      </button>
    </header>
  );
};
