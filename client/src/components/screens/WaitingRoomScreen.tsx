import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { AudioToggle } from '../common/AudioToggle';
import { ThemeToggle } from '../common/ThemeToggle';
import { GameScaleControl } from '../common/GameScaleControl';
import { QRCodeView } from '../common/QRCodeView';
import { ConsolePet } from '../common/ConsolePet';
import { CharacterSelectScreen } from './CharacterSelectScreen';
import { TopicSummary, DEFAULT_TEAMS, TeamConfig } from '../../types';
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
    joinTeam,
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
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState<boolean>(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState<string>('');
  const [lanIp, setLanIp] = useState<string | null>(null);
  const [availableIps, setAvailableIps] = useState<string[]>([]);

  // إعدادات اللعبة
  const [roundSeconds, setRoundSeconds] = useState<number>(() => room?.roundDuration || 45);
  const [maxPlayers, setMaxPlayers] = useState<number>(() => room?.maxPlayers || 40);
  const [totalRounds, setTotalRounds] = useState<number>(() => room?.totalRounds || 10);
  const [gameMode, setGameMode] = useState<'individual' | 'teams'>(() => room?.gameMode || 'individual');
  const [teamCount, setTeamCount] = useState<number>(() => room?.teamCount || 2);

  // التحكم في طي/فتح أقسام التصنيفات
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // مزامنة الإعدادات من الغرفة
  useEffect(() => {
    if (room?.roundDuration) setRoundSeconds(room.roundDuration);
    if (room?.maxPlayers) setMaxPlayers(room.maxPlayers);
    if (room?.totalRounds) setTotalRounds(room.totalRounds);
    if (room?.gameMode) setGameMode(room.gameMode);
    if (room?.teamCount) setTeamCount(room.teamCount);
  }, [room?.roundDuration, room?.maxPlayers, room?.totalRounds, room?.gameMode, room?.teamCount]);

  // جلب عنوان الشبكة المحلية (LAN IP) حتى يعمل الرابط ورمز QR على الهواتف والأجهزة الأخرى
  useEffect(() => {
    fetch('/api/network-info')
      .then((res) => res.json())
      .then((data) => {
        if (data?.lanIp) {
          setLanIp(data.lanIp);
        }
        if (Array.isArray(data?.allIps)) {
          setAvailableIps(data.allIps);
        }
      })
      .catch(() => {});
  }, []);

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

  // ترتيب اللاعبين بشكل منظم: المضيف أولاً، ثم اللاعب الحالي، ثم اللاعبين المتصلين، ثم البوتات
  const orderedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      if (a.isHost && !b.isHost) return -1;
      if (!a.isHost && b.isHost) return 1;
      if (a.id === player?.id && b.id !== player?.id) return -1;
      if (a.id !== player?.id && b.id === player?.id) return 1;
      if (Boolean(a.isBot) !== Boolean(b.isBot)) return a.isBot ? 1 : -1;
      return 0;
    });
  }, [players, player?.id]);

  const activeTeams: TeamConfig[] = useMemo(() => {
    if (room?.teams && room.teams.length > 0) {
      return room.teams.slice(0, teamCount);
    }
    return DEFAULT_TEAMS.slice(0, teamCount);
  }, [room?.teams, teamCount]);

  const joinUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return `https://game/?join=${roomCode}`;
    }
    const { protocol, hostname, port, pathname } = window.location;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    const effectiveHost = isLocalhost && lanIp ? lanIp : hostname;
    const portSuffix = port ? `:${port}` : '';
    return `${protocol}//${effectiveHost}${portSuffix}${pathname}?join=${roomCode}`;
  }, [roomCode, lanIp]);

  const shareMessageText = useMemo(() => {
    return `انضموا إليّ في لعبة الخداع والبديهة ESC! 🎭\nرمز الغرفة: ${roomCode}\nرابط الدخول المباشر:\n${joinUrl}`;
  }, [roomCode, joinUrl]);

  const copyTextCrossPlatform = async (text: string): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_) {
        // Fallback below
      }
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, text.length);
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (_) {
      return false;
    }
  };

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
    const ok = await copyTextCrossPlatform(roomCode);
    if (ok) {
      setCopiedCode(true);
      haptic.triggerHaptic('success');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    audio.playClick();
    const ok = await copyTextCrossPlatform(joinUrl);
    if (ok) {
      setCopiedLink(true);
      haptic.triggerHaptic('success');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyInviteMessage = async () => {
    audio.playClick();
    const ok = await copyTextCrossPlatform(shareMessageText);
    if (ok) {
      setCopiedInvite(true);
      haptic.triggerHaptic('success');
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    audio.playClick();
    haptic.triggerHaptic('light');
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `غرفة ESC (${roomCode})`,
          text: `انضموا إليّ في لعبة الخداع والبديهة ESC! رمز الغرفة: ${roomCode}`,
          url: joinUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    await handleCopyLink();
  };

  const handleToggleShareDrawer = () => {
    audio.playClick();
    haptic.triggerHaptic('light');
    setIsShareOpen((prev) => !prev);
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
    const clamped = Math.min(Math.max(2, count), 40);
    setMaxPlayers(clamped);
    if (isHost) {
      updateSettings({ maxPlayers: clamped });
    }
  };

  const handleUpdateGameMode = (mode: 'individual' | 'teams') => {
    setGameMode(mode);
    if (isHost) {
      updateSettings({ gameMode: mode });
    }
  };

  const handleUpdateTeamCount = (count: number) => {
    const clamped = Math.min(Math.max(2, count), 8);
    setTeamCount(clamped);
    if (isHost) {
      updateSettings({ teamCount: clamped });
    }
  };

  const handleUpdateTeamMaxPlayers = (teamId: string, nextMax: number) => {
    if (!isHost) return;
    const clamped = Math.min(Math.max(1, nextMax), 40);
    updateSettings({
      teamIdToUpdate: {
        id: teamId,
        maxPlayers: clamped,
      },
    });
  };

  const handleSaveTeamName = (teamId: string) => {
    if (!isHost) return;
    const clean = editingTeamName.trim();
    if (clean) {
      updateSettings({
        teamIdToUpdate: {
          id: teamId,
          name: clean,
        },
      });
    }
    setEditingTeamId(null);
    setEditingTeamName('');
  };

  const emptySeatsCount = Math.max(0, maxPlayers - players.length);

  return (
    <div className="table-canvas-dark text-on-surface antialiased min-h-full flex-1 w-full flex flex-col selection:bg-surface-bright selection:text-white">
      {/* Floating Borderless Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30">
        <div className="flex justify-between items-center w-full px-4 max-w-2xl mx-auto h-14">
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

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4 pb-28 flex flex-col gap-4">
        {/* 1. Compact Room Code Bar + Slide-Down Share Panel */}
        <section className="bg-surface-container-low border border-outline-variant/50 rounded-xl overflow-hidden shadow-xs transition-all">
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-on-surface-variant font-semibold">رمز الغرفة</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-2xl font-mono font-black text-white tracking-widest hover:text-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5"
                title="اضغط لنسخ الرمز"
              >
                <span>{roomCode}</span>
                {copiedCode && (
                  <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    تم النسخ ✓
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleShareDrawer}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer ${
                isShareOpen
                  ? 'bg-surface-container-highest text-white border border-white/40'
                  : 'bg-white hover:bg-neutral-200 text-surface-container-lowest'
              }`}
              title="مشاركة الغرفة وعرض رمز QR"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isShareOpen ? 'expand_less' : 'share'}
              </span>
              <span>مشاركة</span>
            </button>
          </div>

          {/* Slide-Down Share Panel: QR Code in the Middle + All Share Options Underneath */}
          {isShareOpen && (
            <div className="px-4 pb-4 pt-3 border-t border-outline-variant/30 bg-surface-container-lowest/50 flex flex-col items-center gap-3.5 animate-fadeIn">
              {/* Centered QR Code */}
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="bg-white p-2.5 rounded-xl shadow-md border border-white/80">
                  <QRCodeView value={joinUrl} size={148} />
                </div>
                <span className="text-sm font-mono font-black text-white tracking-widest mt-0.5">
                  {roomCode}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  امسح رمز QR بكاميرا الهاتف للانضمام مباشرة
                </span>
              </div>

              {/* Direct Link Input & LAN IP Selector */}
              <div className="w-full bg-surface-container p-2 rounded-lg border border-outline-variant/40 flex flex-col gap-1.5">
                {availableIps.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-on-surface-variant font-semibold">
                      عنوان الشبكة المحلية:
                    </span>
                    <select
                      value={lanIp || ''}
                      onChange={(e) => setLanIp(e.target.value)}
                      className="bg-surface-container-low text-white text-[10px] rounded px-1.5 py-0.5 border border-outline-variant/40 font-mono"
                    >
                      {availableIps.map((ip) => (
                        <option key={ip} value={ip}>
                          {ip}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    dir="ltr"
                    value={joinUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 bg-surface-container-lowest border border-outline-variant/40 rounded-md px-2.5 py-1.5 text-[11px] font-mono text-white focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-md bg-white hover:bg-neutral-200 text-surface-container-lowest text-xs font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {copiedLink ? 'check' : 'link'}
                    </span>
                    <span>{copiedLink ? 'تم النسخ ✓' : 'نسخ الرابط'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons Grid Underneath the QR Code */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="py-2 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedCode ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedCode ? 'تم نسخ الرمز ✓' : 'نسخ الرمز'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyInviteMessage}
                  className="py-2 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedInvite ? 'check' : 'assignment'}
                  </span>
                  <span>{copiedInvite ? 'تم نسخ الدعوة ✓' : 'نسخ الدعوة'}</span>
                </button>

                {isTtsSupported && (
                  <button
                    type="button"
                    onClick={() => (isSpeaking ? stopDictation() : dictateCode(roomCode))}
                    className="py-2 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isSpeaking ? 'volume_off' : 'record_voice_over'}
                    </span>
                    <span>{isSpeaking ? 'إيقاف النطق' : 'نطق الرمز صوتياً'}</span>
                  </button>
                )}

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareMessageText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => audio.playClick()}
                  className="py-2 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>واتساب</span>
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(joinUrl)}&text=${encodeURIComponent(
                    `انضموا إليّ في لعبة ESC! رمز الغرفة: ${roomCode}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => audio.playClick()}
                  className="py-2 px-2.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>تيليجرام</span>
                </a>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="py-2 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">ios_share</span>
                  <span>تطبيقات الجهاز...</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 2. Combined Game Rules Settings (Individual vs Teams, Max Players up to 40, Team Count up to 8) */}
        <section className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-4 flex flex-col gap-3.5 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-bold text-white">إعدادات الجلسة والفرق</h2>
            <div className="inline-flex rounded-lg bg-surface-container p-0.5 border border-outline-variant/40">
              <button
                type="button"
                onClick={() => handleUpdateGameMode('individual')}
                disabled={!isHost}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  gameMode === 'individual'
                    ? 'bg-white text-surface-container-lowest shadow-xs'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                فردي 👤
              </button>
              <button
                type="button"
                onClick={() => handleUpdateGameMode('teams')}
                disabled={!isHost}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  gameMode === 'teams'
                    ? 'bg-white text-surface-container-lowest shadow-xs'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                فرق 🛡️ (حتى 8 فرق)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Player Capacity up to 40 */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant font-semibold">سعة الغرفة الكلية</span>
                <span className="text-[11px] font-black text-white font-mono">{maxPlayers} لاعب</span>
              </div>
              <div className="mono-well p-1 rounded-lg grid grid-cols-5 gap-1">
                {[8, 16, 24, 32, 40].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleUpdateMaxPlayers(count)}
                    disabled={!isHost}
                    className={`py-1 rounded-md text-[11px] font-bold transition-all ${
                      maxPlayers === count
                        ? 'bg-white text-surface-container-lowest shadow-xs'
                        : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              {isHost && (
                <input
                  type="range"
                  min={2}
                  max={40}
                  value={maxPlayers}
                  onChange={(e) => handleUpdateMaxPlayers(parseInt(e.target.value, 10))}
                  className="w-full accent-white h-1.5 cursor-pointer mt-0.5"
                />
              )}
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

          {/* Number of Teams Control (2 to 8 Teams) when in Team Mode */}
          {gameMode === 'teams' && (
            <div className="pt-2 border-t border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-400">groups</span>
                <div>
                  <span className="text-xs font-bold text-white block">عدد الفرق المتنافسة ({teamCount} فرق)</span>
                  <span className="text-[10px] text-on-surface-variant">
                    يمكن لكل لاعب اختيار فريقه، ويمكن للمضيف تخصيص اسم وسعة كل فريق
                  </span>
                </div>
              </div>
              <div className="mono-well p-1 rounded-lg grid grid-cols-7 gap-1 shrink-0">
                {[2, 3, 4, 5, 6, 7, 8].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => handleUpdateTeamCount(cnt)}
                    disabled={!isHost}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                      teamCount === cnt
                        ? 'bg-white text-surface-container-lowest shadow-xs'
                        : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 3. Players & Teams Roster */}
        {gameMode === 'teams' ? (
          <section className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">تشكيلة الفرق واللاعبين</h2>
                <span className="px-2 py-0.5 rounded-lg bg-surface-container-high text-[11px] font-bold text-white border border-outline-variant/40">
                  {players.length} / {maxPlayers} لاعب
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeTeams.map((team) => {
                const teamPlayers = orderedPlayers.filter((p) => p.teamId === team.id);
                const isMyTeam = player?.teamId === team.id;
                const isFull = teamPlayers.length >= team.maxPlayers;
                const teamTotalScore = teamPlayers.reduce((sum, p) => sum + (p.score || 0), 0);

                return (
                  <div
                    key={team.id}
                    className={`rounded-xl border p-3 flex flex-col justify-between gap-2.5 transition-all ${
                      isMyTeam
                        ? 'bg-surface-container-high/90 shadow-md ring-1'
                        : 'bg-surface-container/60 border-outline-variant/40'
                    }`}
                    style={{
                      borderColor: isMyTeam ? team.color : undefined,
                      boxShadow: isMyTeam ? `0 0 0 1px ${team.color}40` : undefined,
                    }}
                  >
                    {/* Team Header: Color, Name, Score, Custom Capacity Controls */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-outline-variant/30">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: team.color }}
                        />

                        {editingTeamId === team.id && isHost ? (
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <input
                              type="text"
                              value={editingTeamName}
                              onChange={(e) => setEditingTeamName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTeamName(team.id);
                              }}
                              maxLength={24}
                              autoFocus
                              className="w-full bg-surface-container-lowest border border-white/40 rounded px-2 py-0.5 text-xs font-bold text-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveTeamName(team.id)}
                              className="p-1 rounded bg-white text-surface-container-lowest text-xs font-bold shrink-0"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                              {team.name}
                            </span>
                            {isHost && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTeamId(team.id);
                                  setEditingTeamName(team.name);
                                }}
                                className="text-on-surface-variant hover:text-white p-0.5 rounded transition-colors shrink-0"
                                title="تغيير اسم الفريق"
                              >
                                <span className="material-symbols-outlined text-[13px]">edit</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Score + Custom Team Player Limit */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-black border"
                          style={{
                            backgroundColor: `${team.color}20`,
                            borderColor: `${team.color}50`,
                            color: '#ffffff',
                          }}
                        >
                          {teamTotalScore} ن
                        </span>

                        <div
                          className="flex items-center gap-1 bg-surface-container-lowest px-1.5 py-0.5 rounded-md border border-outline-variant/40"
                          title="سعة اللاعبين المخصصة لهذا الفريق"
                        >
                          {isHost && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTeamMaxPlayers(team.id, team.maxPlayers - 1)}
                              disabled={team.maxPlayers <= 1}
                              className="w-4 h-4 rounded bg-surface-container hover:bg-surface-container-high text-white flex items-center justify-center text-[11px] font-bold disabled:opacity-30"
                              title="تقليل سعة الفريق"
                            >
                              -
                            </button>
                          )}
                          <span className="text-[10px] font-mono font-bold text-on-surface-variant px-0.5">
                            {teamPlayers.length}/{team.maxPlayers}
                          </span>
                          {isHost && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTeamMaxPlayers(team.id, team.maxPlayers + 1)}
                              disabled={team.maxPlayers >= 40}
                              className="w-4 h-4 rounded bg-surface-container hover:bg-surface-container-high text-white flex items-center justify-center text-[11px] font-bold disabled:opacity-30"
                              title="زيادة سعة الفريق"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Team Players Ordered List */}
                    <div className="flex flex-col gap-1.5 min-h-[48px] justify-center">
                      {teamPlayers.length > 0 ? (
                        teamPlayers.map((p, idx) => {
                          const isMe = p.id === player?.id;
                          return (
                            <div
                              key={p.id}
                              className={`flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg border text-xs transition-all ${
                                isMe
                                  ? 'bg-surface-container-lowest border-white/60 text-white font-bold shadow-xs'
                                  : 'bg-surface-container-low border-outline-variant/40 text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-mono font-bold text-on-surface-variant w-4 text-center shrink-0">
                                  #{idx + 1}
                                </span>
                                <div
                                  onClick={() => isMe && setIsCharacterModalOpen(true)}
                                  className={`w-7 h-7 rounded-md bg-surface-container flex items-center justify-center overflow-hidden shrink-0 ${
                                    isMe ? 'cursor-pointer hover:scale-105 transition-transform' : ''
                                  }`}
                                >
                                  <ConsolePet avatar={p.avatar} size={24} />
                                </div>
                                <span className="truncate max-w-[110px]">{p.nickname}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {p.isHost && (
                                  <span
                                    className="material-symbols-outlined text-[13px] text-amber-400"
                                    title="مضيف الغرفة"
                                  >
                                    crown
                                  </span>
                                )}
                                {p.isBot && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-500/30">
                                    بوت
                                  </span>
                                )}
                                {isMe && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">
                                    أنت
                                  </span>
                                )}
                                {isHost && !p.isHost && !isMe && (
                                  <button
                                    type="button"
                                    onClick={() => (p.isBot ? removeBot(p.id) : kickPlayer(p.id))}
                                    className="w-5 h-5 rounded text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 flex items-center justify-center cursor-pointer"
                                    title={p.isBot ? 'إزالة الروبوت' : `طرد ${p.nickname}`}
                                  >
                                    <span className="material-symbols-outlined text-[13px]">close</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-2.5 text-center rounded-lg border border-dashed border-outline-variant/30 text-[11px] text-on-surface-variant">
                          لا يوجد لاعبون في هذا الفريق بعد
                        </div>
                      )}
                    </div>

                    {/* Join Team Action Button */}
                    <div className="pt-1">
                      {isMyTeam ? (
                        <div
                          className="w-full py-1.5 px-3 rounded-lg text-center text-[11px] font-bold flex items-center justify-center gap-1 border"
                          style={{
                            backgroundColor: `${team.color}25`,
                            borderColor: `${team.color}60`,
                            color: '#ffffff',
                          }}
                        >
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          <span>فريقك الحالي</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isFull}
                          onClick={() => joinTeam(team.id)}
                          className="w-full py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 border bg-surface-container-low hover:bg-surface-container-highest text-white border-outline-variant/50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isFull ? 'block' : 'login'}
                          </span>
                          <span>{isFull ? 'الفريق ممتلئ' : `انضمام إلى ${team.name}`}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          /* Individual Mode Roster */
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {orderedPlayers.map((p, idx) => {
                const isMe = p.id === player?.id;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-2.5 py-2 px-3 rounded-xl border transition-all ${
                      isMe
                        ? 'bg-surface-container-high border-white/60 shadow-xs ring-1 ring-white/20'
                        : 'bg-surface-container border-outline-variant/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-surface-container-lowest border border-outline-variant/40 text-[10px] font-mono font-bold text-on-surface-variant flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      <div
                        onClick={() => isMe && setIsCharacterModalOpen(true)}
                        className={`w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center overflow-hidden shrink-0 ${
                          isMe ? 'cursor-pointer hover:scale-105 transition-transform' : ''
                        }`}
                      >
                        <ConsolePet avatar={p.avatar} size={30} />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate max-w-[115px] sm:max-w-[140px]">
                            {p.nickname}
                          </span>
                          {p.isHost && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40"
                              title="مضيف الغرفة"
                            >
                              <span className="material-symbols-outlined text-[11px]">crown</span>
                              <span>مضيف</span>
                            </span>
                          )}
                          {p.isBot && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-500/30">
                              بوت
                            </span>
                          )}
                          {isMe && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">
                              أنت
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {p.isBot ? 'روبوت آلي جاهز' : 'متصل وجاهز'}
                        </span>
                      </div>
                    </div>

                    {isHost && !p.isHost && !isMe && (
                      <button
                        type="button"
                        onClick={() => (p.isBot ? removeBot(p.id) : kickPlayer(p.id))}
                        className="w-7 h-7 rounded-lg text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        title={p.isBot ? 'إزالة الروبوت' : `طرد ${p.nickname}`}
                      >
                        <span className="material-symbols-outlined text-[15px]">close</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {emptySeatsCount > 0 && (
              <div className="mt-2.5 pt-2 border-t border-outline-variant/25 flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>المقاعد المتبقية في الغرفة:</span>
                <span className="font-mono font-bold text-white">{emptySeatsCount} مقعد متاح</span>
              </div>
            )}
          </section>
        )}

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

          <div className="flex flex-col gap-2.5">
            {categoryGroups && categoryGroups.length > 0 ? (
              categoryGroups.map((group) => {
                const isExpanded = expandedCategories[group.id] !== false;
                const groupTopics = group.subtopics || [];
                const activeInGroup = groupTopics.filter((t) => allowedTopicIds.has(t.id)).length;
                const totalCards = groupTopics.reduce((acc, t) => acc + (t.puzzleCount || 0), 0);
                const allSelectedInGroup = groupTopics.length > 0 && activeInGroup === groupTopics.length;

                return (
                  <div
                    key={group.id}
                    className="border border-outline-variant/40 rounded-lg bg-surface-container/40 overflow-hidden transition-all duration-200"
                  >
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
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs text-on-surface-variant font-medium hidden sm:block">
            {players.length} لاعبين · {gameMode === 'teams' ? `${teamCount} فرق · ` : ''}{totalRounds} جولات
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
