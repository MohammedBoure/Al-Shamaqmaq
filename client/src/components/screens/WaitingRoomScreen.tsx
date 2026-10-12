import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { AudioToggle } from '../common/AudioToggle';
import { ThemeToggle } from '../common/ThemeToggle';
import { GameScaleControl } from '../common/GameScaleControl';
import { QRCodeView } from '../common/QRCodeView';
import { ConsolePet } from '../common/ConsolePet';
import { CharacterSelectScreen } from './CharacterSelectScreen';
import { TopicSummary } from '../../types';
import { useCodeDictation } from '../../hooks/useCodeDictation';

export const WaitingRoomScreen: React.FC = () => {
  const {
    room,
    player,
    startGame,
    leaveRoom,
    kickPlayer,
    updateSettings,
    updateProfile,
    topics,
    categoryGroups,
    toggleAllowedTopic,
    setAllowedTopicIdsList,
    haptic,
    audio,
  } = useGame();

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState<boolean>(false);
  const [preset, setPreset] = useState<'classic' | 'custom'>('classic');

  // إعدادات اللعبة
  const [roundSeconds, setRoundSeconds] = useState<number>(() => room?.roundDuration || 45);
  const [maxPlayers, setMaxPlayers] = useState<number>(() => room?.maxPlayers || 8);
  const [totalRounds, setTotalRounds] = useState<number>(() => room?.totalRounds || 10);
  const [gameMode, setGameMode] = useState<'individual' | 'teams'>(() => room?.gameMode || 'individual');

  // التحكم في طي/فتح أقسام التصنيفات
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    general: true,
    science: false,
    culture: false,
    custom: false,
  });

  // مزامنة الإعدادات من الغرفة
  useEffect(() => {
    if (room?.roundDuration) setRoundSeconds(room.roundDuration);
    if (room?.maxPlayers) setMaxPlayers(room.maxPlayers);
    if (room?.totalRounds) setTotalRounds(room.totalRounds);
    if (room?.gameMode) setGameMode(room.gameMode);
  }, [room?.roundDuration, room?.maxPlayers, room?.totalRounds, room?.gameMode]);

  // خطاف إملاء الرقم صوتياً
  const { isSpeaking, isSupported: isTtsSupported, dictateCode, stopDictation } = useCodeDictation();

  const roomCode = room?.code || '';
  const players = room?.players || [];
  const isHost = player?.isHost;
  const canStart = players.length >= 2;

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?join=${roomCode}`
    : `https://game/?join=${roomCode}`;

  const arabicNumbers: Record<string, string> = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
    '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
  };

  const toArabic = (num: number | string) => {
    return String(num).replace(/[0-9]/g, (w) => arabicNumbers[w] || w);
  };

  // المواضيع المسموحة
  const allowedTopicIds = useMemo(() => {
    if (Array.isArray(room?.allowedTopicIds)) {
      return new Set(room.allowedTopicIds);
    }
    return new Set(topics.map((t) => t.id));
  }, [room?.allowedTopicIds, topics]);

  const handleSelectRandomTopics = () => {
    if (!isHost || topics.length === 0) return;
    audio.playClick();
    const shuffled = [...topics].sort(() => 0.5 - Math.random());
    const count = Math.min(8, shuffled.length);
    const randomIds = shuffled.slice(0, count).map((t) => t.id);
    setAllowedTopicIdsList(randomIds);
  };

  const handleSelectAllTopics = () => {
    if (!isHost || topics.length === 0) return;
    audio.playClick();
    const allIds = topics.map((t) => t.id);
    setAllowedTopicIdsList(allIds);
  };

  const handleDeselectAllTopics = () => {
    if (!isHost) return;
    audio.playClick();
    setAllowedTopicIdsList([]);
  };

  const handleStartGame = () => {
    if (!canStart || allowedTopicIds.size === 0) {
      audio.playClick();
      return;
    }
    audio.playClick();
    startGame();
  };

  const handleCopyCode = async () => {
    audio.playClick();
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      haptic.triggerHaptic('success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (_) {}
  };

  const handleCopyLink = async () => {
    audio.playClick();
    try {
      await navigator.clipboard.readText();
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      haptic.triggerHaptic('success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (_) {}
  };

  const toggleCategoryAccordion = (catId: string) => {
    audio.playClick();
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleUpdateRounds = (rounds: number) => {
    setTotalRounds(rounds);
    if (isHost) {
      updateSettings({ totalRounds: rounds });
    }
  };

  const handleUpdateTimer = (seconds: number) => {
    setRoundSeconds(seconds);
    if (isHost) {
      updateSettings({ answerDuration: seconds });
    }
  };

  const handleUpdateMaxPlayers = (count: number) => {
    setMaxPlayers(count);
    if (isHost) {
      updateSettings({ maxPlayers: count });
    }
  };

  const handleUpdateGameMode = (mode: 'individual' | 'teams') => {
    setGameMode(mode);
    if (isHost) {
      updateSettings({ gameMode: mode });
    }
  };

  return (
    <div className="table-canvas-dark text-on-surface antialiased h-full max-h-full overflow-y-auto flex flex-col selection:bg-surface-bright selection:text-white">
      {/* Desktop Top App Bar */}
      <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/40">
        <div className="flex justify-between items-center w-full px-3.5 sm:px-6 md:px-8 max-w-5xl mx-auto h-14 sm:h-16">
          {/* Brand Logo & Context */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl font-black tracking-wider text-white flex items-center gap-2 font-mono">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white" />
              ESC
            </span>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-outline-variant" />
            <span className="hidden sm:inline-block text-[11px] sm:text-xs text-on-surface-variant font-medium">
              لعبة الخداع والبديهة
            </span>
          </div>

          {/* Mode Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant/60">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs text-on-surface-variant font-semibold">
              {isHost ? 'إعداد غرفة المضيف' : 'في انتظار بدء الجلسة'}
            </span>
          </div>

          {/* Actions & Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <AudioToggle />
            <ThemeToggle />
            <GameScaleControl />
            <button
              type="button"
              onClick={() => setIsCharacterModalOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-high border border-outline-variant/60 hover:scale-105 active:scale-95 transition-all flex items-center justify-center overflow-hidden"
              title="تخصيص شخصيتك"
            >
              <ConsolePet avatar={player?.avatar} size={36} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Configuration Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3.5 sm:px-6 md:px-8 pt-5 sm:pt-8 pb-32 sm:pb-36">
        {/* Sub-Header / Back & Preset Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            {/* Back Navigation Button */}
            <button
              type="button"
              onClick={leaveRoom}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/50 text-white text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px] rotate-180">arrow_back</span>
              <span>الردهة</span>
            </button>
            <div>
              <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">إعدادات الغرفة</h1>
              <p className="text-[11px] sm:text-sm text-on-surface-variant mt-0.5">تخصيص تجربة الخداع والمرح في ESC</p>
            </div>
          </div>

          {/* Preset Badge Cluster */}
          <div className="flex items-center self-start sm:self-auto gap-1 bg-surface-container-high mono-well p-1 rounded-xl border border-outline-variant/50">
            <button
              type="button"
              onClick={() => setPreset('classic')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                preset === 'classic'
                  ? 'bg-white text-surface-container-lowest shadow'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              جلسة كلاسيكية
            </button>
            <button
              type="button"
              onClick={() => setPreset('custom')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                preset === 'custom'
                  ? 'bg-white text-surface-container-lowest shadow'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              مخصص
            </button>
          </div>
        </div>

        {/* ROOM CODE & INVITE BANNER */}
        <section className="mono-card rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-surface-container-high border border-outline-variant/60 flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-xl sm:text-2xl">qr_code_2</span>
            </div>
            <div>
              <span className="text-[11px] sm:text-xs text-on-surface-variant font-medium">رمز الغرفة للمشاركين:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-mono font-black text-white tracking-widest">{roomCode}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-surface-container text-xs font-bold text-white hover:bg-surface-container-high border border-outline-variant/40 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px] sm:text-[15px]">
                    {copiedCode ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedCode ? 'تم' : 'نسخ'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
            {isTtsSupported && (
              <button
                type="button"
                onClick={() => (isSpeaking ? stopDictation() : dictateCode(roomCode))}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-[11px] sm:text-xs font-bold text-white flex items-center gap-1"
                title="إملاء الرمز صوتياً"
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
                  {isSpeaking ? 'volume_off' : 'record_voice_over'}
                </span>
                <span>{isSpeaking ? 'إيقاف' : 'إملاء'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsQRModalOpen(true)}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-[11px] sm:text-xs font-bold text-white flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">qr_code</span>
              <span>QR</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white text-surface-container-lowest text-[11px] sm:text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">share</span>
              <span>{copiedLink ? 'تم النسخ' : 'مشاركة الرابط'}</span>
            </button>
          </div>
        </section>

        {/* PLAYERS & CHARACTERS TABLE (KALAK ROSTER) */}
        <section className="mono-card rounded-2xl p-4 sm:p-6 mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">groups</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-white">طاولة اللاعبين في الغرفة</h2>
                  <span className="px-2 py-0.5 rounded-full bg-white text-surface-container-lowest text-[10px] sm:text-xs font-bold">
                    {toArabic(players.length)} / {toArabic(maxPlayers)}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-on-surface-variant">شخصيات المتنافسين الجالسين حول طاولة الخداع</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCharacterModalOpen(true)}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white text-surface-container-lowest text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 hover:bg-neutral-200 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">palette</span>
              <span>تخصيص شخصيتي</span>
            </button>
          </div>

          {/* Players Grid with live Kalak characters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5">
            {players.map((p) => {
              const isMe = p.id === player?.id;
              return (
                <div
                  key={p.id}
                  className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex flex-col items-center text-center ${
                    isMe
                      ? 'bg-surface-container-high/90 border-white/70 shadow-md ring-1 ring-white/30'
                      : 'bg-surface-container-low border-outline-variant/50'
                  }`}
                >
                  {/* Badges */}
                  <div className="w-full flex items-center justify-between mb-1">
                    {p.isHost ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-white text-surface-container-lowest text-[9px] sm:text-[10px] font-black flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[11px]">crown</span>
                        <span>مضيف</span>
                      </span>
                    ) : (
                      <span />
                    )}
                    {isMe && (
                      <span className="px-1.5 py-0.5 rounded-md bg-surface-container-highest border border-outline-variant/60 text-white text-[9px] sm:text-[10px] font-bold">
                        أنت
                      </span>
                    )}
                  </div>

                  {/* Character Avatar Icon */}
                  <div
                    onClick={() => isMe && setIsCharacterModalOpen(true)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-container border border-outline-variant/50 flex items-center justify-center overflow-hidden my-1 shadow-inner ${
                      isMe ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
                    }`}
                    title={isMe ? 'اضغط لتعديل شخصيتك' : p.nickname}
                  >
                    <ConsolePet avatar={p.avatar} size={62} />
                  </div>

                  {/* Nickname */}
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-full mt-1.5">
                    {p.nickname}
                  </h3>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-400 font-medium mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>متصل</span>
                  </div>

                  {/* Edit button if self */}
                  {isMe && (
                    <button
                      type="button"
                      onClick={() => setIsCharacterModalOpen(true)}
                      className="mt-2.5 w-full py-1 px-2 rounded-lg bg-surface-container hover:bg-surface-container-highest border border-outline-variant/50 text-[10px] sm:text-[11px] font-bold text-white transition-all flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                      <span>تعديل الشخصية</span>
                    </button>
                  )}

                  {/* زر طرد اللاعب (صلاحية خاصة بالمضيف) */}
                  {isHost && !p.isHost && !isMe && (
                    <button
                      type="button"
                      onClick={() => kickPlayer(p.id)}
                      className="mt-2.5 w-full py-1 px-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-[10px] sm:text-[11px] font-bold text-rose-300 transition-all flex items-center justify-center gap-1 active:scale-95"
                      title={`طرد ${p.nickname} من الغرفة`}
                    >
                      <span className="material-symbols-outlined text-[13px]">person_remove</span>
                      <span>طرد اللاعب</span>
                    </button>
                  )}
                </div>
              );
            })}

            {/* Empty Seats */}
            {Array.from({ length: Math.max(0, maxPlayers - players.length) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low/30 flex flex-col items-center justify-center text-center opacity-40 min-h-[140px]"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-outline-variant mb-2">
                  <span className="material-symbols-outlined text-[20px] sm:text-[24px]">chair</span>
                </div>
                <span className="text-[11px] text-outline font-semibold">مقعد شاغر</span>
                <span className="text-[9px] text-outline/60 mt-0.5">في انتظار انضمام لاعب</span>
              </div>
            ))}
          </div>
        </section>

        {/* Configuration Sections Stack */}
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* SECTION 1: Room Privacy & Access */}
          <section className="mono-card rounded-2xl p-4 sm:p-6 transition-all">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">lock</span>
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white">خصوصية الغرفة ونمط المنافسة</h2>
                  <p className="text-[11px] sm:text-xs text-on-surface-variant">التحكم في طريقة توزيع النقاط والمواجهات</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-surface-container-highest border border-outline-variant/60 text-white text-[10px] sm:text-xs font-medium">
                <span className="material-symbols-outlined text-[12px] sm:text-[14px]">security</span>
                مشفرة
              </span>
            </div>

            {/* Segmented Minimalist Pill Switch */}
            <div className="mono-well p-1 sm:p-1.5 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 mt-3">
              <button
                type="button"
                onClick={() => handleUpdateGameMode('individual')}
                className={`py-2 sm:py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all duration-150 ${
                  gameMode === 'individual'
                    ? 'font-bold bg-white text-surface-container-lowest shadow'
                    : 'font-semibold text-on-surface-variant hover:text-white hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">person</span>
                <span>فردي (كل لاعب لنفسه)</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdateGameMode('teams')}
                className={`py-2 sm:py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all duration-150 ${
                  gameMode === 'teams'
                    ? 'font-bold bg-white text-surface-container-lowest shadow'
                    : 'font-semibold text-on-surface-variant hover:text-white hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">swords</span>
                <span>قتال جماعي (فرق)</span>
              </button>
            </div>
          </section>

          {/* SECTION 2: Player Capacity */}
          <section className="mono-card rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">chair</span>
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white">سعة اللاعبين المتواجدين</h2>
                  <p className="text-[11px] sm:text-xs text-on-surface-variant">الموصى به ٦–٨ لاعبين لأفضل توازن وخداع</p>
                </div>
              </div>
              <div className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-white text-surface-container-lowest font-bold text-xs sm:text-sm tracking-tight flex items-center gap-1">
                <span>{toArabic(maxPlayers)}</span>
                <span className="text-[10px] sm:text-xs font-semibold">لاعبين</span>
              </div>
            </div>

            {/* Visual Table Seat Tokens Preview */}
            <div className="mono-well rounded-xl p-3 sm:p-4 mb-4 sm:mb-5">
              <div className="text-[11px] sm:text-xs text-on-surface-variant mb-2.5 flex justify-between items-center font-medium">
                <span>مقاعد طاولة اللعب</span>
                <span className="text-white font-bold">
                  {toArabic(players.length)} متواجدين · {toArabic(Math.max(0, maxPlayers - players.length))} شاغر
                </span>
              </div>

              {/* Seat Tokens Row (up to 12) */}
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2 justify-items-center">
                {Array.from({ length: 12 }).map((_, idx) => {
                  const seatNumber = idx + 1;
                  const isSeatEnabled = seatNumber <= maxPlayers;
                  const connectedPlayer = players[idx];

                  if (connectedPlayer) {
                    return (
                      <div
                        key={idx}
                        onClick={() => connectedPlayer.id === player?.id && setIsCharacterModalOpen(true)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container-high border border-outline-variant/80 flex items-center justify-center overflow-hidden shadow-sm transition-all relative group cursor-pointer hover:scale-110"
                        title={connectedPlayer.nickname}
                      >
                        <ConsolePet avatar={connectedPlayer.avatar} size={28} />
                        {connectedPlayer.isHost && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white border border-surface-container-lowest" />
                        )}
                      </div>
                    );
                  }

                  if (isSeatEnabled) {
                    return (
                      <div
                        key={idx}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container-high border border-outline-variant/60 text-white flex items-center justify-center text-[10px] sm:text-xs font-semibold opacity-60"
                        title="مقعد متاح"
                      >
                        {toArabic(seatNumber)}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container border border-dashed border-outline-variant/30 text-outline-variant flex items-center justify-center text-[10px] sm:text-xs opacity-30"
                    >
                      {toArabic(seatNumber)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stepper / Range Slider Controls */}
            {isHost && (
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-xs text-on-surface-variant font-bold">٣</span>
                <div className="flex-1 relative flex items-center">
                  <input
                    type="range"
                    min={3}
                    max={12}
                    step={1}
                    value={maxPlayers}
                    onChange={(e) => handleUpdateMaxPlayers(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>
                <span className="text-xs text-on-surface-variant font-bold">١٢</span>
              </div>
            )}
          </section>

          {/* SECTION 3: Round & Timer Settings */}
          <section className="mono-card rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">timer</span>
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">إيقاع الجولات والتوقيت</h2>
                <p className="text-[11px] sm:text-xs text-on-surface-variant">ضبط مدة المباراة وسرعة تقديم إجابات الخداع</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Rounds Selector */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-on-surface-variant">sports_score</span>
                    <span>عدد الجولات</span>
                  </label>
                  <span className="text-[11px] sm:text-xs text-on-surface-variant">
                    حوالي {toArabic(totalRounds * 3)} دقيقة
                  </span>
                </div>
                <div className="mono-well p-1 rounded-xl grid grid-cols-4 gap-1 sm:gap-1.5">
                  {[3, 5, 10, 15].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleUpdateRounds(r)}
                      disabled={!isHost}
                      className={`py-1.5 sm:py-2 rounded-lg text-xs transition-all ${
                        totalRounds === r
                          ? 'font-bold bg-white text-surface-container-lowest shadow'
                          : 'font-semibold text-on-surface-variant hover:text-white'
                      }`}
                    >
                      {toArabic(r)} جولات
                    </button>
                  ))}
                </div>
              </div>

              {/* Answer Timer Selector */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-on-surface-variant">hourglass_empty</span>
                    <span>مهلة تقديم الخدعة</span>
                  </label>
                  <span className="text-xs text-white font-bold">{toArabic(roundSeconds)} ثانية</span>
                </div>
                <div className="mono-well p-1 rounded-xl grid grid-cols-3 gap-1 sm:gap-1.5">
                  {[30, 45, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleUpdateTimer(sec)}
                      disabled={!isHost}
                      className={`py-1.5 sm:py-2 rounded-lg text-xs transition-all ${
                        roundSeconds === sec
                          ? 'font-bold bg-white text-surface-container-lowest shadow'
                          : 'font-semibold text-on-surface-variant hover:text-white'
                      }`}
                    >
                      {toArabic(sec)} ثانية
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: Categories & Card Decks */}
          <section className="mono-card rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">layers</span>
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white">حزم البطاقات والتصنيفات</h2>
                  <p className="text-[11px] sm:text-xs text-on-surface-variant">اختر التصنيفات العامة وفصّل الفئات الفرعية النشطة</p>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-highest border border-outline-variant/60">
                  <span className="material-symbols-outlined text-[14px] text-white">done_all</span>
                  <span className="text-xs font-bold text-white">
                    {toArabic(allowedTopicIds.size)} تصنيفات نشطة
                  </span>
                </div>

                {isHost && (
                  <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-high border border-outline-variant/50">
                    <button
                      type="button"
                      onClick={handleSelectRandomTopics}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-white hover:bg-white/10 transition-all flex items-center gap-1 active:scale-95"
                      title="اختيار ٨ تصنيفات عشوائية متوازنة"
                    >
                      <span className="material-symbols-outlined text-[14px]">casino</span>
                      <span>عشوائي 🎲</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllTopics}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-white hover:bg-white/10 transition-all flex items-center gap-1 active:scale-95"
                      title="تحديد كافة التصنيفات المتاحة"
                    >
                      <span className="material-symbols-outlined text-[14px]">select_all</span>
                      <span>تحديد الكل</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllTopics}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-on-surface-variant hover:text-rose-400 hover:bg-white/10 transition-all flex items-center gap-1 active:scale-95"
                      title="إلغاء تحديد كافة التصنيفات"
                    >
                      <span className="material-symbols-outlined text-[14px]">deselect</span>
                      <span>إلغاء الكل</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* تنبيه في حال تم إلغاء تحديد كافة التصنيفات */}
            {allowedTopicIds.size === 0 && (
              <div className="p-3 sm:p-3.5 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>لم يتم تحديد أي تصنيف! يرجى اختيار تصنيف واحد على الأقل أو الضغط على «عشوائي 🎲» لبدء اللعبة.</span>
              </div>
            )}

            {/* STACKED RECTANGULAR CATEGORY BARS */}
            <div className="flex flex-col gap-3">
              {categoryGroups && categoryGroups.length > 0 ? (
                categoryGroups.map((group) => {
                  const isExpanded = !!expandedCategories[group.id];
                  const groupTopics = group.subtopics || [];
                  const activeInGroup = groupTopics.filter((t) => allowedTopicIds.has(t.id)).length;

                  return (
                    <div
                      key={group.id}
                      className="border border-outline-variant/50 rounded-xl bg-surface-container-low overflow-hidden transition-all duration-200"
                    >
                      {/* Header Bar */}
                      <button
                        type="button"
                        onClick={() => toggleCategoryAccordion(group.id)}
                        className="w-full p-3.5 sm:p-4 flex items-center justify-between text-right hover:bg-surface-container transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-white shrink-0">
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                              {group.id === 'science' ? 'science' : group.id === 'sports' ? 'sports_soccer' : 'psychology'}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-xs sm:text-sm font-bold text-white">{group.title}</span>
                              <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] bg-surface-container-highest text-on-surface-variant border border-outline-variant/30">
                                {toArabic(groupTopics.reduce((acc: number, t: TopicSummary) => acc + (t.puzzleCount || 0), 0))} بطاقة
                              </span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5">{group.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-[11px] sm:text-xs font-bold text-white bg-surface-container px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-outline-variant/40">
                            {toArabic(activeInGroup)}/{toArabic(groupTopics.length)} مفعلة
                          </span>
                          <span
                            className={`material-symbols-outlined text-[18px] sm:text-[20px] text-on-surface-variant transform transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          >
                            expand_more
                          </span>
                        </div>
                      </button>

                      {/* Expanded Body: Grid of Sub-categories */}
                      {isExpanded && (
                        <div className="px-3.5 sm:px-4 pb-4 pt-1 border-t border-outline-variant/30">
                          <p className="text-[11px] text-on-surface-variant mb-2.5 font-semibold">
                            الفئات الفرعية المضمنة في هذه الحزمة:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                            {groupTopics.map((topic) => {
                              const isChecked = allowedTopicIds.has(topic.id);
                              return (
                                <div
                                  key={topic.id}
                                  onClick={() => isHost && toggleAllowedTopic(topic.id)}
                                  className={`p-3 rounded-xl transition-all flex flex-col justify-between h-24 sm:h-28 cursor-pointer ${
                                    isChecked
                                      ? 'border border-white/80 bg-surface-container-high hover:border-white'
                                      : 'border border-outline-variant/50 bg-surface-container hover:border-white/50 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-surface-container flex items-center justify-center text-white">
                                      <span className="material-symbols-outlined text-[16px] sm:text-[18px]">menu_book</span>
                                    </div>
                                    <div
                                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                        isChecked
                                          ? 'bg-white text-surface-container-lowest'
                                          : 'border border-outline text-transparent'
                                      }`}
                                    >
                                      <span className="material-symbols-outlined text-[13px] sm:text-[14px] font-bold">check</span>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-white truncate">{topic.title}</h4>
                                    <span className="text-[10px] text-on-surface-variant">
                                      {toArabic(topic.puzzleCount)} بطاقة
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                topics.map((t) => {
                  const isChecked = allowedTopicIds.has(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => isHost && toggleAllowedTopic(t.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'border-white/80 bg-surface-container-high text-white'
                          : 'border-outline-variant/40 bg-surface-container-low text-on-surface-variant opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[18px]">layers</span>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white">{t.title}</div>
                          <div className="text-[11px] text-on-surface-variant">{toArabic(t.puzzleCount)} بطاقة</div>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isChecked
                            ? 'bg-white text-surface-container-lowest'
                            : 'border border-outline text-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">check</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Sticky Bottom Action Bar with Monochrome Aesthetics */}
      <footer className="fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/40 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-8 py-2.5 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3.5">
          {/* Room Summary Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-surface-container-low border border-outline-variant/50">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold text-white tracking-wide">
              {toArabic(players.length)} لاعبين · {toArabic(totalRounds)} جولات · {toArabic(allowedTopicIds.size)} تصنيفات
            </span>
          </div>

          {/* Primary CTA */}
          {isHost ? (
            <button
              type="button"
              onClick={handleStartGame}
              disabled={!canStart || allowedTopicIds.size === 0}
              className="w-full sm:w-auto bg-white hover:bg-[#e3e2e2] text-surface-container-lowest font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md group disabled:opacity-40"
            >
              <span>
                {allowedTopicIds.size === 0
                  ? 'اختر تصنيفاً واحداً على الأقل للبدء'
                  : canStart
                  ? 'بدء اللعبة الآن'
                  : 'في انتظار اكتمال اللاعبين (٢ على الأقل)'}
              </span>
              <span className="material-symbols-outlined text-[16px] sm:text-[18px] transform rotate-180 transition-transform group-hover:-translate-x-1">
                arrow_back
              </span>
            </button>
          ) : (
            <div className="text-[11px] sm:text-xs text-on-surface-variant font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-white animate-spin">sync</span>
              <span>في انتظار المضيف لبدء الجولة...</span>
            </div>
          )}
        </div>
      </footer>

      {/* QR Code Modal */}
      {isQRModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setIsQRModalOpen(false)}
          />
          <div className="relative w-full max-w-sm z-20 dark-monochrome-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/10 text-center animate-fadeIn">
            <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/30 mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-base font-bold text-white">رمز استجابة الغرفة (QR)</h3>
              <button
                type="button"
                onClick={() => setIsQRModalOpen(false)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl">close</span>
              </button>
            </div>

            <div className="flex justify-center my-2 sm:my-3">
              <QRCodeView value={joinUrl} size={190} />
            </div>

            <div className="text-base sm:text-lg font-mono font-bold text-white tracking-widest my-1.5 sm:my-2">
              {roomCode}
            </div>

            <p className="text-[11px] sm:text-xs text-on-surface-variant mt-1.5">
              اطلب من أصدقائك مسح الرمز بكاميرا الهاتف للانضمام مباشرة
            </p>
          </div>
        </div>
      )}

      {/* Character Customization Modal in Waiting Room */}
      {isCharacterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
          <div className="w-full max-w-lg h-full max-h-[95vh] overflow-y-auto">
            <CharacterSelectScreen
              initialNickname={player?.nickname}
              initialAvatar={player?.avatar}
              onSave={(newName, newAvatar) => {
                updateProfile(newName, newAvatar);
                setIsCharacterModalOpen(false);
              }}
              onBack={() => setIsCharacterModalOpen(false)}
              actionButtonText="تحديث وحفظ في الغرفة"
            />
          </div>
        </div>
      )}
    </div>
  );
};
