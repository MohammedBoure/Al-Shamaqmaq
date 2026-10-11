import React from 'react';
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
  return (
    <div
      onClick={() => !disabled && onToggle()}
      className={`p-3.5 rounded-xl transition-all flex flex-col justify-between h-28 cursor-pointer select-none relative group ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-98'
      } ${
        isSelected
          ? 'border border-white/80 bg-surface-container-high hover:border-white shadow-sm'
          : 'border border-outline-variant/50 bg-surface-container hover:border-white/50 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-[18px]">menu_book</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShowInfo(topic);
            }}
            className="w-5 h-5 rounded-full flex items-center justify-center text-outline hover:text-white"
            title="معلومات عن الفئة"
          >
            <span className="material-symbols-outlined text-[14px]">info</span>
          </button>
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-white text-surface-container-lowest'
                : 'border border-outline text-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[14px] font-bold">check</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-white truncate">{topic.title}</h4>
        <span className="text-[10px] text-on-surface-variant">
          {topic.puzzleCount} بطاقة
        </span>
      </div>
    </div>
  );
};
