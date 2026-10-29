import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { AudioToggle } from '../common/AudioToggle';
import { ThemeToggle } from '../common/ThemeToggle';
import { GameScaleControl } from '../common/GameScaleControl';
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
  const [maxPlayers, setMaxPlayers] = useState<number>(16);
  const [gameMode, setGameMode] = useState<'individual' | 'teams'>('individual');
  const [teamCount, setTeamCount] = useState<number>(4);
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
      topics.length > 0 ? topics.map((t) => t.id) : undefined,
      {
        totalRounds,
        answerDuration,
        maxPlayers,
        gameMode,
        teamCount,
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
    <div className="min-h-full flex-1 w-full table-canvas-dark text-on-surface antialiased flex flex-col justify-between selection:bg-surface-bright selection:text-white relative">
      {/* ماسح الكاميرا لرموز QR */}
      <CameraQRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScannedCode}
      />

      {/* Floating Minimal Controls Row (Audio, Theme, Scale) */}
      <header className="w-full max-w-md mx-auto flex items-center justify-end px-4 pt-3 pb-1 gap-1 z-20">
        <AudioToggle />
        <ThemeToggle />
        <GameScaleControl />
      </header>

      {/* Centered Main Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 pb-20 max-w-md mx-auto w-full">
        {/* ESC Wordmark & 1-line Tagline */}
        <div className="text-center mb-6 w-full">
          <h1 className="text-5xl sm:text-6xl font-black tracking-widest text-white uppercase font-mono leading-none">
            ESC
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-2 font-medium">
            لعبة الخداع والبديهة
          </p>

          {/* User Profile: Compact chip (Avatar + Name + Edit icon) */}
          <button
            type="button"
            onClick={() => setIsEditCharacterOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 hover:border-white/60 transition-all active:scale-95 shadow-xs cursor-pointer"
            title="تعديل الشخصية والاسم"
          >
            <div className="w-7 h-7 rounded-md bg-surface-container-high border border-outline-variant/60 flex items-center justify-center overflow-hidden shrink-0">
              <ConsolePet avatar={avatar} size={28} />
            </div>
            <span className="text-xs sm:text-sm font-bold text-white">{nickname}</span>
            <span className="material-symbols-outlined text-[15px] text-on-surface-variant">edit</span>
          </button>
        </div>

        {/* PRIMARY ACTION DECK */}
        <div className="w-full space-y-3 mb-5">
          {/* 1. إنشاء لعبة (Sleek medium-height button) */}
          <button
            type="button"
            onClick={() => {
              if (!nickname.trim()) {
                setIsEditNicknameOpen(true);
              } else {
                handleCreateSubmit();
              }
            }}
            disabled={isCreating}
            className="w-full py-3.5 px-5 rounded-lg bg-white text-surface-container-lowest hover:bg-neutral-200 transition-all font-bold text-sm sm:text-base flex items-center justify-between shadow-md active:scale-[0.99] group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[22px]">add_circle</span>
              <span>{isCreating ? 'جارٍ إنشاء الغرفة...' : 'إنشاء لعبة جديدة'}</span>
            </div>
            <span className="material-symbols-outlined text-[18px] rtl:rotate-180 group-hover:-translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>

          {/* 2. Unified inline input bar [ إدخال رمز الغرفة... ] [ دخول ] + QR */}
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
            className="w-full bg-surface-container-low border border-outline-variant/50 p-1.5 rounded-lg flex items-center gap-2 shadow-xs focus-within:border-white/60 transition-colors"
          >
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="w-9 h-9 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-white flex items-center justify-center transition-all shrink-0 active:scale-95"
              title="مسح رمز QR بالكاميرا"
            >
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            </button>
            <input
              type="text"
              maxLength={8}
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
              placeholder="إدخال رمز الغرفة..."
              className="flex-1 bg-transparent border-none text-white text-xs sm:text-sm placeholder:text-outline focus:outline-none px-2 font-mono tracking-wider text-right"
            />
            <button
              type="submit"
              disabled={!quickCode.trim()}
              className="bg-white hover:bg-neutral-200 text-surface-container-lowest px-4 py-2 rounded-md text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all shrink-0 disabled:opacity-30"
            >
              دخول
            </button>
          </form>
        </div>

        {/* Quick Join Modal Trigger */}
        <button
          type="button"
          onClick={() => setIsJoinModalOpen(true)}
          className="text-xs text-on-surface-variant hover:text-white transition-colors flex items-center gap-1.5 font-medium py-1 active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">casino</span>
          <span>الانضمام عبر قائمة الغرف المتاحة</span>
        </button>
      </main>

      {/* BOTTOM NAVIGATION BAR: Ultra-compact bar */}
      <nav className="fixed bottom-3 left-0 w-full z-40 flex justify-around items-center px-2 py-1.5 max-w-xs sm:max-w-sm mx-auto inset-x-0 bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant/40 rounded-lg shadow-xl">
        <button
          type="button"
          onClick={() => setActiveBottomNav('lobby')}
          aria-label="الردهة"
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 transition-all active:scale-95 ${
            activeBottomNav === 'lobby'
              ? 'bg-white text-surface-container-lowest font-bold shadow-xs'
              : 'text-on-surface-variant hover:text-white font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">chair</span>
          <span className="text-xs">الردهة</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveBottomNav('packs');
            setIsCreateModalOpen(true);
          }}
          aria-label="الحزم"
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all active:scale-95 ${
            activeBottomNav === 'packs'
              ? 'bg-white text-surface-container-lowest font-bold shadow-xs'
              : 'text-on-surface-variant hover:text-white font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">style</span>
          <span className="text-xs">الحزم</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBottomNav('stats')}
          aria-label="الإحصائيات"
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all active:scale-95 ${
            activeBottomNav === 'stats'
              ? 'bg-white text-surface-container-lowest font-bold shadow-xs'
              : 'text-on-surface-variant hover:text-white font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">leaderboard</span>
          <span className="text-xs">الإحصائيات</span>
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
            <div className="dark-monochrome-card backdrop-blur-2xl rounded-xl p-4 sm:p-7 border border-white/10 relative overflow-hidden transition-all duration-200 max-h-[92vh] overflow-y-auto">
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
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container-highest transition-colors duration-150 active:scale-95 border border-transparent hover:border-outline-variant/40"
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
                      className={`relative dark-input-slot rounded-lg flex items-center justify-center h-14 sm:h-16 text-center transition-all duration-150 ${
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
                    className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-white text-[11px] sm:text-xs font-medium border border-outline-variant/40 transition-all active:scale-95 duration-150 shadow-sm"
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
                <div className="relative inline-block bg-surface-container-low px-3">
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
                  className="w-full bg-surface-container-low hover:bg-surface-container text-white font-medium text-xs sm:text-sm py-2.5 sm:py-3 px-4 rounded-lg border border-outline-variant/60 flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] shadow-sm hover:border-outline"
                >
                  <span className="material-symbols-outlined text-white text-[18px] sm:text-[20px]">qr_code_scanner</span>
                  <span>مسح رمز QR</span>
                </button>
              </div>

              {/* Player Character Preview in Join Modal */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 mt-3.5 mb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant/50 flex items-center justify-center overflow-hidden shrink-0">
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
                  className="w-full bg-white hover:bg-inverse-surface text-on-primary font-bold text-sm sm:text-base py-3 sm:py-3.5 px-6 rounded-lg shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 group disabled:opacity-40"
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
            <div className="dark-monochrome-card backdrop-blur-2xl rounded-xl p-4 sm:p-7 border border-white/10 relative overflow-hidden max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-outline-variant/40">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">استضافة غرفة جديدة</h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">كن المضيف وتحكم في مجريات الجلسة (حتى 40 لاعب و8 فرق)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container-highest"
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
                  <div className="flex items-center gap-2 p-1.5 bg-surface-container-low border border-outline-variant/60 rounded-lg">
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

                {/* نظام اللعب (فردي / فرق) */}
                <div>
                  <label className="text-xs font-semibold text-white block mb-1.5">نظام اللعب:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGameMode('individual')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        gameMode === 'individual'
                          ? 'bg-white text-surface-container-lowest border-white'
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      <span>فردي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGameMode('teams')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        gameMode === 'teams'
                          ? 'bg-white text-surface-container-lowest border-white'
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">groups</span>
                      <span>فرق (2 - 8 فرق)</span>
                    </button>
                  </div>
                </div>

                {/* عدد الفرق عند اختيار نظام الفرق */}
                {gameMode === 'teams' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-white">عدد الفرق:</label>
                      <span className="text-xs font-bold text-white">{teamCount} فرق</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {[2, 3, 4, 5, 6, 7, 8].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setTeamCount(cnt)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            teamCount === cnt
                              ? 'bg-white text-surface-container-lowest'
                              : 'bg-surface-container-low text-on-surface-variant hover:text-white border border-outline-variant/40'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                        className={`py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all ${
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
                        className={`py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all ${
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

                {/* سعة اللاعبين (حتى 40 لاعب) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-white">سعة اللاعبين (الحد الأقصى 40):</label>
                    <span className="text-xs font-bold text-white">{maxPlayers} لاعبين</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                    {[8, 16, 24, 32, 40].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setMaxPlayers(cap)}
                        className={`py-1 rounded-md text-xs font-bold transition-all ${
                          maxPlayers === cap
                            ? 'bg-white text-surface-container-lowest'
                            : 'bg-surface-container-low text-on-surface-variant hover:text-white border border-outline-variant/40'
                        }`}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={40}
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
                    className="w-full bg-white hover:bg-neutral-200 text-surface-container-lowest font-bold text-sm sm:text-base py-3 sm:py-3.5 px-6 rounded-lg shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2"
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
          <div className="relative w-full max-w-sm z-20 dark-monochrome-card rounded-xl p-5 sm:p-6 border border-white/10">
            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">تعديل الاسم المستعار</h3>
            <p className="text-xs text-on-surface-variant mb-3.5">اختر اسماً يميزك في جلسات ESC</p>
            <input
              type="text"
              defaultValue={nickname}
              id="nickname-input-field"
              maxLength={20}
              autoFocus
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg px-3.5 py-2.5 text-white text-xs sm:text-sm mb-3.5 focus:border-white focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditNicknameOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('nickname-input-field') as HTMLInputElement;
                  if (input) handleSaveNickname(input.value);
                }}
                className="px-4 py-1.5 rounded-lg bg-white text-surface-container-lowest text-xs font-bold"
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
