import React, { useState } from 'react';
import { ChevronRight, RotateCcw, X, Glasses, Gamepad2, Sparkles } from 'lucide-react';
import {
  ConsolePet,
  PetConfig,
  PET_COLORS,
  PET_MASKS,
  PET_GLASSES,
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

type TabType = 'colors' | 'masks' | 'glasses';

export const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({
  initialNickname = '',
  initialAvatar,
  onSave,
  onBack,
  actionButtonText = 'المتابعة',
}) => {
  const { audio, haptic } = useGame();

  const [nickname, setNickname] = useState<string>(initialNickname || '');
  const [petConfig, setPetConfig] = useState<PetConfig>(() => parsePet(initialAvatar));
  const [activeTab, setActiveTab] = useState<TabType>('colors');

  // التبديل بين التبويبات
  const handleTabChange = (tab: TabType) => {
    audio.playClick();
    haptic.triggerHaptic('light');
    setActiveTab(tab);
  };

  // اختيار عشوائي للشخصية (زر التحديث أعلى اليمين)
  const handleRandomize = () => {
    audio.playClick();
    haptic.triggerHaptic('medium');

    const colorKeys = Object.keys(PET_COLORS);
    const maskKeys = Object.keys(PET_MASKS);
    const glassesKeys = Object.keys(PET_GLASSES);

    const randomColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];
    const randomMask = maskKeys[Math.floor(Math.random() * maskKeys.length)];
    const randomGlasses = glassesKeys[Math.floor(Math.random() * glassesKeys.length)];

    setPetConfig({
      color: randomColor,
      mask: randomMask,
      glasses: randomGlasses,
      expression: 'determined',
    });
  };

  // إعادة التعيين إلى الإعدادات الافتراضية
  const handleReset = () => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    setPetConfig({ ...DEFAULT_PET_CONFIG });
  };

  // تأكيد وحفظ الشخصية
  const handleContinue = () => {
    audio.playClick();
    haptic.triggerHaptic('heavy');
    const finalNick = nickname.trim() || 'لاعب_بطل';
    const finalAvatar = serializePet(petConfig);
    onSave(finalNick, finalAvatar);
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md md:max-w-4xl lg:max-w-5xl mx-auto w-full bg-[#1b1c28] relative overflow-hidden select-none p-2 sm:p-4 transition-all">
      {/* 1. الشريط العلوي */}
      <header className="flex items-center justify-between px-4 pt-3 pb-2 z-10 w-full">
        {/* زر العودة يساراً */}
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-[#364259] border-2 border-black shadow-[0_3px_0_#1e2738] active:translate-y-0.5 flex items-center justify-center text-white"
            title="رجوع"
          >
            <ChevronRight className="w-6 h-6 stroke-[3]" />
          </button>
        ) : (
          <div className="w-10" />
        )}

        {/* عنوان الشاشة في الوسط */}
        <h1 className="text-xl sm:text-2xl font-black text-stroke-arcade tracking-wide">
          اختر شخصيتك...
        </h1>

        {/* زر التبديل العشوائي يميناً */}
        <button
          type="button"
          onClick={handleRandomize}
          className="w-10 h-10 rounded-xl bg-[#364259] border-2 border-black shadow-[0_3px_0_#1e2738] active:translate-y-0.5 flex items-center justify-center text-white"
          title="اختيار عشوائي"
        >
          <RotateCcw className="w-5 h-5 stroke-[2.5]" />
        </button>
      </header>

      {/* 2. منطقة العرض التجاوبية (ثنائية الأعمدة على الحاسوب، ومتتالية على الهاتف) */}
      <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-center md:gap-8 px-2 sm:px-4 py-2 w-full">
        {/* العمود 1: صندوق الكونسول الأخضر/التركوازي والشخصية */}
        <div className="flex flex-col items-center justify-center mb-4 md:mb-0">
          <div className="w-full max-w-[280px] sm:max-w-[320px] bg-[#3cb79d] border-4 border-black rounded-3xl p-3 sm:p-4 shadow-[0_7px_0_#1e7563] flex flex-col items-center">
            {/* إطار الشاشة الداخلي الداكن */}
            <div className="w-full bg-[#0a3832] border-[3.5px] border-black rounded-2xl p-2 shadow-inner">
              {/* شاشة الأشعة الزرقاء (Sunburst Screen) */}
              <div className="w-full h-44 sm:h-52 rounded-xl sunburst-rays border-2 border-black/80 flex items-center justify-center relative overflow-hidden shadow-inner">
                <div className="transform scale-110 sm:scale-130 transition-all duration-300">
                  <ConsolePet config={petConfig} size={150} />
                </div>
              </div>
            </div>

            {/* حقل إدخال الاسم المستعار مباشرة داخل الكونسول */}
            <div className="w-full mt-3">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="أدخل اسمك"
                maxLength={15}
                className="w-full py-2.5 px-4 bg-[#1b7362] border-2 border-black rounded-xl text-center text-white font-black text-base sm:text-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/80 shadow-inner"
              />
            </div>

            {/* تفاصيل الكونسول بالأسفل: مكبر الصوت ومفتاح التشغيل */}
            <div className="w-full flex items-center justify-between px-2 pt-2 text-[#1b7362]">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-black/60 inline-block" />
                <span className="w-2 h-2 rounded-full bg-black/60 inline-block" />
                <span className="w-2 h-2 rounded-full bg-black/60 inline-block" />
              </div>
              <div className="w-8 h-2 rounded-full bg-black/60" />
            </div>
          </div>
        </div>

        {/* العمود 2: اللوحة لتخصيص الشخصية والألوان */}
        <div className="w-full md:max-w-md flex flex-col relative z-20">
        {/* التبويبات العلوية البارزة بتصميم كرتوني مائل */}
        <div className="flex justify-end gap-1 px-4 -mb-1">
          {/* تبويب النظارات */}
          <button
            type="button"
            onClick={() => handleTabChange('glasses')}
            className={`px-4 py-2 border-t-3 border-x-3 border-black rounded-t-2xl font-black text-sm flex items-center gap-1 transition-all ${
              activeTab === 'glasses'
                ? 'bg-[#0080ff] text-white -translate-y-1 shadow-[-2px_-2px_0_#005bb5]'
                : 'bg-[#d6e0ea] text-gray-700 hover:bg-white'
            }`}
          >
            <Glasses className="w-5 h-5" />
          </button>

          {/* تبويب الأقنعة */}
          <button
            type="button"
            onClick={() => handleTabChange('masks')}
            className={`px-4 py-2 border-t-3 border-x-3 border-black rounded-t-2xl font-black text-sm flex items-center gap-1 transition-all ${
              activeTab === 'masks'
                ? 'bg-[#0080ff] text-white -translate-y-1 shadow-[-2px_-2px_0_#005bb5]'
                : 'bg-[#d6e0ea] text-gray-700 hover:bg-white'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* تبويب الألوان */}
          <button
            type="button"
            onClick={() => handleTabChange('colors')}
            className={`px-4 py-2 border-t-3 border-x-3 border-black rounded-t-2xl font-black text-sm flex items-center gap-1 transition-all ${
              activeTab === 'colors'
                ? 'bg-[#0080ff] text-white -translate-y-1 shadow-[-2px_-2px_0_#005bb5]'
                : 'bg-[#d6e0ea] text-gray-700 hover:bg-white'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
          </button>
        </div>

        {/* جسم اللوحة الزرقاء */}
        <div className="bg-[#0080ff] border-t-4 border-black rounded-t-3xl p-4 shadow-2xl flex flex-col gap-3">
          {/* شريط عنوان التبويب وزر الإعادة */}
          <div className="flex items-center justify-between">
            {/* زر الإعادة يساراً */}
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-[#1b263b]/40 hover:bg-[#1b263b]/60 transition-all text-white active:scale-95"
            >
              <div className="w-5 h-5 rounded-full bg-[#e53935] border border-black flex items-center justify-center text-white">
                <X className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="text-xs font-black text-stroke-sm">إعادة</span>
            </button>

            {/* عنوان التبويب الحالي يميناً */}
            <h2 className="text-lg font-black text-stroke-arcade">
              {activeTab === 'colors' && 'الألوان'}
              {activeTab === 'masks' && 'الأقنعة والخوذ'}
              {activeTab === 'glasses' && 'النظارات والإكسسوارات'}
            </h2>
          </div>

          {/* شبكة خيارات التخصيص */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 max-h-36 sm:max-h-40 overflow-y-auto p-1 bg-[#006bd6]/40 rounded-2xl border-2 border-black/30">
            {/* خيارات تبويب الألوان */}
            {activeTab === 'colors' &&
              Object.entries(PET_COLORS).map(([colorKey]) => {
                const isSelected = petConfig.color === colorKey;
                return (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => {
                      audio.playClick();
                      haptic.triggerHaptic('light');
                      setPetConfig((prev) => ({ ...prev, color: colorKey }));
                    }}
                    className={`aspect-square rounded-xl bg-white border-2 border-black flex items-center justify-center p-0.5 transition-all transform active:scale-90 ${
                      isSelected
                        ? 'ring-3 ring-[#ffeb3b] scale-105 shadow-[0_3px_0_#000] -translate-y-0.5'
                        : 'shadow-[0_2px_0_#90caf9] hover:scale-102'
                    }`}
                  >
                    <ConsolePet config={{ ...petConfig, color: colorKey }} size={34} />
                  </button>
                );
              })}

            {/* خيارات تبويب الأقنعة */}
            {activeTab === 'masks' &&
              Object.entries(PET_MASKS).map(([maskKey, maskData]) => {
                const isSelected = petConfig.mask === maskKey;
                return (
                  <button
                    key={maskKey}
                    type="button"
                    onClick={() => {
                      audio.playClick();
                      haptic.triggerHaptic('light');
                      setPetConfig((prev) => ({ ...prev, mask: maskKey }));
                    }}
                    className={`aspect-square rounded-xl bg-white border-2 border-black flex flex-col items-center justify-center p-0.5 transition-all transform active:scale-90 ${
                      isSelected
                        ? 'ring-3 ring-[#ffeb3b] scale-105 shadow-[0_3px_0_#000] -translate-y-0.5'
                        : 'shadow-[0_2px_0_#90caf9] hover:scale-102'
                    }`}
                    title={maskData.name}
                  >
                    <span className="text-lg">{maskData.label}</span>
                  </button>
                );
              })}

            {/* خيارات تبويب النظارات */}
            {activeTab === 'glasses' &&
              Object.entries(PET_GLASSES).map(([glassesKey, glassesData]) => {
                const isSelected = petConfig.glasses === glassesKey;
                return (
                  <button
                    key={glassesKey}
                    type="button"
                    onClick={() => {
                      audio.playClick();
                      haptic.triggerHaptic('light');
                      setPetConfig((prev) => ({ ...prev, glasses: glassesKey }));
                    }}
                    className={`aspect-square rounded-xl bg-white border-2 border-black flex flex-col items-center justify-center p-0.5 transition-all transform active:scale-90 ${
                      isSelected
                        ? 'ring-3 ring-[#ffeb3b] scale-105 shadow-[0_3px_0_#000] -translate-y-0.5'
                        : 'shadow-[0_2px_0_#90caf9] hover:scale-102'
                    }`}
                    title={glassesData.name}
                  >
                    <span className="text-lg">{glassesData.label}</span>
                  </button>
                );
              })}
          </div>

          {/* زر المتابعة الأزرق الثلاثي الأبعاد مطابق تماماً للصورة */}
          <button
            type="button"
            onClick={handleContinue}
            className="w-full py-3.5 rounded-2xl arcade-btn-blue text-center font-black text-xl text-stroke-arcade tracking-wider transition-all"
          >
            {actionButtonText}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
