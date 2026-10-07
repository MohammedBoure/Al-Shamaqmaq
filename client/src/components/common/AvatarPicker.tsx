import React, { useState } from 'react';
import { Edit3 } from 'lucide-react';
import {
  ConsolePet,
  PetConfig,
  serializePet,
  parsePet,
} from './ConsolePet';
import { CharacterSelectScreen } from '../screens/CharacterSelectScreen';

interface AvatarPickerProps {
  selectedAvatar: string;
  onSelectAvatar: (avatar: string) => void;
  nickname?: string;
  onUpdateNickname?: (name: string) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  selectedAvatar,
  onSelectAvatar,
  nickname = '',
  onUpdateNickname,
}) => {
  const [isFullModalOpen, setIsFullModalOpen] = useState(false);
  const currentConfig: PetConfig = parsePet(selectedAvatar);

  // الألوان السريعة للاختيار المباشر
  const quickColors = ['teal', 'pink', 'red', 'orange', 'yellow', 'green', 'blue', 'magenta', 'cyan', 'purple'];

  return (
    <div className="w-full">
      {/* نافذة التخصيص الكاملة المماثلة للصورة المرجعية */}
      {isFullModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="w-full h-full max-w-md mx-auto">
            <CharacterSelectScreen
              initialNickname={nickname}
              initialAvatar={selectedAvatar}
              onSave={(newName, newAvatar) => {
                if (onUpdateNickname && newName) {
                  onUpdateNickname(newName);
                }
                onSelectAvatar(newAvatar);
                setIsFullModalOpen(false);
              }}
              onBack={() => setIsFullModalOpen(false)}
              actionButtonText="تأكيد الشخصية"
            />
          </div>
        </div>
      )}

      {/* العرض المختصر داخل النماذج */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-gray-300">
          شخصية اللاعب (الكونسول):
        </label>
        <button
          type="button"
          onClick={() => setIsFullModalOpen(true)}
          className="text-xs text-arcade-cyan hover:underline font-bold flex items-center gap-1"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>تخصيص كامل (أقنعة ونظارات)</span>
        </button>
      </div>

      {/* المعاينة الحالية مع شريط ألوان سريع */}
      <div className="flex items-center gap-3 p-3 bg-arcade-bg/80 rounded-2xl border-2 border-black shadow-inner">
        {/* الشخصية الحالية المعروضة */}
        <button
          type="button"
          onClick={() => setIsFullModalOpen(true)}
          className="p-1 rounded-xl bg-gradient-to-b from-[#1976d2] to-[#0d47a1] border-2 border-black hover:scale-105 active:scale-95 transition-all shadow-[0_3px_0_#000] shrink-0"
          title="اضغط للتخصيص الكامل"
        >
          <ConsolePet config={currentConfig} size={56} />
        </button>

        {/* شبكة الألوان السريعة */}
        <div className="flex-1 grid grid-cols-5 gap-1.5 overflow-x-auto py-1">
          {quickColors.map((colorKey) => {
            const isSelected = currentConfig.color === colorKey;
            return (
              <button
                key={colorKey}
                type="button"
                onClick={() => {
                  const updated = { ...currentConfig, color: colorKey };
                  onSelectAvatar(serializePet(updated));
                }}
                className={`aspect-square rounded-lg bg-white border-2 border-black flex items-center justify-center p-0.5 transition-all transform active:scale-90 ${
                  isSelected
                    ? 'ring-2 ring-yellow-400 scale-105 shadow-[0_2px_0_#000]'
                    : 'hover:scale-105'
                }`}
              >
                <ConsolePet config={{ ...currentConfig, color: colorKey }} size={24} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
