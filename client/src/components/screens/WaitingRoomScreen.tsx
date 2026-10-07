import React, { useState } from 'react';
import { Copy, Check, Play, Crown, LogOut, UserCheck, Edit3 } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { AudioToggle } from '../common/AudioToggle';
import { ConsolePet } from '../common/ConsolePet';
import { CharacterSelectScreen } from './CharacterSelectScreen';

export const WaitingRoomScreen: React.FC = () => {
  const { room, player, startGame, leaveRoom, updateProfile, haptic } = useGame();
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  const roomCode = room?.code || '';
  const players = room?.players || [];
  const isHost = player?.isHost;
  const canStart = players.length >= 2;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      haptic.triggerHaptic('success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // fallback
    }
  };

  const handleSaveProfile = (newNickname: string, newAvatar: string) => {
    updateProfile(newNickname, newAvatar);
    setIsEditingProfile(false);
    haptic.triggerHaptic('success');
  };

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 max-w-lg mx-auto w-full">
      {/* نافذة التخصيص الكامل للشخصية إن تم فتحها */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="w-full h-full max-w-md mx-auto">
            <CharacterSelectScreen
              initialNickname={player?.nickname}
              initialAvatar={player?.avatar}
              onSave={handleSaveProfile}
              onBack={() => setIsEditingProfile(false)}
              actionButtonText="حفظ وتأكيد التعديل"
            />
          </div>
        </div>
      )}

      {/* الشريط العلوي */}
      <header className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={leaveRoom}
          className="p-2.5 rounded-xl bg-arcade-card/80 border border-arcade-border text-gray-400 hover:text-rose-400 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <LogOut className="w-4 h-4" />
          <span>مغادرة</span>
        </button>

        <div className="flex items-center gap-2">
          <ConnectionBadge />
          <AudioToggle />
        </div>
      </header>

      {/* بطاقة كود الغرفة النيون */}
      <div className="bg-gradient-to-br from-arcade-card to-arcade-bg border-2 border-arcade-purple/50 rounded-3xl p-6 mb-6 shadow-neon-purple text-center relative overflow-hidden">
        <div className="text-xs font-bold text-gray-400 mb-1">رمز الغرفة للمشاركة:</div>
        <div className="text-4xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-arcade-cyan via-white to-arcade-pink font-mono my-2 select-all">
          {roomCode}
        </div>

        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center gap-2 px-5 py-2.5 mt-2 rounded-2xl bg-arcade-cardHover border border-arcade-border/80 text-xs font-black text-gray-200 hover:text-white transition-all transform active:scale-95 shadow-md"
        >
          {copied ? <Check className="w-4 h-4 text-arcade-green" /> : <Copy className="w-4 h-4 text-arcade-cyan" />}
          <span>{copied ? 'تم نسخ الرمز!' : 'نسخ رمز الغرفة'}</span>
        </button>
      </div>

      {/* زر تعديل الملف الشخصي */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-black text-gray-300 flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-arcade-cyan" />
          <span>اللاعبون المنضمون ({players.length}):</span>
        </h2>
        <button
          type="button"
          onClick={() => setIsEditingProfile(true)}
          className="text-xs text-arcade-cyan hover:underline flex items-center gap-1 font-bold"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>تعديل شخصيتي واسمي</span>
        </button>
      </div>

      {/* شبكة بطاقات اللاعبين */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto mb-6 pr-0.5">
        {players.map((p) => {
          const isCurrentPlayer = p.id === player?.id;
          return (
            <div
              key={p.id}
              onClick={() => isCurrentPlayer && setIsEditingProfile(true)}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center text-center relative ${
                isCurrentPlayer
                  ? 'bg-arcade-purple/20 border-arcade-purple shadow-neon-purple cursor-pointer hover:scale-102'
                  : 'bg-arcade-card/70 border-arcade-border/60 hover:border-arcade-border'
              }`}
            >
              {p.isHost && (
                <div className="absolute top-2 right-2 text-arcade-yellow" title="مضيف الغرفة">
                  <Crown className="w-4 h-4 fill-arcade-yellow" />
                </div>
              )}
              <div className="my-1 animate-bounce-subtle">
                <ConsolePet avatar={p.avatar} size={58} />
              </div>
              <span className="text-xs font-black text-white truncate max-w-[120px] mt-1">
                {p.nickname}
              </span>
              {isCurrentPlayer && (
                <span className="text-[10px] font-bold text-arcade-cyan mt-0.5">(أنت)</span>
              )}
            </div>
          );
        })}
      </div>

      {/* زر بدء اللعبة أو رسالة الانتظار للمنضمين */}
      <div className="w-full mt-auto pt-2">
        {isHost ? (
          <div>
            <button
              type="button"
              onClick={startGame}
              disabled={!canStart}
              className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-xl transform active:scale-95 ${
                canStart
                  ? 'bg-gradient-to-l from-arcade-green via-emerald-500 to-arcade-cyan text-black shadow-neon-green hover:opacity-95'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{canStart ? 'بدء المنافسة الآن! 🚀' : 'في انتظار لاعب إضافي للبدء (الحد الأدنى 2)...'}</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-arcade-card/80 border border-arcade-border text-center text-sm font-bold text-gray-300 animate-pulse">
            في انتظار مضيف الغرفة لبدء المنافسة... ⏳
          </div>
        )}
      </div>
    </div>
  );
};
