import React, { useState, useEffect } from 'react';
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
  Users,
  Swords,
  Clock,
  Hash,
  Scale,
  BookOpen,
  Layers,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { AudioToggle } from '../common/AudioToggle';
import { ConsolePet } from '../common/ConsolePet';
import { QRCodeView } from '../common/QRCodeView';
import { CameraQRScanner } from '../common/CameraQRScanner';
import { ThemeToggle } from '../common/ThemeToggle';
import { CharacterSelectScreen } from './CharacterSelectScreen';
import { CategoryBrowserScreen } from './CategoryBrowserScreen';
import { useCodeDictation } from '../../hooks/useCodeDictation';

export const WaitingRoomScreen: React.FC = () => {
  const {
    room,
    player,
    startGame,
    leaveRoom,
    updateProfile,
    updateSettings,
    haptic,
    audio,
    topics,
    joinRoom,
  } = useGame();

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isCategoryBrowserOpen, setIsCategoryBrowserOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // أقسام قابلة للطي (Accordions)
  const [isSharingOpen, setIsSharingOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(true);

  // إعدادات اللعبة المحلية والمزامنة مع الغرفة
  const [roundSeconds, setRoundSeconds] = useState<number>(() => room?.roundDuration || 60);
  const [maxPlayers, setMaxPlayers] = useState<number>(() => room?.maxPlayers || 8);
  const [totalRounds, setTotalRounds] = useState<number>(() => room?.totalRounds || 5);
  const [gameMode, setGameMode] = useState<'individual' | 'teams'>(() => room?.gameMode || 'individual');
  const [activeBottomTab, setActiveBottomTab] = useState<'game' | 'chat'>('game');

  // مزامنة الحالات عند وصول تحديثات الغرفة من الخادم
  useEffect(() => {
    if (room?.roundDuration) setRoundSeconds(room.roundDuration);
    if (room?.maxPlayers) setMaxPlayers(room.maxPlayers);
    if (room?.totalRounds) setTotalRounds(room.totalRounds);
    if (room?.gameMode) setGameMode(room.gameMode);
  }, [room?.roundDuration, room?.maxPlayers, room?.totalRounds, room?.gameMode]);

  // خطاف إملاء الرقم صوتياً
  const { isSpeaking, isSupported: isTtsSupported, dictateCode, stopDictation } =
    useCodeDictation();

  const roomCode = room?.code || '';
  const players = room?.players || [];
  const isHost = player?.isHost;
  const canStart = players.length >= 2;
  const isTeamMode = gameMode === 'teams';

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
    updateProfile(newNickname, newAvatar, player?.teamId);
    setIsEditingProfile(false);
    haptic.triggerHaptic('success');
  };

  // تغيير الفريق للاعب الحالي
  const handleSwitchTeam = (teamId: 'red' | 'blue') => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    updateProfile(undefined, undefined, teamId);
  };

  // تغيير نمط اللعبة (فردي / فرق)
  const handleToggleGameMode = (newMode: 'individual' | 'teams') => {
    if (!isHost) return;
    audio.playClick();
    haptic.triggerHaptic('medium');
    setGameMode(newMode);
    updateSettings({ gameMode: newMode });
  };

  // تغيير وقت الجولة (الثواني المسموحة لكل سؤال)
  const handleUpdateDuration = (seconds: number) => {
    if (!isHost) return;
    const clamped = Math.max(10, Math.min(180, seconds));
    setRoundSeconds(clamped);
    updateSettings({ answerDuration: clamped });
  };

  // تغيير الحد الأقصى للاعبين
  const handleUpdateMaxPlayers = (count: number) => {
    if (!isHost) return;
    const clamped = Math.max(2, Math.min(30, count));
    setMaxPlayers(clamped);
    updateSettings({ maxPlayers: clamped });
  };

  // تغيير عدد الجولات
  const handleUpdateTotalRounds = (rounds: number) => {
    if (!isHost) return;
    const clamped = Math.max(1, Math.min(20, rounds));
    setTotalRounds(clamped);
    updateSettings({ totalRounds: clamped });
  };

  // موازنة الفرق تلقائياً
  const handleBalanceTeams = () => {
    if (!isHost) return;
    audio.playClick();
    haptic.triggerHaptic('success');
    updateSettings({ gameMode: 'teams' });
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

  const redPlayers = players.filter((p) => p.teamId === 'red');
  const bluePlayers = players.filter((p) => p.teamId === 'blue');

  return (
    <div className="flex flex-col min-h-screen px-3 py-4 md:px-6 md:py-8 max-w-md lg:max-w-6xl xl:max-w-7xl mx-auto w-full select-none pb-28 transition-all">
      {/* نافذة التخصيص الكامل للشخصية */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full h-full max-w-md md:max-w-4xl mx-auto flex items-center justify-center">
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

      {/* شاشة تصفح وتحديد الفئات الشاملة */}
      {isCategoryBrowserOpen && (
        <div className="fixed inset-0 z-50 bg-[#1b2245] flex items-center justify-center overflow-y-auto p-4">
          <div className="w-full h-full max-w-md md:max-w-4xl mx-auto">
            <CategoryBrowserScreen onClose={() => setIsCategoryBrowserOpen(false)} />
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
                setIsCategoryBrowserOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full text-right p-2 rounded-xl hover:bg-arcade-bg/60 text-xs font-bold text-white flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>تصفح وتحديد الفئات 📚</span>
            </button>
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
      <header className="flex items-center justify-between mb-6 relative z-20">
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="p-2.5 rounded-2xl bg-[#1e2337] border-2 border-black shadow-[0_3px_0_#000] text-white hover:bg-[#282f49] active:translate-y-0.5 transition-all"
          title="القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-wider text-stroke-arcade transform -rotate-1 select-none">
            كَلَكْ!
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionBadge />
          <ThemeToggle />
          <AudioToggle />
        </div>
      </header>

      {/* حاوية شبكية متجاوبة ثنائية الأعمدة للشاشات الكبيرة والحواسيب */}
      <div className="w-full lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        {/* العمود 1: اللاعبون والفرق */}
        <div className="lg:col-span-7 space-y-4">

      {/* قسم 1: اللاعبون وتكتل الفرق */}
      <div className="mb-4">
        {/* شريط العنوان التركوازي العلوي ذو الأجنحة */}
        <div className="flex justify-center -mb-3 relative z-10">
          <div className="relative">
            <div className="absolute -right-3 top-1 w-4 h-7 bg-[#1c8c70] border-2 border-black transform skew-y-12 -z-10 rounded-sm" />
            <div className="bg-[#29c69f] px-8 py-1.5 rounded-lg border-2 border-black shadow-[0_3px_0_#000] text-black font-black text-sm text-center flex items-center gap-2">
              {isTeamMode ? <Swords className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              <span>{isTeamMode ? 'تكتل الفرق المتنافسة' : 'اللاعبون'}</span>
            </div>
            <div className="absolute -left-3 top-1 w-4 h-7 bg-[#1c8c70] border-2 border-black transform -skew-y-12 -z-10 rounded-sm" />
          </div>
        </div>

        {/* بطاقة اللاعبين الحاوية */}
        <div className="bg-[#3a4460] rounded-3xl border-3 border-black overflow-hidden shadow-[0_5px_0_#000]">
          {/* شريط العداد الداخلي وسعة الغرفة */}
          <div className="bg-[#2d354b] py-2 px-3 text-center text-xs font-black text-white tracking-widest border-b-2 border-black flex items-center justify-between">
            <span className="text-[10px] text-gray-300 font-bold">
              {isTeamMode ? 'وضع الفرق 🔴 ضد 🔵' : 'نمط فردي'}
            </span>
            <span>
              {playersCountFormatted} / {maxPlayersFormatted}
            </span>
            {isHost && isTeamMode && (
              <button
                type="button"
                onClick={handleBalanceTeams}
                className="text-[10px] text-arcade-cyan hover:underline flex items-center gap-1"
                title="موازنة عدد اللاعبين بين الفريقين"
              >
                <Scale className="w-3 h-3" />
                <span>موازنة</span>
              </button>
            )}
          </div>

          {/* مساحة عرض اللاعبين في النمط الفردي */}
          {!isTeamMode && (
            <div className="bg-[#ccd7e6] p-4 min-h-[110px] flex items-center justify-start gap-4 overflow-x-auto">
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
          )}

          {/* مساحة عرض اللاعبين في نمط الفرق (الأحمر ضد الأزرق) */}
          {isTeamMode && (
            <div className="bg-[#ccd7e6] p-3 space-y-3">
              {/* الفريق الأحمر */}
              <div className="bg-red-950/20 border-2 border-red-500 rounded-2xl p-2.5">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-red-500/30">
                  <div className="flex items-center gap-1.5 text-xs font-black text-red-600">
                    <span>🔴 الفريق الأحمر</span>
                    <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">
                      {redPlayers.length}
                    </span>
                  </div>
                  {player?.teamId !== 'red' && (
                    <button
                      type="button"
                      onClick={() => handleSwitchTeam('red')}
                      className="px-2.5 py-1 rounded-xl bg-red-600 text-white font-black text-[11px] shadow-sm hover:bg-red-700 active:scale-95"
                    >
                      انضم للأحمر 🔴
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 overflow-x-auto py-1">
                  {redPlayers.map((p) => {
                    const isCurrent = p.id === player?.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => isCurrent && setIsEditingProfile(true)}
                        className="flex flex-col items-center shrink-0 cursor-pointer"
                      >
                        <div className="relative border-2 border-red-600 rounded-xl p-0.5 bg-red-100">
                          <ConsolePet avatar={p.avatar} size={46} />
                        </div>
                        <span className="text-[11px] font-black text-black mt-0.5 truncate max-w-[70px]">
                          {p.nickname} {isCurrent && '(أنت)'}
                        </span>
                      </div>
                    );
                  })}
                  {redPlayers.length === 0 && (
                    <span className="text-xs text-gray-500 font-bold py-2">لا يوجد لاعبين حتى الآن</span>
                  )}
                </div>
              </div>

              {/* الفريق الأزرق */}
              <div className="bg-blue-950/20 border-2 border-blue-500 rounded-2xl p-2.5">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-blue-500/30">
                  <div className="flex items-center gap-1.5 text-xs font-black text-blue-600">
                    <span>🔵 الفريق الأزرق</span>
                    <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full">
                      {bluePlayers.length}
                    </span>
                  </div>
                  {player?.teamId !== 'blue' && (
                    <button
                      type="button"
                      onClick={() => handleSwitchTeam('blue')}
                      className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black text-[11px] shadow-sm hover:bg-blue-700 active:scale-95"
                    >
                      انضم للأزرق 🔵
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 overflow-x-auto py-1">
                  {bluePlayers.map((p) => {
                    const isCurrent = p.id === player?.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => isCurrent && setIsEditingProfile(true)}
                        className="flex flex-col items-center shrink-0 cursor-pointer"
                      >
                        <div className="relative border-2 border-blue-600 rounded-xl p-0.5 bg-blue-100">
                          <ConsolePet avatar={p.avatar} size={46} />
                        </div>
                        <span className="text-[11px] font-black text-black mt-0.5 truncate max-w-[70px]">
                          {p.nickname} {isCurrent && '(أنت)'}
                        </span>
                      </div>
                    );
                  })}
                  {bluePlayers.length === 0 && (
                    <span className="text-xs text-gray-500 font-bold py-2">لا يوجد لاعبين حتى الآن</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* قسم الفئات والألغاز المطابق للثيم */}
      <div className="mb-4 bg-[#3a4460] rounded-3xl border-3 border-black p-3 shadow-[0_5px_0_#000] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#8b5cf6] border-2 border-black flex items-center justify-center shadow-[0_2px_0_#000]">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-white block">الفئات والألغاز</span>
            <span className="text-[10px] font-bold text-gray-300">
              {String(categoriesCount).padStart(2, '0')} فئات مختارة للجلسة
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            audio.playClick();
            setIsCategoryBrowserOpen(true);
          }}
          className="px-3 py-1.5 rounded-xl bg-arcade-yellow hover:bg-yellow-400 text-black font-black text-xs border-2 border-black shadow-[0_2px_0_#000] active:translate-y-0.5 transition-all flex items-center gap-1"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isHost ? 'تحديد الفئات' : 'استعراض الفئات'}</span>
        </button>
      </div>
      </div>

      {/* العمود 2: المشاركة وإعدادات الغرفة (على الحواسيب يظهر بجانب اللاعبين) */}
      <div className="lg:col-span-5 space-y-4">
      {/* قسم 2: المشاركة (QR، الرابط، إملاء الرمز، وسكان الكاميرا) */}
      <div className="mb-4 bg-[#3a4460] rounded-3xl border-3 border-black overflow-hidden shadow-[0_5px_0_#000]">
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

        {isSharingOpen && (
          <div className="bg-[#ccd7e6] p-4 flex flex-col items-center text-center">
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

            {isSpeaking && (
              <div className="w-full mb-3 px-3 py-1.5 bg-amber-200 border-2 border-black rounded-xl text-[11px] font-black text-amber-950 flex items-center justify-center gap-2 animate-bounce-subtle">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                <span>جارٍ إملاء رمز الغرفة صوتياً بالأرقام...</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleShareLink}
              className="w-full py-3.5 rounded-2xl bg-[#0070f3] hover:bg-[#0060df] text-white font-black text-sm border-3 border-black shadow-[0_5px_0_#0047a5] active:translate-y-1 active:shadow-[0_1px_0_#0047a5] transition-all flex items-center justify-center gap-2 mb-2"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedLink ? 'تم نسخ الرابط بنجاح! 🎉' : 'مشاركة الرابط'}</span>
            </button>

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

      {/* قسم 3: إعدادات اللعبة الشاملة (الوقت لكل جولة، وضع الفرق، عدد اللاعبين، عدد الجولات) */}
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
          <div className="bg-[#ccd7e6] p-4 space-y-4">
            {/* 1. نمط اللعبة: فردي ضد الكل أو تكتل فرق */}
            <div className="bg-white/80 border-2 border-black rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-black">نمط المنافسة:</span>
                <span className="text-[11px] font-bold text-gray-600">
                  {isTeamMode ? 'تكتل لاعبين ضد لاعبين' : 'كل لاعب لنفسه'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!isHost}
                  onClick={() => handleToggleGameMode('individual')}
                  className={`py-2 rounded-xl border-2 border-black font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_2px_0_#000] active:translate-y-0.5 ${
                    !isTeamMode
                      ? 'bg-arcade-yellow text-black'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>فردي (فردي ضد الكل)</span>
                </button>
                <button
                  type="button"
                  disabled={!isHost}
                  onClick={() => handleToggleGameMode('teams')}
                  className={`py-2 rounded-xl border-2 border-black font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_2px_0_#000] active:translate-y-0.5 ${
                    isTeamMode
                      ? 'bg-arcade-pink text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Swords className="w-4 h-4" />
                  <span>وضع الفرق ⚔️</span>
                </button>
              </div>
            </div>

            {/* 2. الوقت لكل جولة (عدد الثواني المسموح بها لكل سؤال) */}
            <div className="bg-white/80 border-2 border-black rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-right">
                  <div className="text-xs font-black text-black flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-arcade-cyan" />
                    <span>الوقت لكل جولة:</span>
                  </div>
                  <div className="text-[10px] font-bold text-gray-600">
                    عدد الثواني المسموح بها لكل سؤال
                  </div>
                </div>

                {/* التحكم الرقمي بالثواني مباشرة */}
                <div className="flex items-center gap-1">
                  {isHost && (
                    <button
                      type="button"
                      onClick={() => handleUpdateDuration(roundSeconds - 5)}
                      className="w-7 h-7 bg-white border-2 border-black rounded-lg text-black font-black flex items-center justify-center shadow-[0_2px_0_#000] active:translate-y-0.5"
                    >
                      -
                    </button>
                  )}
                  <div className="px-3 py-1 bg-white border-2 border-black rounded-xl text-sm font-black text-black min-w-[50px] text-center shadow-inner">
                    {roundSeconds} ث
                  </div>
                  {isHost && (
                    <button
                      type="button"
                      onClick={() => handleUpdateDuration(roundSeconds + 5)}
                      className="w-7 h-7 bg-white border-2 border-black rounded-lg text-black font-black flex items-center justify-center shadow-[0_2px_0_#000] active:translate-y-0.5"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              {/* أزرار الثواني السريعة */}
              {isHost && (
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[15, 30, 45, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleUpdateDuration(sec)}
                      className={`py-1 rounded-lg text-xs font-black border transition-all ${
                        roundSeconds === sec
                          ? 'bg-[#0070f3] text-white border-black shadow-[0_2px_0_#000]'
                          : 'bg-white/90 text-gray-700 border-gray-300 hover:border-black'
                      }`}
                    >
                      {sec} ثانية
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. تعيين عدد اللاعبين بالأرقام مباشرة */}
            <div className="bg-white/80 border-2 border-black rounded-2xl p-3 flex items-center justify-between">
              <div className="text-right">
                <div className="text-xs font-black text-black flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>الحد الأقصى للاعبين:</span>
                </div>
                <div className="text-[10px] font-bold text-gray-600">
                  سعة الغرفة وعدد اللاعبين المسموح به
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isHost && (
                  <button
                    type="button"
                    onClick={() => handleUpdateMaxPlayers(maxPlayers - 1)}
                    className="w-8 h-8 bg-white border-2 border-black rounded-xl text-black font-black flex items-center justify-center shadow-[0_2px_0_#000] active:translate-y-0.5 text-sm"
                  >
                    -
                  </button>
                )}
                <input
                  type="number"
                  min={2}
                  max={30}
                  value={maxPlayers}
                  disabled={!isHost}
                  onChange={(e) => handleUpdateMaxPlayers(Number(e.target.value))}
                  className="w-14 py-1.5 bg-white border-2 border-black rounded-xl text-center text-sm font-black text-black shadow-inner focus:outline-none"
                />
                {isHost && (
                  <button
                    type="button"
                    onClick={() => handleUpdateMaxPlayers(maxPlayers + 1)}
                    className="w-8 h-8 bg-white border-2 border-black rounded-xl text-black font-black flex items-center justify-center shadow-[0_2px_0_#000] active:translate-y-0.5 text-sm"
                  >
                    +
                  </button>
                )}
              </div>
            </div>

            {/* 4. تعيين عدد الجولات بالأرقام مباشرة */}
            <div className="bg-white/80 border-2 border-black rounded-2xl p-3 flex items-center justify-between">
              <div className="text-right">
                <div className="text-xs font-black text-black flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-purple-600" />
                  <span>عدد الجولات:</span>
                </div>
                <div className="text-[10px] font-bold text-gray-600">
                  إجمالي جولات الأسئلة قبل إعلان الفائز
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isHost && (
                  <button
                    type="button"
                    onClick={() => handleUpdateTotalRounds(totalRounds - 1)}
                    className="w-8 h-8 bg-white border-2 border-black rounded-xl text-black font-black flex items-center justify-center shadow-[0_2px_0_#000] active:translate-y-0.5 text-sm"
                  >
                    -
                  </button>
                )}
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={totalRounds}
                  disabled={!isHost}
                  onChange={(e) => handleUpdateTotalRounds(Number(e.target.value))}
                  className="w-14 py-1.5 bg-white border-2 border-black rounded-xl text-center text-sm font-black text-black shadow-inner focus:outline-none"
                />
                {isHost && (
                  <button
                    type="button"
                    onClick={() => handleUpdateTotalRounds(totalRounds + 1)}
                    className="w-8 h-8 bg-white border-2 border-black rounded-xl text-black font-black flex items-center justify-center shadow-[0_2px_0_#000] active:translate-y-0.5 text-sm"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
      </div>

      {/* الشريط السفلي الثابت (متجاوب ومركزي على الحواسيب والهواتف) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center">
        <div className="w-full max-w-md lg:max-w-xl bg-[#0070f3] rounded-3xl border-3 border-black p-3 shadow-[0_6px_0_#0047a5] flex flex-col items-center">
          <button
            type="button"
            onClick={() => {
              audio.playClick();
              setIsCategoryBrowserOpen(true);
            }}
            className="text-white text-xs font-black tracking-wide text-stroke-sm mb-2 text-center hover:underline cursor-pointer"
          >
            {String(categoriesCount).padStart(2, '0')} فئات &nbsp;•&nbsp; {playersCountFormatted} لاعبين {isTeamMode && '• وضع الفرق'} 🔍
          </button>

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
