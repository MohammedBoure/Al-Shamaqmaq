import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useScale } from '../../context/ScaleContext';
import { useGame } from '../../context/GameContext';

interface GameScaleControlProps {
  className?: string;
}

export const GameScaleControl: React.FC<GameScaleControlProps> = ({ className = '' }) => {
  const { scale, setScale, increaseScale, decreaseScale, resetScale } = useScale();
  const { audio, haptic } = useGame();
  const [isOpen, setIsOpen] = useState(false);

  const percent = Math.round(scale * 100);

  const handleToggle = () => {
    audio.playClick();
    haptic.triggerHaptic('light');
    setIsOpen((prev) => !prev);
  };

  const handleSetPreset = (targetScale: number) => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    setScale(targetScale);
  };

  const presets = [
    { label: 'صغير', scale: 0.85 },
    { label: 'افتراضي', scale: 1.0 },
    { label: 'كبير', scale: 1.15 },
    { label: 'أكبر', scale: 1.25 },
  ];

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="تغيير مقاس العرض والنصوص"
        title={`مقاس العرض: ${percent}%`}
        className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg transition-all duration-200 active:scale-95 border bg-surface-container-high border-outline-variant/40 text-on-surface-variant hover:text-white hover:border-white/40 shadow-sm relative group cursor-pointer ${className}`}
      >
        <span className="material-symbols-outlined text-[17px] sm:text-[19px]">
          format_size
        </span>
        {percent !== 100 && (
          <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-amber-400 text-black text-[9px] font-black rounded-md shadow-xs leading-tight">
            {percent}%
          </span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="w-full max-w-sm flex flex-col dark-monochrome-card rounded-xl p-4 sm:p-5 border border-white/20 text-right shadow-2xl space-y-4 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/30 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[20px]">format_size</span>
                  <h3 className="text-sm sm:text-base font-bold text-white">تكبير / تصغير مقاس اللعبة</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {/* Subtitle */}
              <p className="text-[11px] sm:text-xs text-on-surface-variant">
                تحكّم في مقاس اللعبة والنصوص بالكامل لتناسب شاشتك وراحتك البصرية:
              </p>

              {/* Display & Stepper */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    audio.playClick();
                    decreaseScale();
                  }}
                  disabled={scale <= 0.8}
                  className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/50 text-white font-bold flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  title="تصغير"
                >
                  <span className="material-symbols-outlined text-[20px]">remove</span>
                </button>

                <div className="text-center px-3">
                  <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-wider">
                    {percent}%
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-medium">
                    {percent === 100
                      ? 'المقاس الافتراضي'
                      : percent > 100
                      ? `تكبير (+${percent - 100}%)`
                      : `تصغير (${percent - 100}%)`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    audio.playClick();
                    increaseScale();
                  }}
                  disabled={scale >= 1.3}
                  className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/50 text-white font-bold flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  title="تكبير"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
              </div>

              {/* Range Slider */}
              <div className="space-y-1.5 px-1">
                <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-medium">
                  <span>80% (أصغر)</span>
                  <span>100%</span>
                  <span>130% (أكبر)</span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={1.3}
                  step={0.05}
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {presets.map((p) => {
                  const isCurrent = Math.round(p.scale * 100) === percent;
                  return (
                    <button
                      key={p.scale}
                      type="button"
                      onClick={() => handleSetPreset(p.scale)}
                      className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                        isCurrent
                          ? 'bg-white text-surface-container-lowest shadow-sm ring-1 ring-white/50'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-white border border-outline-variant/40'
                      }`}
                    >
                      <span className="block text-[11px]">{Math.round(p.scale * 100)}%</span>
                      <span className="block text-[9px] opacity-80">{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => {
                    audio.playClick();
                    resetScale();
                  }}
                  disabled={percent === 100}
                  className="flex-1 py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-xs font-semibold text-on-surface-variant hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                  <span>إعادة ضبط (100%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="py-2 px-5 rounded-lg bg-white hover:bg-neutral-200 text-surface-container-lowest text-xs font-bold transition-all shadow-sm"
                >
                  تم
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
