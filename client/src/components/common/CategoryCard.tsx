import React from 'react';
import { Info } from 'lucide-react';
import { TopicSummary } from '../../types';

interface CategoryCardProps {
  topic: TopicSummary;
  isSelected: boolean;
  onToggle: () => void;
  onShowInfo: (topic: TopicSummary) => void;
  disabled?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  topic,
  isSelected,
  onToggle,
  onShowInfo,
  disabled = false,
}) => {
  const coverSrc = topic.cover_image || `/covers/${topic.id}.svg`;

  return (
    <div
      onClick={() => !disabled && onToggle()}
      className={`relative group rounded-2xl border-2 border-black overflow-hidden aspect-[3/4] flex flex-col justify-between transition-all select-none shadow-[0_4px_0_#000] ${
        disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-95 hover:scale-[1.02]'
      } ${
        isSelected
          ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#1e2337]'
          : 'opacity-90 hover:opacity-100'
      }`}
    >
      {/* صورة الغلاف */}
      <img
        src={coverSrc}
        alt={topic.title}
        onError={(e) => {
          // في حال عدم توفر الصورة نستخدم خلفية بديلة
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
        className="absolute inset-0 w-full h-full object-cover -z-10 bg-slate-900"
      />

      {/* تدرج لوني لضمان وضوح النصوص */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 -z-5 pointer-events-none" />

      {/* زر المعلومات العلوي (ℹ) */}
      <div className="p-1.5 flex justify-start">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onShowInfo(topic);
          }}
          className="w-5 h-5 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/40 shadow-sm transition-transform active:scale-90"
          title="معلومات عن الفئة"
        >
          <Info className="w-3 h-3 text-white" />
        </button>
      </div>

      {/* شارة VIP السفلية إذا كانت متوفرة */}
      {topic.is_vip && (
        <div className="absolute bottom-2.5 right-2 z-10">
          <span className="bg-[#facc15] text-black font-black text-[9px] px-1.5 py-0.5 rounded border border-black shadow-[0_1px_0_#000] tracking-wider uppercase">
            VIP
          </span>
        </div>
      )}

      {/* العنوان العربي ثلاثي الأبعاد */}
      <div className="p-2 pb-2.5 text-center mt-auto z-10">
        <h4 className="text-xs sm:text-sm font-black text-white text-stroke-arcade tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate px-1">
          {topic.title}
        </h4>
      </div>

      {/* خط التحديد الأخضر في الأسفل المطابق للتصميم */}
      {isSelected && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#10b981] shadow-[0_0_8px_#10b981] z-20" />
      )}
    </div>
  );
};
