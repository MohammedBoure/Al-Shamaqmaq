import React, { useState } from 'react';
import {
  Copy,
  Check,
  Play,
  LogOut,
  Edit3,
  Share2,
  Camera,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Menu,
  Plus,
  Radio,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { AudioToggle } from '../common/AudioToggle';
import { ConsolePet } from '../common/ConsolePet';
import { QRCodeView } from '../common/QRCodeView';
import { CameraQRScanner } from '../common/CameraQRScanner';
import { CharacterSelectScreen } from './CharacterSelectScreen';
import { useCodeDictation } from '../../hooks/useCodeDictation';

export const WaitingRoomScreen: React.FC = () => {
  const {
    room,
    player,
    startGame,
    leaveRoom,
    updateProfile,
    haptic,
    audio,
    topics,
    joinRoom,
  } = useGame();

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // أقسام قابلة للطي (Accordions)
  const [isSharingOpen, setIsSharingOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(true);

  // إعداد وقت الجولة المحلي للعرض
  const [roundSeconds, setRoundSeconds] = useState<number>(60);
  const [activeBottomTab, setActiveBottomTab] = useState<'game' | 'chat'>('game');

  // خطاف إملاء الرقم صوتياً
  const { isSpeaking, isSupported: isTtsSupported, dictateCode, stopDictation } =
    useCodeDictation();

  const roomCode = room?.code || '';
  const players = room?.players || [];
  const isHost = player?.isHost;
  const canStart = players.length >= 2;
  const maxPlayers = 5;

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?join=${roomCode}`
    : `https://game/?join=${roomCode}`;

  // مشاركة الرابط عبر Web Share API أو النسخ الاحتياطي
  const handleShareLink = async () => {
    audio.playClick();
    haptic.triggerHaptic('light');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'العب معي في لعبة كلك! (خداع الألغاز)',
          text: `انضم إلى غرفتي برمز [${roomCode}] واستعد لأذكى جولات الخداع!`,
          url: joinUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // fallback copy link
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      haptic.triggerHaptic('success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (_) {}
  };

  // نسخ كود الغرفة فقط
  const handleCopyCode = async () => {
    audio.playClick();
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      haptic.triggerHaptic('success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (_) {}
  };

  // إملاء الرقم مباشرة صوتياً
  const handleToggleDictation = () => {
    audio.playClick();
    if (isSpeaking) {
      stopDictation();
    } else {
      dictateCode(roomCode);
    }
  };

  const handleSaveProfile = (newNickname: string, newAvatar: string) => {
    updateProfile(newNickname, newAvatar);
    setIsEditingProfile(false);
    haptic.triggerHaptic('success');
  };

  // عند مسح رمز غرفة أخرى عبر الكاميرا
  const handleCameraScanResult = (scannedCode: string) => {
    if (scannedCode && scannedCode !== roomCode) {
      if (player?.nickname && player?.avatar) {
        joinRoom(scannedCode, player.nickname, player.avatar);
      }
    }
  };

  const categoriesCount = room?.allowedTopicIds?.length || topics.length || 6;
  const playersCountFormatted = String(players.length).padStart(2, '0');
  const maxPlayersFormatted = String(maxPlayers).padStart(2, '0');

  return (
    <div className="flex flex-col min-h-screen px-3 py-4 max-w-md mx-auto w-full select-none pb-28">
      {/* نافذة التخصيص الكامل للشخصية */}
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

      {/* ماسح الكاميرا الداخلي لرموز QR */}
      <CameraQRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleCameraScanResult}
      />

      {/* شريط القائمة العلوية المنبثقة */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 flex items-start justify-end p-4 pt-16"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-56 bg-arcade-card border-2 border-black rounded-2xl p-3 shadow-[0_6px_0_#000] space-y-2 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-black text-gray-400 px-2 pb-1 border-b border-arcade-border/50">
              خيارات الغرفة
            </div>
            <button
              type="button"
              onClick={() => {
                setIsScannerOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full text-right p-2 rounded-xl hover:bg-arcade-bg/60 text-xs font-bold text-white flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-arcade-cyan" />
              <span>سكان رمز QR بالكاميرا</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditingProfile(true);
                setIsMenuOpen(false);
              }}
              className="w-full text-right p-2 rounded-xl hover:bg-arcade-bg/60 text-xs font-bold text-white flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4 text-arcade-yellow" />
              <span>تعديل الشخصية والاسم</span>
            </button>
            <button
              type="button"
              onClick={() => {
                leaveRoom();
                setIsMenuOpen(false);
              }}
              className="w-full text-right p-2 rounded-xl hover:bg-rose-950/40 text-xs font-bold text-rose-400 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>مغادرة الغرفة</span>
            </button>
          </div>
        </div>
      )}

      {/* الشريط العلوي والشعار كلك! مطابق للصورة */}
      <header className="flex items-center justify-between mb-4 relative z-20">
        {/* زر القائمة المنسدلة على اليمين/اليسار */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="p-2.5 rounded-2xl bg-[#1e2337] border-2 border-black shadow-[0_3px_0_#000] text-white hover:bg-[#282f49] active:translate-y-0.5 transition-all"
          title="القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* شعار اللعبة الكرتوني "كلك!" */}
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-black text-white tracking-wider text-stroke-arcade transform -rotate-1 select-none">
            كَلَكْ!
          </h1>
        </div>

        {/* المؤشرات الصوتية والاتصال */}
        <div className="flex items-center gap-1.5">
          <ConnectionBadge />
          <AudioToggle />
        </div>
      </header>

      {/* قسم 1: اللاعبون (مع الشريط والشريط التزييني التركوازي) */}
      <div className="mb-4">
        {/* شريط العنوان التركوازي العلوي ذو الأجنحة */}
        <div className="flex justify-center -mb-3 relative z-10">
          <div className="relative">
            {/* الطرف الأيمن للشريط */}
            <div className="absolute -right-3 top-1 w-4 h-7 bg-[#1c8c70] border-2 border-black transform skew-y-12 -z-10 rounded-sm" />
            {/* جسم الشريط */}
            <div className="bg-[#29c69f] px-8 py-1.5 rounded-lg border-2 border-black shadow-[0_3px_0_#000] text-black font-black text-sm text-center">
              اللاعبون
            </div>
            {/* الطرف الأيسر للشريط */}
            <div className="absolute -left-3 top-1 w-4 h-7 bg-[#1c8c70] border-2 border-black transform -skew-y-12 -z-10 rounded-sm" />
          </div>
        </div>

        {/* بطاقة اللاعبين الحاوية */}
        <div className="bg-[#3a4460] rounded-3xl border-3 border-black overflow-hidden shadow-[0_5px_0_#000]">
          {/* شريط العداد الداخلي (01/05) */}
          <div className="bg-[#2d354b] py-2 text-center text-xs font-black text-white tracking-widest border-b-2 border-black">
            {playersCountFormatted} / {maxPlayersFormatted}
          </div>

          {/* مساحة عرض اللاعبين */}
          <div className="bg-[#ccd7e6] p-4 min-h-[110px] flex items-center justify-start gap-4 overflow-x-auto">
            {/* اللاعبون المنضمون */}
            {players.map((p) => {
              const isCurrentPlayer = p.id === player?.id;
              return (
                <div
                  key={p.id}
                  onClick={() => isCurrentPlayer && setIsEditingProfile(true)}
                  className={`flex flex-col items-center shrink-0 relative group ${
                    isCurrentPlayer ? 'cursor-pointer' : ''
                  }`}
                  title={isCurrentPlayer ? 'اضغط لتعديل شخصيتك' : p.nickname}
                >
                  <div className="relative">
                    {/* أيقونة التعديل فوق رأس اللاعب الخاص به كما في الصورة */}
                    {isCurrentPlayer && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingProfile(true);
                        }}
                        className="absolute -top-1 -right-1 z-10 p-1 bg-white border-2 border-black rounded-lg shadow-[0_2px_0_#000] hover:scale-110 active:scale-95 transition-all text-black"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                    <div className="animate-bounce-subtle">
                      <ConsolePet avatar={p.avatar} size={54} />
                    </div>
                  </div>
                  <span className="text-xs font-black text-black mt-1 truncate max-w-[80px] text-center">
                    {p.nickname}
                  </span>
                </div>
              );
            })}

            {/* خانة الإضافة (+) إذا كانت هناك أماكن فارغة */}
            {players.length < maxPlayers && (
              <button
                type="button"
                onClick={handleShareLink}
                className="w-14 h-14 rounded-2xl bg-white/70 border-2 border-[#8ba3c7] hover:border-black hover:bg-white flex items-center justify-center text-[#8ba3c7] hover:text-black transition-all shadow-inner shrink-0 group active:scale-95"
                title="دعوة لاعب جديد"
              >
                <Plus className="w-7 h-7 stroke-[3] group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* قسم 2: المشاركة (مع زر الطي، رمز QR، مشاركة الرابط، إملاء الرمز، وسكان الكاميرا) */}
      <div className="mb-4 bg-[#3a4460] rounded-3xl border-3 border-black overflow-hidden shadow-[0_5px_0_#000]">
        {/* شريط العنوان القابل للطي */}
        <button
          type="button"
          onClick={() => setIsSharingOpen((prev) => !prev)}
          className="w-full bg-[#2d354b] px-4 py-2.5 flex items-center justify-between text-white font-black text-sm border-b-2 border-black transition-colors hover:bg-[#343e58]"
        >
          <span>المشاركة</span>
          {isSharingOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-300" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-300" />
          )}
        </button>

        {/* محتوى قسم المشاركة */}
        {isSharingOpen && (
          <div className="bg-[#ccd7e6] p-4 flex flex-col items-center text-center">
            {/* رمز QR في المنتصف */}
            <div className="mb-2 bg-white p-2 rounded-2xl border-3 border-black shadow-[0_4px_0_#000]">
              <QRCodeView value={joinUrl} size={150} />
            </div>

            <p className="text-xs font-black text-[#2d354b] mb-3">
              امسح الرمز للانضمام إلى الغرفة
            </p>

            {/* عرض رمز الغرفة وإملائه صوتياً مباشرة */}
            <div className="w-full bg-white/80 border-2 border-black rounded-2xl p-2.5 mb-3 flex items-center justify-between gap-2 shadow-inner">
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-600 block">رمز الغرفة:</span>
                <span className="text-xl font-black tracking-widest text-black font-mono">
                  {roomCode}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* زر إملاء الرقم مباشرة صوتياً */}
                {isTtsSupported && (
                  <button
                    type="button"
                    onClick={handleToggleDictation}
                    className={`px-2.5 py-1.5 rounded-xl border-2 border-black text-xs font-black flex items-center gap-1 transition-all shadow-[0_2px_0_#000] active:translate-y-0.5 ${
                      isSpeaking
                        ? 'bg-arcade-pink text-white animate-pulse'
                        : 'bg-arcade-yellow text-black hover:bg-yellow-400'
                    }`}
                    title="نطق وإملاء الرمز صوتياً"
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>إيقاف</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>إملاء الرمز</span>
                      </>
                    )}
                  </button>
                )}

                {/* زر نسخ الرمز */}
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 bg-white border-2 border-black rounded-xl text-black hover:bg-gray-100 shadow-[0_2px_0_#000] active:translate-y-0.5 transition-all"
                  title="نسخ رمز الغرفة"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* مؤشر الصوت أثناء إملاء الرقم */}
            {isSpeaking && (
              <div className="w-full mb-3 px-3 py-1.5 bg-amber-200 border-2 border-black rounded-xl text-[11px] font-black text-amber-950 flex items-center justify-center gap-2 animate-bounce-subtle">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                <span>جارٍ إملاء رمز الغرفة صوتياً بالأرقام...</span>
              </div>
            )}

            {/* زر مشاركة الرابط الأزرق الكبير مطابق للصورة */}
            <button
              type="button"
              onClick={handleShareLink}
              className="w-full py-3.5 rounded-2xl bg-[#0070f3] hover:bg-[#0060df] text-white font-black text-sm border-3 border-black shadow-[0_5px_0_#0047a5] active:translate-y-1 active:shadow-[0_1px_0_#0047a5] transition-all flex items-center justify-center gap-2 mb-2"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedLink ? 'تم نسخ الرابط بنجاح! 🎉' : 'مشاركة الرابط'}</span>
            </button>

            {/* زر فتح سكان الكاميرا من داخل اللعبة */}
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="w-full py-2.5 rounded-2xl bg-[#1e2337] hover:bg-[#282f49] text-arcade-cyan font-black text-xs border-2 border-black shadow-[0_3px_0_#000] active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>مسح رمز QR من كاميرا الهاتف 📷</span>
            </button>
          </div>
        )}
      </div>

      {/* قسم 3: إعدادات اللعبة (الوقت لكل جولة مع القائمة المنسدلة) */}
      <div className="mb-4 bg-[#3a4460] rounded-3xl border-3 border-black overflow-hidden shadow-[0_5px_0_#000]">
        <button
          type="button"
          onClick={() => setIsSettingsOpen((prev) => !prev)}
          className="w-full bg-[#2d354b] px-4 py-2.5 flex items-center justify-between text-white font-black text-sm border-b-2 border-black transition-colors hover:bg-[#343e58]"
        >
          <span>إعدادات اللعبة</span>
          {isSettingsOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-300" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-300" />
          )}
        </button>

        {isSettingsOpen && (
          <div className="bg-[#ccd7e6] p-4">
            <div className="flex items-center justify-between">
              {/* قائمة تحديد الثواني */}
              <div className="relative">
                <select
                  value={roundSeconds}
                  onChange={(e) => setRoundSeconds(Number(e.target.value))}
                  disabled={!isHost}
                  className="appearance-none bg-white border-2 border-black rounded-xl px-6 py-2.5 text-center text-base font-black text-black shadow-[0_3px_0_#000] cursor-pointer focus:outline-none pr-8"
                >
                  <option value={30}>30</option>
                  <option value={45}>45</option>
                  <option value={60}>60</option>
                  <option value={90}>90</option>
                </select>
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                  ▼
                </div>
              </div>

              {/* نص التسمية والوصف كما في الصورة */}
              <div className="text-right">
                <div className="text-sm font-black text-black text-stroke-sm">
                  الوقت لكل جولة
                </div>
                <div className="text-[10px] font-bold text-gray-600">
                  عدد الثواني المسموح بها لكل سؤال
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* الشريط السفلي الثابت مطابق للصورة تماماً */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center">
        <div className="w-full max-w-md bg-[#0070f3] rounded-3xl border-3 border-black p-2.5 shadow-[0_6px_0_#0047a5] flex flex-col items-center">
          {/* شريط الإحصائيات العلوي باللون الأزرق: 06 فئات • 01 لاعبين */}
          <div className="text-white text-xs font-black tracking-wide text-stroke-sm mb-2 text-center">
            {String(categoriesCount).padStart(2, '0')} فئات &nbsp;•&nbsp; {playersCountFormatted} لاعبين
          </div>

          {/* الزر الذهبي/الأصفر الكبير: ابدأ اللعبة */}
          {isHost ? (
            <button
              type="button"
              onClick={startGame}
              disabled={!canStart}
              className={`w-full py-3.5 rounded-2xl font-black text-lg border-3 border-black transition-all flex items-center justify-center gap-2 ${
                canStart
                  ? 'arcade-btn-yellow text-black'
                  : 'bg-[#b89535] text-black/60 cursor-not-allowed opacity-75 shadow-[0_3px_0_#6d5516]'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>ابدأ اللعبة</span>
            </button>
          ) : (
            <div className="w-full py-3 rounded-2xl bg-[#1e2337] border-2 border-black text-center text-xs font-black text-white shadow-[0_3px_0_#000]">
              في انتظار مضيف الغرفة لبدء المنافسة... ⏳
            </div>
          )}
        </div>

        {/* المبدل السفلي: دردشة | لعبة */}
        <div className="mt-2 flex items-center bg-[#1e2337] border-2 border-black rounded-full p-1 shadow-[0_3px_0_#000]">
          <button
            type="button"
            onClick={() => setActiveBottomTab('game')}
            className={`px-6 py-1 rounded-full text-xs font-black transition-all ${
              activeBottomTab === 'game'
                ? 'bg-[#0070f3] text-white border border-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            لعبة
          </button>
          <button
            type="button"
            onClick={() => setActiveBottomTab('chat')}
            className={`px-6 py-1 rounded-full text-xs font-black transition-all ${
              activeBottomTab === 'chat'
                ? 'bg-[#0070f3] text-white border border-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            دردشة
          </button>
        </div>
      </div>
    </div>
  );
};
