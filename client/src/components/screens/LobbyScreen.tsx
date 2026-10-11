import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { AudioToggle } from '../common/AudioToggle';
import { ThemeToggle } from '../common/ThemeToggle';
import { CameraQRScanner } from '../common/CameraQRScanner';
import { ConsolePet, serializePet, DEFAULT_PET_CONFIG } from '../common/ConsolePet';
import { CharacterSelectScreen } from './CharacterSelectScreen';

export const LobbyScreen: React.FC = () => {
  const { createRoom, joinRoom, topics, audio, haptic } = useGame();

  // الحالة المحفوظة للمستخدم
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('deception_player_nickname') || 'ميلو';
  });
  const [avatar, setAvatar] = useState<string>(() => {
    return localStorage.getItem('deception_player_avatar') || serializePet(DEFAULT_PET_CONFIG);
  });
  const [quickCode, setQuickCode] = useState<string>('');

  // النوافذ المنبثقة
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditNicknameOpen, setIsEditNicknameOpen] = useState<boolean>(false);
  const [isEditCharacterOpen, setIsEditCharacterOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [activeBottomNav, setActiveBottomNav] = useState<'lobby' | 'packs' | 'stats'>('lobby');

  // خانات رمز الغرفة المقسمة لـ 4 أحرف
  const [codeBoxes, setCodeBoxes] = useState<string[]>(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // إعدادات إنشاء الغرفة السريعة
  const [totalRounds, setTotalRounds] = useState<number>(10);
  const [answerDuration, setAnswerDuration] = useState<number>(45);
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // قراءة كود الغرفة الممرر عبر الرابط تلقائياً
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlCode = searchParams.get('join') || searchParams.get('code') || searchParams.get('room');
      if (urlCode) {
        const cleanCode = urlCode.toUpperCase().slice(0, 4);
        setQuickCode(cleanCode);
        const chars = cleanCode.split('');
        const filled = Array(4).fill('').map((_, i) => chars[i] || '');
        setCodeBoxes(filled);
        setIsJoinModalOpen(true);
      }
    } catch (_) {}
  }, []);

  const handleSaveNickname = (newName: string) => {
    const trimmed = newName.trim();
    if (trimmed) {
      setNickname(trimmed);
      localStorage.setItem('deception_player_nickname', trimmed);
    }
    setIsEditNicknameOpen(false);
  };

  const handleSaveCharacter = (newName: string, newAvatar: string) => {
    const trimmed = newName.trim();
    if (trimmed) {
      setNickname(trimmed);
      localStorage.setItem('deception_player_nickname', trimmed);
    }
    if (newAvatar) {
      setAvatar(newAvatar);
      localStorage.setItem('deception_player_avatar', newAvatar);
    }
    setIsEditCharacterOpen(false);
  };

  const handleBoxChange = (index: number, val: string) => {
    const upper = val.toUpperCase().slice(-1);
    const newBoxes = [...codeBoxes];
    newBoxes[index] = upper;
    setCodeBoxes(newBoxes);

    if (upper && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeBoxes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const clean = text.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
      if (clean) {
        const chars = clean.split('');
        const newBoxes = Array(4).fill('').map((_, i) => chars[i] || '');
        setCodeBoxes(newBoxes);
        audio.playClick();
        haptic.triggerHaptic('success');
      }
    } catch (_) {}
  };

  const fullEnteredCode = codeBoxes.join('').trim();

  const handleJoinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = fullEnteredCode || quickCode.trim().toUpperCase();
    if (!code || !nickname.trim()) return;

    audio.playClick();
    haptic.triggerHaptic('medium');
    joinRoom(code, nickname, avatar);
  };

  const handleCreateSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nickname.trim() || isCreating) return;

    setIsCreating(true);
    audio.playClick();
    haptic.triggerHaptic('heavy');

    const success = await createRoom(
      nickname,
      avatar,
      topics.map((t) => t.id),
      {
        totalRounds,
        answerDuration,
        maxPlayers,
        gameMode: 'individual',
      }
    );

    setIsCreating(false);
    if (success) {
      setIsCreateModalOpen(false);
    }
  };

  const handleScannedCode = (scanned: string) => {
    const clean = scanned.trim().toUpperCase().slice(0, 4);
    const chars = clean.split('');
    const newBoxes = Array(4).fill('').map((_, i) => chars[i] || '');
    setCodeBoxes(newBoxes);
    setQuickCode(clean);
    setIsScannerOpen(false);
    setIsJoinModalOpen(true);
    audio.playClick();
    haptic.triggerHaptic('success');
  };

  return (
    <div className="h-full max-h-full overflow-y-auto table-canvas-dark text-on-surface antialiased flex flex-col justify-between selection:bg-surface-bright selection:text-white relative">
      {/* ماسح الكاميرا لرموز QR */}
      <CameraQRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScannedCode}
      />

      {/* TOP APP BAR */}
      <header className="bg-surface/85 backdrop-blur-md top-0 sticky z-40 border-b border-outline-variant/30">
        <div className="flex justify-between items-center w-full px-3.5 sm:px-6 md:px-8 max-w-5xl mx-auto h-14 sm:h-16">
          {/* User Profile Badge & Editable Character / Nickname */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* ConsolePet Avatar Token */}
            <div
              onClick={() => setIsEditCharacterOpen(true)}
              className="relative group cursor-pointer"
              title="تخصيص شخصيتك في ESC"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-surface-container-high border border-outline-variant/60 p-0.5 transition-transform duration-200 group-hover:scale-110 active:scale-95 flex items-center justify-center overflow-hidden">
                <ConsolePet avatar={avatar} size={36} />
              </div>
              <span className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white border-2 border-surface-container-lowest rounded-full" />
            </div>

            {/* Editable Nickname Tag in Arabic */}
            <button
              type="button"
              onClick={() => setIsEditCharacterOpen(true)}
              aria-label="تعديل الشخصية والاسم"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-surface-container-low border border-outline-variant/40 hover:bg-surface-container text-on-surface transition-colors duration-150 active:scale-95 text-right"
            >
              <span className="text-xs sm:text-sm tracking-tight font-bold text-white">{nickname}</span>
              <span className="text-on-surface-variant text-[10px] sm:text-[11px]">• تخصيص</span>
              <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-outline mr-0.5">palette</span>
            </button>
          </div>

          {/* Trailing Action Icons (Sound Toggle & Settings) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <AudioToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* MAIN CANVAS */}
      <main className="flex-grow flex flex-col justify-center items-center px-3.5 sm:px-6 py-6 sm:py-8 pb-28 sm:pb-32 max-w-xl mx-auto w-full">
        {/* HERO CENTERPIECE */}
        <div className="w-full text-center mb-6 sm:mb-8 relative">
          {/* Decorative subtle accents */}
          <div className="absolute -top-3 right-4 sm:right-6 text-on-surface-variant/40 select-none animate-pulse">
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">auto_awesome</span>
          </div>
          <div className="absolute top-1 left-4 sm:left-8 text-on-surface-variant/40 select-none">
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">star</span>
          </div>

          {/* Parlor Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/90 border border-outline-variant/50 text-on-surface-variant text-[11px] sm:text-xs mb-2.5 sm:mb-3 font-medium">
            <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-white">diversity_3</span>
            <span>جلسة ألعاب جماعية ذكية</span>
          </div>

          {/* Wordmark: ESC in Monochrome Minimalist Typography */}
          <div className="relative inline-block my-0.5 sm:my-1">
            <h1 className="text-5xl sm:text-6xl md:text-7xl text-white font-black tracking-widest select-none uppercase font-mono">
              ESC
            </h1>
            {/* Minimalist monochrome subtle curved baseline accent */}
            <svg
              className="w-20 sm:w-28 h-2 sm:h-2.5 mx-auto mt-0.5 text-outline opacity-40"
              fill="none"
              viewBox="0 0 112 12"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M2 3C32 10 80 10 110 3" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
            </svg>
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-on-surface-variant mt-2 sm:mt-3 max-w-xs mx-auto leading-relaxed font-normal">
            لعبة الخداع الذكي والتخمين الحاسم.
          </p>

          {/* Interactive Character Showcase Badge */}
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => setIsEditCharacterOpen(true)}
              className="inline-flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/50 hover:border-white transition-all active:scale-95 shadow-sm group cursor-pointer"
              title="تخصيص شخصيتك في ESC"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface-container-high border border-outline-variant/50 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                <ConsolePet avatar={avatar} size={36} />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-white">{nickname}</span>
                  <span className="material-symbols-outlined text-[14px] text-outline group-hover:text-white transition-colors">edit</span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-on-surface-variant block">اضغط لتخصيص شخصيتك وأقنعتك 🎭</span>
              </div>
            </button>
          </div>
        </div>

        {/* PRIMARY ACTION DECK */}
        <div className="w-full space-y-3.5 sm:space-y-4 mb-6 sm:mb-8">
          {/* 1. CREATE GAME CARD (Primary Dark Charcoal & Crisp White High-Contrast) */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full text-right bg-white text-surface-container-lowest hover:bg-neutral-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] dark-card-primary flex items-center justify-between group cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-center gap-3 sm:gap-4 relative z-10">
              {/* Crisp Icon Well */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-surface-container-lowest flex items-center justify-center text-white shrink-0 shadow-inner">
                <span className="material-symbols-outlined text-[24px] sm:text-[28px]">add_circle</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-surface-container-lowest">إنشاء لعبة</h2>
                  <span className="bg-surface-container-high text-white text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full font-bold">المضيف</span>
                </div>
                <p className="text-xs sm:text-sm text-surface-variant mt-0.5 font-medium">
                  استضافة غرفة وضبط قواعد مخصصة
                </p>
              </div>
            </div>
            {/* Arrow (Flipped for RTL) */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-lowest/10 flex items-center justify-center text-surface-container-lowest transition-transform duration-200 group-hover:-translate-x-1 shrink-0 relative z-10">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] rtl:rotate-180">arrow_forward</span>
            </div>
          </button>

          {/* 2. JOIN GAME CARD (Slate/Charcoal Minimalist Action) */}
          <button
            type="button"
            onClick={() => setIsJoinModalOpen(true)}
            className="w-full text-right bg-surface-container-high/70 hover:bg-surface-container-high border border-outline-variant/50 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] dark-card-secondary flex items-center justify-between group cursor-pointer relative backdrop-blur-md"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Recessed Slate Icon Container */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-surface-container-low flex items-center justify-center text-white shrink-0 border border-outline-variant/40">
                <span className="material-symbols-outlined text-[24px] sm:text-[28px]">meeting_room</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white">الانضمام إلى لعبة</h2>
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-outline">qr_code_scanner</span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5 font-medium">
                  أدخل رمز الغرفة أو امسح رمز الاستجابة السريعة (QR)
                </p>
              </div>
            </div>
            {/* Arrow (Flipped for RTL) */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-transform duration-200 group-hover:-translate-x-1 shrink-0 border border-outline-variant/30">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] rtl:rotate-180">arrow_forward</span>
            </div>
          </button>

          {/* TACTILE RECESSED INPUT / QUICK CODE WELL */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (quickCode.trim()) {
                const clean = quickCode.trim().toUpperCase().slice(0, 6);
                const chars = clean.split('');
                const newBoxes = Array(6).fill('').map((_, i) => chars[i] || '');
                setCodeBoxes(newBoxes);
                joinRoom(clean, nickname, avatar);
              }
            }}
            className="bg-surface-container-low border border-outline-variant/40 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl dark-pill-recessed flex items-center gap-2 sm:gap-3"
          >
            <div className="pr-1.5 sm:pr-2 text-outline flex items-center">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">tag</span>
            </div>
            <input
              type="text"
              maxLength={8}
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
              placeholder="لديك رمز غرفة؟ (مثال: KAL9AB)"
              className="bg-transparent border-none text-white text-xs sm:text-sm md:text-base placeholder:text-outline focus:ring-0 w-full p-0 tracking-wider font-semibold placeholder:text-xs text-right focus:outline-none"
            />
            <button
              type="submit"
              disabled={!quickCode.trim()}
              className="bg-white hover:bg-neutral-200 text-surface-container-lowest px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all shrink-0 disabled:opacity-40"
            >
              دخول
            </button>
          </form>
        </div>

        {/* MINIMALIST SOCIAL STATUS & ACTIVE LOBBY INDICATOR */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 px-1">
          {/* Quick Play Option */}
          <button
            type="button"
            onClick={() => setIsJoinModalOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 text-on-surface-variant hover:text-white transition-colors text-xs sm:text-sm font-medium group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-white transition-transform group-hover:rotate-12">casino</span>
            <span>اللعب السريع مع غرباء</span>
            <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-outline group-hover:-translate-x-0.5 rtl:rotate-180 transition-transform">chevron_right</span>
          </button>

          {/* Active Bluffers Pulse Badge (Monochrome) */}
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-surface-container-low border border-outline-variant/40 shadow-sm">
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-white" />
            </span>
            <span className="text-[11px] sm:text-xs text-on-surface-variant font-medium">
              <strong className="font-bold text-white">١,٤٢٠</strong> لاعباً يخادعون الآن
            </span>
          </div>
        </div>
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-3 sm:px-4 py-2 sm:py-2.5 max-w-sm sm:max-w-md mx-auto inset-x-0 bg-surface-container-low/95 backdrop-blur-xl border-t border-outline-variant/40 rounded-t-3xl shadow-2xl">
        {/* Item 1: الردهة (ACTIVE) */}
        <button
          type="button"
          onClick={() => setActiveBottomNav('lobby')}
          aria-label="الردهة"
          className={`flex flex-col items-center justify-center rounded-2xl px-4 sm:px-5 py-1 sm:py-1.5 transition-all active:scale-95 ${
            activeBottomNav === 'lobby'
              ? 'bg-white text-surface-container-lowest'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[22px]">chair</span>
          <span className="text-[10px] sm:text-xs mt-0.5 font-bold">الردهة</span>
        </button>

        {/* Item 2: الحزم والتصنيفات */}
        <button
          type="button"
          onClick={() => {
            setActiveBottomNav('packs');
            setIsCreateModalOpen(true);
          }}
          aria-label="الحزم والتصنيفات"
          className={`flex flex-col items-center justify-center px-4 sm:px-5 py-1 sm:py-1.5 rounded-xl active:scale-95 transition-all ${
            activeBottomNav === 'packs'
              ? 'bg-white text-surface-container-lowest'
              : 'text-on-surface-variant hover:text-white hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[22px]">style</span>
          <span className="text-[10px] sm:text-xs mt-0.5 font-medium">الحزم والتصنيفات</span>
        </button>

        {/* Item 3: الإحصائيات */}
        <button
          type="button"
          onClick={() => setActiveBottomNav('stats')}
          aria-label="الإحصائيات"
          className={`flex flex-col items-center justify-center px-4 sm:px-5 py-1 sm:py-1.5 rounded-xl active:scale-95 transition-all ${
            activeBottomNav === 'stats'
              ? 'bg-white text-surface-container-lowest'
              : 'text-on-surface-variant hover:text-white hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] sm:text-[22px]">leaderboard</span>
          <span className="text-[10px] sm:text-xs mt-0.5 font-medium">الإحصائيات</span>
        </button>
      </nav>

      {/* ========================================================
          JOIN ROOM MODAL (SCREEN 2 REFERENCE)
          ======================================================== */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            onClick={() => setIsJoinModalOpen(false)}
          />

          <section
            aria-labelledby="modal-title"
            className="relative w-full max-w-lg z-20 mx-auto animate-fadeIn"
          >
            <div className="dark-monochrome-card backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-white/10 relative overflow-hidden transition-all duration-200 max-h-[92vh] overflow-y-auto">
              {/* Smooth Drag Handle Indicator (Top) */}
              <div className="flex justify-center mb-3">
                <div
                  aria-hidden="true"
                  className="w-10 sm:w-12 h-1.5 rounded-full bg-surface-container-highest hover:bg-outline transition-colors cursor-grab"
                />
              </div>

              {/* Header: Title & Close Action */}
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-outline-variant/40">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight" id="modal-title">
                    الانضمام إلى غرفة
                  </h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                    اجتمع حول طاولة الخداع مع منافسيك
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  aria-label="إغلاق"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container-highest transition-colors duration-150 active:scale-95 border border-transparent hover:border-outline-variant/40"
                  title="إغلاق"
                >
                  <span className="material-symbols-outlined text-lg sm:text-xl">close</span>
                </button>
              </div>

              {/* Interactive 4-Character Room Code Input */}
              <div className="mt-4 sm:mt-6">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <label className="text-xs sm:text-sm font-semibold text-white">
                    أدخل الرمز المكون من 4 خانات
                  </label>
                  <span className="text-[11px] text-on-surface-variant">غير حساس لحالة الأحرف</span>
                </div>

                {/* Segmented 4-Character Code Input Grid */}
                <div
                  className="grid grid-cols-4 gap-2 sm:gap-3 max-w-xs mx-auto"
                  dir="ltr"
                  role="group"
                  aria-label="أدخل رمز الغرفة المكون من 4 خانات"
                >
                  {codeBoxes.map((val, idx) => (
                    <div
                      key={idx}
                      className={`relative dark-input-slot rounded-xl sm:rounded-2xl flex items-center justify-center h-14 sm:h-16 text-center transition-all duration-150 ${
                        val
                          ? 'bg-surface-container border-2 border-white/80 shadow-md'
                          : 'bg-surface-container-low border border-outline-variant/60'
                      }`}
                    >
                      <input
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="text"
                        maxLength={1}
                        value={val}
                        aria-label={`الخانة ${idx + 1}`}
                        onChange={(e) => handleBoxChange(idx, e.target.value)}
                        onKeyDown={(e) => handleBoxKeyDown(idx, e)}
                        placeholder="•"
                        className="w-full h-full text-center bg-transparent border-0 text-xl sm:text-2xl font-black text-white placeholder:text-outline focus:outline-none focus:ring-0 p-0 font-mono uppercase"
                      />
                    </div>
                  ))}
                </div>

                {/* Instant 'Paste from Clipboard' Action */}
                <div className="flex justify-center mt-2.5 sm:mt-3">
                  <button
                    type="button"
                    onClick={handlePasteCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-white text-[11px] sm:text-xs font-medium border border-outline-variant/40 transition-all active:scale-95 duration-150 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px] text-white">content_paste</span>
                    <span>لصق من الحافظة</span>
                  </button>
                </div>
              </div>

              {/* Alternative Access: Clean Divider */}
              <div className="relative my-4 sm:my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/40" />
                </div>
                <div className="relative inline-block bg-[#18191a] px-3">
                  <span className="text-[11px] font-semibold text-outline tracking-wider">أو</span>
                </div>
              </div>

              {/* Prominent Secondary Action: Scan QR Code */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setIsJoinModalOpen(false);
                    setIsScannerOpen(true);
                  }}
                  className="w-full bg-surface-container-low hover:bg-surface-container text-white font-medium text-xs sm:text-sm py-2.5 sm:py-3 px-4 rounded-xl border border-outline-variant/60 flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] shadow-sm hover:border-outline"
                >
                  <span className="material-symbols-outlined text-white text-[18px] sm:text-[20px]">qr_code_scanner</span>
                  <span>مسح رمز QR</span>
                </button>
              </div>

              {/* Player Character Preview in Join Modal */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 mt-3.5 mb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/50 flex items-center justify-center overflow-hidden shrink-0">
                    <ConsolePet avatar={avatar} size={36} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{nickname}</span>
                    <span className="text-[10px] text-on-surface-variant">شخصيتك عند الدخول</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditCharacterOpen(true)}
                  className="text-xs font-bold text-white bg-surface-container hover:bg-surface-container-high px-2.5 py-1 rounded-lg border border-outline-variant/40 transition-colors"
                >
                  تعديل
                </button>
              </div>

              {/* Primary Action CTA */}
              <div className="mt-3.5 sm:mt-4">
                <button
                  type="button"
                  onClick={handleJoinSubmit}
                  disabled={!fullEnteredCode}
                  className="w-full bg-white hover:bg-inverse-surface text-on-primary font-bold text-sm sm:text-base py-3 sm:py-3.5 px-6 rounded-xl shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 group disabled:opacity-40"
                >
                  <span>دخول الغرفة</span>
                  <span className="material-symbols-outlined text-on-primary transition-transform group-hover:-translate-x-1 duration-150">
                    arrow_back
                  </span>
                </button>
                <p className="text-center text-[11px] text-on-surface-variant mt-2 sm:mt-3 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-outline text-[14px]">info</span>
                  <span>اطلب من المضيف رمز الغرفة أو دعوة الكاميرا.</span>
                </p>
              </div>

              {/* Micro Session Footer */}
              <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between text-[11px] text-outline font-medium">
                <span className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-white text-[14px]">lock</span>
                  جلسة مشفرة
                </span>
                <span>إصدار ESC الرسمي</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================
          CREATE ROOM MODAL
          ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <section className="relative w-full max-w-lg z-20 mx-auto animate-fadeIn">
            <div className="dark-monochrome-card backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-white/10 relative overflow-hidden max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-outline-variant/40">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">استضافة غرفة جديدة</h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">كن المضيف وتحكم في مجريات الجلسة</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container-highest"
                >
                  <span className="material-symbols-outlined text-lg sm:text-xl">close</span>
                </button>
              </div>

              <div className="mt-4 sm:mt-5 space-y-3.5 sm:space-y-4">
                {/* اسم وشخصية المضيف */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-white">اسم وشخصية المضيف:</label>
                    <button
                      type="button"
                      onClick={() => setIsEditCharacterOpen(true)}
                      className="text-[11px] font-bold text-white hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">palette</span>
                      <span>تخصيص المظهر</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 bg-surface-container-low border border-outline-variant/60 rounded-xl">
                    <div
                      onClick={() => setIsEditCharacterOpen(true)}
                      className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant/50 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
                      title="اضغط للتعديل"
                    >
                      <ConsolePet avatar={avatar} size={36} />
                    </div>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      maxLength={20}
                      className="flex-1 bg-transparent border-none text-white text-xs sm:text-sm focus:outline-none px-1"
                      placeholder="اسمك في اللعبة"
                    />
                  </div>
                </div>

                {/* عدد الجولات */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-white">عدد الجولات:</label>
                    <span className="text-xs font-bold text-white">{totalRounds} جولات</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {[3, 5, 10, 15].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTotalRounds(r)}
                        className={`py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                          totalRounds === r
                            ? 'bg-white text-surface-container-lowest'
                            : 'bg-surface-container-low text-on-surface-variant hover:text-white border border-outline-variant/40'
                        }`}
                      >
                        {r} جولات
                      </button>
                    ))}
                  </div>
                </div>

                {/* وقت السؤال */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-white">مهلة تقديم الخدعة:</label>
                    <span className="text-xs font-bold text-white">{answerDuration} ثانية</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {[30, 45, 60].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setAnswerDuration(sec)}
                        className={`py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
                          answerDuration === sec
                            ? 'bg-white text-surface-container-lowest'
                            : 'bg-surface-container-low text-on-surface-variant hover:text-white border border-outline-variant/40'
                        }`}
                      >
                        {sec} ثانية
                      </button>
                    ))}
                  </div>
                </div>

                {/* سعة اللاعبين */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-white">سعة اللاعبين:</label>
                    <span className="text-xs font-bold text-white">{maxPlayers} لاعبين</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={12}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCreateSubmit}
                    disabled={isCreating || !nickname.trim()}
                    className="w-full bg-white hover:bg-neutral-200 text-surface-container-lowest font-bold text-sm sm:text-base py-3 sm:py-3.5 px-6 rounded-xl shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <span>{isCreating ? 'جارٍ الإنشاء...' : 'بدء الردهة كـ مضيف'}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================
          EDIT NICKNAME MODAL
          ======================================================== */}
      {isEditNicknameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setIsEditNicknameOpen(false)}
          />
          <div className="relative w-full max-w-sm z-20 dark-monochrome-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/10">
            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">تعديل الاسم المستعار</h3>
            <p className="text-xs text-on-surface-variant mb-3.5">اختر اسماً يميزك في جلسات ESC</p>
            <input
              type="text"
              defaultValue={nickname}
              id="nickname-input-field"
              maxLength={20}
              autoFocus
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm mb-3.5 focus:border-white focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditNicknameOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('nickname-input-field') as HTMLInputElement;
                  if (input) handleSaveNickname(input.value);
                }}
                className="px-4 py-1.5 rounded-xl bg-white text-surface-container-lowest text-xs font-bold"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تخصيص الشخصية الكاملة */}
      {isEditCharacterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
          <div className="w-full max-w-lg h-full max-h-[95vh] overflow-y-auto">
            <CharacterSelectScreen
              initialNickname={nickname}
              initialAvatar={avatar}
              onSave={handleSaveCharacter}
              onBack={() => setIsEditCharacterOpen(false)}
              actionButtonText="تأكيد وحفظ الشخصية"
            />
          </div>
        </div>
      )}
    </div>
  );
};
