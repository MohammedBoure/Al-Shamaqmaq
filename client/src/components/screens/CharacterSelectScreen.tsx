import React, { useState } from 'react';
import {
  ConsolePet,
  PetConfig,
  PET_COLORS,
  PET_MASKS,
  PET_GLASSES,
  PET_EXPRESSIONS,
  serializePet,
  parsePet,
  DEFAULT_PET_CONFIG,
} from '../common/ConsolePet';
import { useGame } from '../../context/GameContext';

interface CharacterSelectScreenProps {
  initialNickname?: string;
  initialAvatar?: string;
  onSave: (nickname: string, avatar: string) => void;
  onBack?: () => void;
  actionButtonText?: string;
}

type TabType = 'colors' | 'masks' | 'glasses' | 'expressions';

export const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({
  initialNickname = '',
  initialAvatar,
  onSave,
  onBack,
  actionButtonText = 'تأكيد وحفظ',
}) => {
  const { audio, haptic } = useGame();

  const [nickname, setNickname] = useState<string>(() => {
    return initialNickname || localStorage.getItem('deception_player_nickname') || 'لاعب_ESC';
  });
  const [petConfig, setPetConfig] = useState<PetConfig>(() => {
    return parsePet(initialAvatar || localStorage.getItem('deception_player_avatar') || undefined);
  });
  const [activeTab, setActiveTab] = useState<TabType>('colors');

  const handleTabChange = (tab: TabType) => {
    audio.playClick();
    haptic.triggerHaptic('light');
    setActiveTab(tab);
  };

  const handleRandomize = () => {
    audio.playClick();
    haptic.triggerHaptic('medium');

    const colorKeys = Object.keys(PET_COLORS);
    const maskKeys = Object.keys(PET_MASKS);
    const glassesKeys = Object.keys(PET_GLASSES);
    const expressionKeys = Object.keys(PET_EXPRESSIONS);

    const randomColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];
    const randomMask = maskKeys[Math.floor(Math.random() * maskKeys.length)];
    const randomGlasses = glassesKeys[Math.floor(Math.random() * glassesKeys.length)];
    const randomExpression = expressionKeys[Math.floor(Math.random() * expressionKeys.length)];

    setPetConfig({
      color: randomColor,
      mask: randomMask,
      glasses: randomGlasses,
      expression: randomExpression,
    });
  };

  const handleReset = () => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    setPetConfig({ ...DEFAULT_PET_CONFIG });
  };

  const handleContinue = () => {
    audio.playClick();
    haptic.triggerHaptic('heavy');
    const finalNick = nickname.trim() || 'لاعب_ESC';
    const finalAvatar = serializePet(petConfig);
    try {
      localStorage.setItem('deception_player_nickname', finalNick);
      localStorage.setItem('deception_player_avatar', finalAvatar);
    } catch (_) {}
    onSave(finalNick, finalAvatar);
  };

  return (
    <div className="flex flex-col h-full max-h-full overflow-y-auto max-w-4xl mx-auto w-full table-canvas-dark relative select-none p-3 sm:p-4 transition-all justify-between">
      {/* 1. الشريط العلوي */}
      <header className="flex items-center justify-between pb-3 sm:pb-4 border-b border-outline-variant/40 w-full">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-white"
            title="رجوع"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px] rotate-180">arrow_back</span>
          </button>
        ) : (
          <div className="w-9 sm:w-10" />
        )}

        <h1 className="text-base sm:text-xl font-bold text-white tracking-tight">
          تخصيص هوية اللاعب
        </h1>

        <button
          type="button"
          onClick={handleRandomize}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-white"
          title="عشوائي"
        >
          <span className="material-symbols-outlined text-[18px] sm:text-[20px]">casino</span>
        </button>
      </header>

      {/* 2. منطقة العرض */}
      <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-center md:gap-8 py-4 sm:py-6 w-full my-auto">
        {/* معاينة الشخصية والاسم */}
        <div className="flex flex-col items-center justify-center mb-4 sm:mb-6 md:mb-0">
          <div className="w-full max-w-[240px] sm:max-w-[280px] bg-surface-container-low border border-outline-variant/60 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl flex flex-col items-center">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center relative overflow-hidden my-2 sm:my-3">
              <ConsolePet config={petConfig} size={90} />
            </div>

            <div className="w-full mt-1.5 sm:mt-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="أدخل اسمك"
                maxLength={15}
                className="w-full py-2 sm:py-2.5 px-3 sm:px-4 bg-surface-container border border-outline-variant/60 rounded-xl text-center text-white font-bold text-xs sm:text-base focus:outline-none focus:border-white"
              />
            </div>
          </div>
        </div>

        {/* لوحة التخصيص */}
        <div className="w-full md:max-w-md flex flex-col">
          {/* التبويبات */}
          <div className="flex flex-wrap justify-start gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
            <button
              type="button"
              onClick={() => handleTabChange('colors')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                activeTab === 'colors'
                  ? 'bg-white text-surface-container-lowest'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-white border border-outline-variant/40'
              }`}
            >
              اللون
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('masks')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                activeTab === 'masks'
                  ? 'bg-white text-surface-container-lowest'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-white border border-outline-variant/40'
              }`}
            >
              القناع والقبعة
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('glasses')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                activeTab === 'glasses'
                  ? 'bg-white text-surface-container-lowest'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-white border border-outline-variant/40'
              }`}
            >
              الإكسسوارات
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('expressions')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                activeTab === 'expressions'
                  ? 'bg-white text-surface-container-lowest'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-white border border-outline-variant/40'
              }`}
            >
              التعابير
            </button>
          </div>

          <div className="dark-monochrome-card rounded-2xl p-3.5 sm:p-5 border border-white/10 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <span className="text-[11px] sm:text-xs font-bold text-white">
                {activeTab === 'colors' && 'اختر اللون الأساسي للكونسول'}
                {activeTab === 'masks' && 'اختر قناعاً أو قبعة تنكرية'}
                {activeTab === 'glasses' && 'اختر نظارات أو إكسسوار خداع'}
                {activeTab === 'expressions' && 'اختر ملامح وتعابير الوجه'}
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] sm:text-xs text-on-surface-variant hover:text-white flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px] sm:text-[15px]">restart_alt</span>
                <span>إعادة ضبط</span>
              </button>
            </div>

            {/* شبكة الخيارات */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2 max-h-48 overflow-y-auto p-1">
              {activeTab === 'colors' &&
                Object.entries(PET_COLORS).map(([colorKey]) => {
                  const isSelected = petConfig.color === colorKey;
                  return (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => setPetConfig((prev) => ({ ...prev, color: colorKey }))}
                      className={`aspect-square rounded-xl bg-surface-container border flex items-center justify-center p-1 transition-all ${
                        isSelected
                          ? 'border-2 border-white bg-surface-container-highest shadow-sm scale-105'
                          : 'border-outline-variant/40 hover:border-outline'
                      }`}
                    >
                      <ConsolePet config={{ ...petConfig, color: colorKey }} size={28} />
                    </button>
                  );
                })}

              {activeTab === 'masks' &&
                Object.entries(PET_MASKS).map(([maskKey, maskData]) => {
                  const isSelected = petConfig.mask === maskKey;
                  return (
                    <button
                      key={maskKey}
                      type="button"
                      onClick={() => setPetConfig((prev) => ({ ...prev, mask: maskKey }))}
                      className={`aspect-square rounded-xl bg-surface-container border flex flex-col items-center justify-center p-1 transition-all ${
                        isSelected
                          ? 'border-2 border-white bg-surface-container-highest shadow-sm scale-105'
                          : 'border-outline-variant/40 hover:border-outline'
                      }`}
                      title={maskData.name}
                    >
                      <span className="text-xl sm:text-2xl">{maskData.label}</span>
                      <span className="text-[9px] text-on-surface-variant truncate w-full text-center mt-0.5">
                        {maskData.name}
                      </span>
                    </button>
                  );
                })}

              {activeTab === 'glasses' &&
                Object.entries(PET_GLASSES).map(([glassesKey, glassesData]) => {
                  const isSelected = petConfig.glasses === glassesKey;
                  return (
                    <button
                      key={glassesKey}
                      type="button"
                      onClick={() => setPetConfig((prev) => ({ ...prev, glasses: glassesKey }))}
                      className={`aspect-square rounded-xl bg-surface-container border flex flex-col items-center justify-center p-1 transition-all ${
                        isSelected
                          ? 'border-2 border-white bg-surface-container-highest shadow-sm scale-105'
                          : 'border-outline-variant/40 hover:border-outline'
                      }`}
                      title={glassesData.name}
                    >
                      <span className="text-xl sm:text-2xl">{glassesData.label}</span>
                      <span className="text-[9px] text-on-surface-variant truncate w-full text-center mt-0.5">
                        {glassesData.name}
                      </span>
                    </button>
                  );
                })}

              {activeTab === 'expressions' &&
                Object.entries(PET_EXPRESSIONS).map(([exprKey, exprData]) => {
                  const isSelected = petConfig.expression === exprKey;
                  return (
                    <button
                      key={exprKey}
                      type="button"
                      onClick={() => setPetConfig((prev) => ({ ...prev, expression: exprKey }))}
                      className={`aspect-square rounded-xl bg-surface-container border flex flex-col items-center justify-center p-1 transition-all ${
                        isSelected
                          ? 'border-2 border-white bg-surface-container-highest shadow-sm scale-105'
                          : 'border-outline-variant/40 hover:border-outline'
                      }`}
                      title={exprData.name}
                    >
                      <span className="text-xl sm:text-2xl">{exprData.label}</span>
                      <span className="text-[9px] text-on-surface-variant truncate w-full text-center mt-0.5">
                        {exprData.name}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* زر المتابعة */}
      <div className="pt-2 sm:pt-4 max-w-sm mx-auto w-full">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full bg-white hover:bg-neutral-200 text-surface-container-lowest font-bold py-2.5 sm:py-3.5 px-5 sm:px-6 rounded-xl shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-xs sm:text-sm"
        >
          <span>{actionButtonText}</span>
          <span className="material-symbols-outlined text-[16px] sm:text-[18px]">check</span>
        </button>
      </div>
    </div>
  );
};
