import React, { useState } from 'react';
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

  const quickColors = ['dark', 'teal', 'blue', 'cyan', 'purple', 'pink', 'amber', 'yellow', 'green', 'red'];

  return (
    <div className="w-full">
      {/* نافذة التخصيص الكاملة */}
      {isFullModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2">
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

      {/* العرض المختصر */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-white">
          شخصية اللاعب:
        </label>
        <button
          type="button"
          onClick={() => setIsFullModalOpen(true)}
          className="text-xs text-white hover:underline font-semibold flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[15px]">edit</span>
          <span>تخصيص كامل</span>
        </button>
      </div>

      <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-2xl border border-outline-variant/50">
        <button
          type="button"
          onClick={() => setIsFullModalOpen(true)}
          className="p-1 rounded-xl bg-surface-container-high border border-outline-variant/60 hover:scale-105 active:scale-95 transition-all shrink-0"
          title="اضغط للتخصيص الكامل"
        >
          <ConsolePet config={currentConfig} size={50} />
        </button>

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
                className={`aspect-square rounded-lg bg-surface-container border flex items-center justify-center p-0.5 transition-all ${
                  isSelected
                    ? 'border-2 border-white scale-105 shadow-sm'
                    : 'border-outline-variant/40 hover:border-outline'
                }`}
              >
                <ConsolePet config={{ ...currentConfig, color: colorKey }} size={22} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
