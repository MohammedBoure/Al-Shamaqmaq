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
    addBot,
    removeBot,
    haptic,
    audio,
  } = useGame();

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState<boolean>(false);

  // إعدادات اللعبة
  const [roundSeconds, setRoundSeconds] = useState<number>(() => room?.roundDuration || 45);
  const [maxPlayers, setMaxPlayers] = useState<number>(() => room?.maxPlayers || 8);
  const [totalRounds, setTotalRounds] = useState<number>(() => room?.totalRounds || 10);
  const [gameMode, setGameMode] = useState<'individual' | 'teams'>(() => room?.gameMode || 'individual');

  // التحكم في طي/فتح أقسام التصنيفات (افتراضياً مفتوحة لتسهيل الرؤية)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // مزامنة الإعدادات من الغرفة
  useEffect(() => {
    if (room?.roundDuration) setRoundSeconds(room.roundDuration);
    if (room?.maxPlayers) setMaxPlayers(room.maxPlayers);
    if (room?.totalRounds) setTotalRounds(room.totalRounds);
    if (room?.gameMode) setGameMode(room.gameMode);
  }, [room?.roundDuration, room?.maxPlayers, room?.totalRounds, room?.gameMode]);

  // خطاف إملاء الرقم صوتياً
  const { isSpeaking, isSupported: isTtsSupported, dictateCode, stopDictation } = useCodeDictation();

  const getCategoryIcon = (groupId: string, iconName?: string) => {
    const map: Record<string, string> = {
      science: 'science',
      flaskconical: 'science',
      general: 'psychology',
      helpcircle: 'help',
      sports: 'sports_soccer',
      trophy: 'emoji_events',
      anime_cartoons: 'auto_awesome',
      tv: 'tv',
      celebrities_arts: 'palette',
      palette: 'palette',
      video_games: 'sports_esports',
      gamepad2: 'sports_esports',
    };
    const key = (iconName || groupId).toLowerCase();
    return map[key] || map[groupId.toLowerCase()] || 'layers';
  };

  const getCategoryDisplayName = (groupId: string, title?: string) => {
    if (title && title !== groupId && !title.includes('_')) return title;
    const map: Record<string, string> = {
      anime_cartoons: 'أنمي ورسوم متحركة',
      video_games: 'ألعاب فيديو',
      science: 'علوم',
      general: 'معلومات عامة',
      sports: 'رياضة',
      celebrities_arts: 'مشاهير وفنون',
    };
    return map[groupId.toLowerCase()] || title || groupId;
  };

  const roomCode = room?.code || '';
  const players = room?.players || [];
  const isHost = player?.isHost;
  const canStart = players.length >= 2;

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?join=${roomCode}`
    : `https://game/?join=${roomCode}`;

  // المواضيع المسموحة
  const allowedTopicIds = useMemo(() => {
    if (Array.isArray(room?.allowedTopicIds)) {
      return new Set(room.allowedTopicIds);
    }
    return new Set(topics.map((t) => t.id));
  }, [room?.allowedTopicIds, topics]);

  const toggleCategoryAccordion = (catId: string) => {
    audio.playClick();
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: prev[catId] === undefined ? false : !prev[catId],
    }));
  };

  const handleToggleCategoryGroup = (groupTopics: TopicSummary[], e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isHost) return;
    audio.playClick();
    const subtopicIds = groupTopics.map((t) => t.id);
    const allSelected = subtopicIds.every((id) => allowedTopicIds.has(id));

    const newSet = new Set(allowedTopicIds);
    if (allSelected) {
      subtopicIds.forEach((id) => newSet.delete(id));
    } else {
      subtopicIds.forEach((id) => newSet.add(id));
    }
    setAllowedTopicIdsList(Array.from(newSet));
  };

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
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      haptic.triggerHaptic('success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (_) {}
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

  const emptySeatsCount = Math.max(0, maxPlayers - players.length);

  return (
    <div className="table-canvas-dark text-on-surface antialiased min-h-full flex-1 w-full flex flex-col selection:bg-surface-bright selection:text-white">
      {/* Floating Borderless Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30">
        <div className="flex justify-between items-center w-full px-4 max-w-xl mx-auto h-14">
          {/* Back button + Brand */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={leaveRoom}
              className="w-9 h-9 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/50 text-white flex items-center justify-center transition-all active:scale-95"
              title="مغادرة الغرفة"
            >
              <span className="material-symbols-outlined text-[18px] rotate-180">arrow_back</span>
            </button>
            <span className="text-lg font-black tracking-wider text-white font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white" />
              ESC
            </span>
          </div>

          {/* User Character & Controls */}
          <div className="flex items-center gap-1.5">
            <AudioToggle />
            <ThemeToggle />
            <GameScaleControl />
            <button
              type="button"
              onClick={() => setIsCharacterModalOpen(true)}
              className="w-9 h-9 rounded-lg bg-surface-container-high border border-outline-variant/60 hover:scale-105 active:scale-95 transition-all flex items-center justify-center overflow-hidden"
              title="تخصيص شخصيتك"
            >
              <ConsolePet avatar={player?.avatar} size={32} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Single-Column Content */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-4 pb-28 flex flex-col gap-4">
        {/* 1. Slim Room Code Bar */}
        <section className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-on-surface-variant font-semibold">الغرفة</span>
            <span className="text-2xl font-mono font-black text-white tracking-widest">{roomCode}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-white transition-all active:scale-95 flex items-center justify-center"
              title="نسخ الرمز"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copiedCode ? 'check' : 'content_copy'}
              </span>
            </button>

            {isTtsSupported && (
              <button
                type="button"
                onClick={() => (isSpeaking ? stopDictation() : dictateCode(roomCode))}
                className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-white transition-all active:scale-95 flex items-center justify-center"
                title="إملاء الرمز صوتياً"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSpeaking ? 'volume_off' : 'record_voice_over'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsQRModalOpen(true)}
              className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-white transition-all active:scale-95 flex items-center justify-center"
              title="رمز QR"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-white text-surface-container-lowest text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              <span>{copiedLink ? 'تم' : 'مشاركة'}</span>
            </button>
          </div>
        </section>

        {/* 2. Players Roster */}
        <section className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">اللاعبون</h2>
              <span className="px-2 py-0.5 rounded-lg bg-surface-container-high text-[11px] font-bold text-white border border-outline-variant/40">
                {players.length} / {maxPlayers}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isHost && (
                <>
                  <button
                    type="button"
                    onClick={addBot}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="إضافة روبوت تجريبي لتجربة اللعبة بمفردك"
                  >
                    <span className="material-symbols-outlined text-[15px]">smart_toy</span>
                    <span>+ بوت تجريبي</span>
                  </button>
                  {players.some((p) => p.isBot) && (
                    <button
                      type="button"
                      onClick={() => removeBot()}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-500/40 px-2 py-1 rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      title="إزالة الروبوت"
                    >
                      <span>إزالة البوت</span>
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => setIsCharacterModalOpen(true)}
                className="text-xs font-semibold text-on-surface-variant hover:text-white flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">palette</span>
                <span>تعديل شخصيتي</span>
              </button>
            </div>
          </div>

          {/* تلميح مساعدة عند وجود لاعب واحد فقط */}
          {players.length < 2 && (
            <div className="mb-3 p-2.5 rounded-lg bg-surface-container/70 border border-outline-variant/30 text-xs text-on-surface-variant flex items-center justify-between gap-2">
              <span>💡 يمكنك مشاركة رمز الغرفة، أو الضغط على <b>+ بوت تجريبي</b> لتجربة اللعبة فوراً بمفردك!</span>
              {isHost && (
                <button
                  type="button"
                  onClick={addBot}
                  className="bg-white hover:bg-neutral-200 text-surface-container-lowest text-xs font-bold px-2.5 py-1 rounded-md shrink-0 active:scale-95 transition-all cursor-pointer"
                >
                  إضافة بوت 🤖
                </button>
              )}
            </div>
          )}

          {/* Compact Players Wrap */}
          <div className="flex flex-wrap gap-2.5">
            {players.map((p) => {
              const isMe = p.id === player?.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-2.5 py-1.5 px-3 rounded-lg border transition-all ${
                    isMe
                      ? 'bg-surface-container-high border-white/60 shadow-xs ring-1 ring-white/20'
                      : 'bg-surface-container border-outline-variant/40'
                  }`}
                >
                  <div
                    onClick={() => isMe && setIsCharacterModalOpen(true)}
                    className={`w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center overflow-hidden shrink-0 ${
                      isMe ? 'cursor-pointer hover:scale-105 transition-transform' : ''
                    }`}
                  >
                    <ConsolePet avatar={p.avatar} size={30} />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-white truncate max-w-[90px] sm:max-w-[120px]">
                        {p.nickname}
                      </span>
                      {p.isHost && (
                        <span className="material-symbols-outlined text-[13px] text-amber-400" title="المضيف">
                          crown
                        </span>
                      )}
                      {p.isBot && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-500/30">
                          بوت
                        </span>
                      )}
                      {isMe && (
                        <span className="text-[9px] font-bold text-on-surface-variant">
                          (أنت)
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {p.isBot ? 'روبوت آلي' : 'متصل'}
                    </span>
                  </div>

                  {isHost && !p.isHost && !isMe && (
                    <button
                      type="button"
                      onClick={() => (p.isBot ? removeBot(p.id) : kickPlayer(p.id))}
                      className="w-6 h-6 rounded-md text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center justify-center transition-colors mr-1 cursor-pointer"
                      title={p.isBot ? 'إزالة الروبوت' : `طرد ${p.nickname}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              );
            })}

            {/* Subtle empty seat indicators */}
            {Array.from({ length: Math.min(emptySeatsCount, 6) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="w-9 h-9 rounded-lg border border-dashed border-outline-variant/40 flex items-center justify-center text-outline-variant/60"
                title="مقعد شاغر"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </div>
            ))}
            {emptySeatsCount > 6 && (
              <div className="h-9 px-2.5 rounded-lg border border-dashed border-outline-variant/40 flex items-center justify-center text-[10px] text-on-surface-variant">
                +{emptySeatsCount - 6}
              </div>
            )}
          </div>
        </section>

        {/* 3. Combined Game Rules Settings */}
        <section className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-4 flex flex-col gap-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">إعدادات الجلسة</h2>
            <div className="inline-flex rounded-lg bg-surface-container p-0.5 border border-outline-variant/40">
              <button
                type="button"
                onClick={() => handleUpdateGameMode('individual')}
                disabled={!isHost}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  gameMode === 'individual'
                    ? 'bg-white text-surface-container-lowest shadow-xs'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                فردي
              </button>
              <button
                type="button"
                onClick={() => handleUpdateGameMode('teams')}
                disabled={!isHost}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  gameMode === 'teams'
                    ? 'bg-white text-surface-container-lowest shadow-xs'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                فرق
              </button>
            </div>
          </div>

          {/* Segmented Controls Rows with Standard Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Player Capacity */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-on-surface-variant font-semibold">سعة اللاعبين</span>
              <div className="mono-well p-1 rounded-lg grid grid-cols-4 gap-1">
                {[4, 6, 8, 12].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleUpdateMaxPlayers(count)}
                    disabled={!isHost}
                    className={`py-1 rounded-md text-xs font-bold transition-all ${
                      maxPlayers === count
                        ? 'bg-white text-surface-container-lowest shadow-xs'
                        : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Rounds Count */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-on-surface-variant font-semibold">عدد الجولات</span>
              <div className="mono-well p-1 rounded-lg grid grid-cols-4 gap-1">
                {[3, 5, 10, 15].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleUpdateRounds(r)}
                    disabled={!isHost}
                    className={`py-1 rounded-md text-xs font-bold transition-all ${
                      totalRounds === r
                        ? 'bg-white text-surface-container-lowest shadow-xs'
                        : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Duration */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-on-surface-variant font-semibold">مهلة الإجابة</span>
              <div className="mono-well p-1 rounded-lg grid grid-cols-3 gap-1">
                {[30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleUpdateTimer(sec)}
                    disabled={!isHost}
                    className={`py-1 rounded-md text-xs font-bold transition-all ${
                      roundSeconds === sec
                        ? 'bg-white text-surface-container-lowest shadow-xs'
                        : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    {sec}ث
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Categories & Sub-Categories Selection */}
        <section className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">حزم الأسئلة والتصنيفات</h2>
              <span className="px-2 py-0.5 rounded-lg bg-surface-container-high text-[11px] font-bold text-white border border-outline-variant/40">
                {allowedTopicIds.size} مفعلة
              </span>
            </div>

            {isHost && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectRandomTopics}
                  className="px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-[11px] font-semibold text-white transition-all active:scale-95"
                  title="اختيار 8 تصنيفات عشوائية"
                >
                  عشوائي 🎲
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllTopics}
                  className="px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-[11px] font-semibold text-white transition-all active:scale-95"
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllTopics}
                  className="px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-[11px] font-semibold text-on-surface-variant hover:text-rose-400 transition-all active:scale-95"
                >
                  مسح
                </button>
              </div>
            )}
          </div>

          {allowedTopicIds.size === 0 && (
            <div className="p-2.5 mb-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              <span>يرجى اختيار تصنيف واحد على الأقل للبدء!</span>
            </div>
          )}

          {/* Categories Groups with Sub-categories Accordions */}
          <div className="flex flex-col gap-2.5">
            {categoryGroups && categoryGroups.length > 0 ? (
              categoryGroups.map((group) => {
                const isExpanded = expandedCategories[group.id] !== false; // Default to open
                const groupTopics = group.subtopics || [];
                const activeInGroup = groupTopics.filter((t) => allowedTopicIds.has(t.id)).length;
                const totalCards = groupTopics.reduce((acc, t) => acc + (t.puzzleCount || 0), 0);
                const allSelectedInGroup = groupTopics.length > 0 && activeInGroup === groupTopics.length;

                return (
                  <div
                    key={group.id}
                    className="border border-outline-variant/40 rounded-lg bg-surface-container/40 overflow-hidden transition-all duration-200"
                  >
                    {/* Category Header */}
                    <div
                      onClick={() => toggleCategoryAccordion(group.id)}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-surface-container/70 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-white shrink-0">
                          <span className="material-symbols-outlined text-[18px]">
                            {getCategoryIcon(group.id, group.icon)}
                          </span>
                        </div>
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {getCategoryDisplayName(group.id, group.title)}
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-medium px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/30 shrink-0">
                            {totalCards} بطاقة
                          </span>
                        </div>
                      </div>

                      {/* Actions & Status on Left */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-bold text-white bg-surface-container px-2 py-0.5 rounded-md border border-outline-variant/40">
                          {activeInGroup}/{groupTopics.length} مفعلة
                        </span>

                        {isHost && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleCategoryGroup(groupTopics, e)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all active:scale-95 ${
                              allSelectedInGroup
                                ? 'bg-white text-surface-container-lowest border-white shadow-xs'
                                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-outline-variant/50'
                            }`}
                            title="تحديد أو إلغاء كل الفئات الفرعية في هذا التصنيف"
                          >
                            {allSelectedInGroup ? 'محدد' : 'تحديد'}
                          </button>
                        )}

                        <span
                          className={`material-symbols-outlined text-[18px] text-on-surface-variant transform transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        >
                          expand_more
                        </span>
                      </div>
                    </div>

                    {/* Sub-categories Grid */}
                    {isExpanded && (
                      <div className="p-2.5 pt-1 border-t border-outline-variant/20 bg-surface-container-lowest/30">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {groupTopics.map((subtopic) => {
                            const isChecked = allowedTopicIds.has(subtopic.id);
                            return (
                              <button
                                key={subtopic.id}
                                type="button"
                                onClick={() => isHost && toggleAllowedTopic(subtopic.id)}
                                disabled={!isHost}
                                className={`p-2 rounded-lg border text-right transition-all flex items-center justify-between gap-1.5 ${
                                  isChecked
                                    ? 'border-white/70 bg-surface-container-high text-white shadow-xs'
                                    : 'border-outline-variant/30 bg-surface-container/60 text-on-surface-variant opacity-60 hover:opacity-90'
                                }`}
                              >
                                <div className="min-w-0">
                                  <span className="text-[11px] font-bold block truncate">
                                    {subtopic.title}
                                  </span>
                                  <span className="text-[9px] text-on-surface-variant block">
                                    {subtopic.puzzleCount} بطاقة
                                  </span>
                                </div>
                                <span
                                  className={`w-3.5 h-3.5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                                    isChecked
                                      ? 'bg-white text-surface-container-lowest'
                                      : 'border border-outline-variant text-transparent'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[10px] font-bold">
                                    check
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              /* Fallback if categoryGroups is still loading or flat */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {topics.map((t) => {
                  const isChecked = allowedTopicIds.has(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => isHost && toggleAllowedTopic(t.id)}
                      disabled={!isHost}
                      className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between gap-2 ${
                        isChecked
                          ? 'border-white/70 bg-surface-container-high text-white shadow-xs'
                          : 'border-outline-variant/30 bg-surface-container text-on-surface-variant opacity-60 hover:opacity-80'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{t.title}</span>
                        <span className="text-[10px] text-on-surface-variant block mt-0.5">
                          {t.puzzleCount || 0} بطاقة
                        </span>
                      </div>
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isChecked
                            ? 'bg-white text-surface-container-lowest'
                            : 'border border-outline-variant text-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Sticky Bottom Action Bar */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 py-3 px-4">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs text-on-surface-variant font-medium hidden sm:block">
            {players.length} لاعبين · {totalRounds} جولات
          </div>

          {isHost ? (
            <button
              type="button"
              onClick={handleStartGame}
              disabled={!canStart || allowedTopicIds.size === 0}
              className="w-full sm:w-auto bg-white hover:bg-neutral-200 text-surface-container-lowest font-bold py-2.5 px-8 rounded-lg text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md disabled:opacity-40"
            >
              <span>
                {allowedTopicIds.size === 0
                  ? 'اختر تصنيفاً واحداً للبدء'
                  : canStart
                  ? 'بدء اللعبة'
                  : 'في انتظار لاعب آخر (2 على الأقل)'}
              </span>
              <span className="material-symbols-outlined text-[16px] rotate-180">arrow_back</span>
            </button>
          ) : (
            <div className="w-full text-center text-xs text-on-surface-variant font-medium flex items-center justify-center gap-1.5 py-1">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>في انتظار المضيف لبدء اللعبة...</span>
            </div>
          )}
        </div>
      </footer>

      {/* QR Code Modal */}
      {isQRModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsQRModalOpen(false)}
          />
          <div className="relative w-full max-w-sm z-20 bg-surface-container-low rounded-xl p-5 border border-outline-variant/50 text-center animate-fadeIn shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30 mb-3">
              <h3 className="text-sm font-bold text-white">رمز QR للغرفة</h3>
              <button
                type="button"
                onClick={() => setIsQRModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex justify-center my-3 bg-white p-3 rounded-lg max-w-fit mx-auto">
              <QRCodeView value={joinUrl} size={180} />
            </div>

            <div className="text-xl font-mono font-black text-white tracking-widest my-2">
              {roomCode}
            </div>

            <p className="text-xs text-on-surface-variant">
              امسح الرمز بكاميرا الهاتف للانضمام مباشرة
            </p>
          </div>
        </div>
      )}

      {/* Character Customization Modal */}
      {isCharacterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CharacterSelectScreen
              initialNickname={player?.nickname}
              initialAvatar={player?.avatar}
              onSave={(newName, newAvatar) => {
                updateProfile(newName, newAvatar);
                setIsCharacterModalOpen(false);
              }}
              onBack={() => setIsCharacterModalOpen(false)}
              actionButtonText="حفظ ومتابعة"
            />
          </div>
        </div>
      )}
    </div>
  );
};
