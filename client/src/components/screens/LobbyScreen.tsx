import React, { useState, useEffect } from 'react';
import { Sparkles, LogIn, PlusCircle, Settings, Users, BookOpen, Camera, Clock, Swords, Hash } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { AvatarPicker } from '../common/AvatarPicker';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { AudioToggle } from '../common/AudioToggle';
import { CameraQRScanner } from '../common/CameraQRScanner';

import { serializePet, DEFAULT_PET_CONFIG } from '../common/ConsolePet';

export const LobbyScreen: React.FC = () => {
  const { createRoom, joinRoom, topics, audio, haptic } = useGame();

  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [nickname, setNickname] = useState<string>('');
  const [avatar, setAvatar] = useState<string>(() => serializePet(DEFAULT_PET_CONFIG));
  const [roomCode, setRoomCode] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // قراءة كود الغرفة الممرر عبر الرابط أو الباركود تلقائياً (?join=ABCD أو ?code=ABCD)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlCode = searchParams.get('join') || searchParams.get('code') || searchParams.get('room');
      if (urlCode) {
        setRoomCode(urlCode.toUpperCase());
        setTab('join');
      }
    } catch (_) {}
  }, []);

  // إعدادات المضيف
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [totalRounds, setTotalRounds] = useState<number>(5);
  const [answerDuration, setAnswerDuration] = useState<number>(60);
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [gameMode, setGameMode] = useState<'individual' | 'teams'>('individual');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // تحديد جميع المواضيع كافتراضي عند فتح إنشاء الغرفة
  React.useEffect(() => {
    if (topics.length > 0 && selectedTopics.length === 0) {
      setSelectedTopics(topics.map((t) => t.id));
    }
  }, [topics, selectedTopics.length]);

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !roomCode.trim()) return;
    joinRoom(roomCode, nickname, avatar);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setIsLoading(true);
    await createRoom(
      nickname,
      avatar,
      selectedTopics.length > 0 ? selectedTopics : undefined,
      {
        totalRounds,
        answerDuration,
        maxPlayers,
        gameMode,
      }
    );
    setIsLoading(false);
  };

  const handleScannedCode = (scanned: string) => {
    setRoomCode(scanned);
    audio.playClick();
    haptic.triggerHaptic('success');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 max-w-md mx-auto w-full">
      {/* ماسح الكاميرا لرموز QR */}
      <CameraQRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScannedCode}
      />
      {/* رأس الصفحة والشعار */}
      <header className="w-full flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-3xl animate-bounce-subtle">🎭</span>
          <h1 className="text-xl font-black tracking-tight bg-gradient-to-l from-arcade-cyan via-arcade-purple to-arcade-pink bg-clip-text text-transparent">
            خداع الألغاز
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionBadge />
          <AudioToggle />
        </div>
      </header>

      {/* بطاقة الواجهة الرئيسية */}
      <div className="w-full bg-arcade-card/90 backdrop-blur-xl border border-arcade-border/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* أشرطة تزيينية نيون */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-arcade-purple/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-arcade-pink/20 rounded-full blur-3xl pointer-events-none" />

        {/* أزرار التبديل بين الانضمام والإنشاء */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-arcade-bg/80 rounded-2xl border border-arcade-border/60 mb-6">
          <button
            type="button"
            onClick={() => setTab('join')}
            className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 transform active:scale-95 ${
              tab === 'join'
                ? 'bg-gradient-to-l from-arcade-purple to-arcade-cyan text-white shadow-neon-purple'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>انضمام لغرفة</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 transform active:scale-95 ${
              tab === 'create'
                ? 'bg-gradient-to-l from-arcade-pink to-arcade-purple text-white shadow-neon-pink'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>إنشاء غرفة</span>
          </button>
        </div>

        {/* نموذج الإدخال */}
        <form onSubmit={tab === 'join' ? handleJoin : handleCreate} className="space-y-4">
          {/* الاسم المستعار */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              اسمك المستعار (اللاعب):
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="مثال: فارس، سارة، الماكر..."
              maxLength={20}
              required
              className="w-full px-4 py-3 bg-arcade-bg/90 border border-arcade-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-arcade-cyan focus:ring-2 focus:ring-arcade-cyan/30 text-sm font-semibold transition-all"
            />
          </div>

          {/* اختيار الأفاتار والشخصية */}
          <AvatarPicker
            selectedAvatar={avatar}
            onSelectAvatar={setAvatar}
            nickname={nickname}
            onUpdateNickname={setNickname}
          />

          {/* حقل كود الغرفة في حال الانضمام */}
          {tab === 'join' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-300">
                  رمز الغرفة (Room Code):
                </label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-xs text-arcade-cyan hover:underline font-bold flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>مسح بالكاميرا 📷</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="مثال: ABCD"
                  maxLength={8}
                  required
                  className="flex-1 px-4 py-3.5 bg-arcade-bg/90 border border-arcade-border rounded-xl text-center text-xl font-black tracking-widest text-arcade-cyan placeholder-gray-600 focus:outline-none focus:border-arcade-pink focus:ring-2 focus:ring-arcade-pink/30 uppercase transition-all"
                />
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="p-3.5 bg-arcade-card hover:bg-arcade-cardHover border border-arcade-border hover:border-arcade-cyan rounded-xl text-arcade-cyan hover:text-white transition-all shadow-md active:scale-95 shrink-0"
                  title="مسح رمز QR من الكاميرا"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* إعدادات المضيف في حال إنشاء الغرفة */}
          {tab === 'create' && (
            <div className="space-y-3 pt-2 border-t border-arcade-border/50">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                <Settings className="w-4 h-4 text-arcade-yellow" />
                <span>إعدادات الغرفة والمواضيع:</span>
              </div>

              {/* اختيار المواضيع المسموحة */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">المواضيع المتاحة بالجلسة:</label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                  {topics.map((t) => {
                    const isSelected = selectedTopics.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTopic(t.id)}
                        className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between text-xs font-semibold ${
                          isSelected
                            ? 'bg-arcade-purple/20 border-arcade-purple text-white'
                            : 'bg-arcade-bg/40 border-arcade-border/40 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-arcade-cyan" />
                          <span>{t.title}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">({t.puzzleCount} لغز)</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* نمط اللعبة (فردي أم فرق) */}
              <div className="bg-arcade-bg/60 p-2.5 rounded-xl border border-arcade-border/60">
                <label className="block text-xs text-gray-300 mb-1.5 font-bold">
                  نمط المنافسة:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGameMode('individual')}
                    className={`py-2 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1 ${
                      gameMode === 'individual'
                        ? 'bg-arcade-cyan text-black border-white shadow-neon-cyan'
                        : 'bg-arcade-card text-gray-400 border-arcade-border'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>فردي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameMode('teams')}
                    className={`py-2 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1 ${
                      gameMode === 'teams'
                        ? 'bg-arcade-pink text-white border-white shadow-neon-pink'
                        : 'bg-arcade-card text-gray-400 border-arcade-border'
                    }`}
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>وضع الفرق ⚔️</span>
                  </button>
                </div>
              </div>

              {/* وقت الجولة بالثواني والحد الأقصى للاعبين */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-arcade-bg/60 p-2.5 rounded-xl border border-arcade-border/60">
                  <div className="flex items-center gap-1 text-xs text-gray-300 mb-1 font-bold">
                    <Clock className="w-3.5 h-3.5 text-arcade-cyan" />
                    <span>وقت السؤال:</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      min={10}
                      max={180}
                      step={5}
                      value={answerDuration}
                      onChange={(e) => setAnswerDuration(parseInt(e.target.value, 10) || 60)}
                      className="w-full py-1.5 px-2 bg-arcade-card border border-arcade-border rounded-lg text-center text-sm font-black text-white"
                    />
                    <span className="text-[11px] text-gray-400 mr-1">ثانية</span>
                  </div>
                </div>

                <div className="bg-arcade-bg/60 p-2.5 rounded-xl border border-arcade-border/60">
                  <div className="flex items-center gap-1 text-xs text-gray-300 mb-1 font-bold">
                    <Users className="w-3.5 h-3.5 text-arcade-green" />
                    <span>سعة اللاعبين:</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      min={2}
                      max={30}
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10) || 8)}
                      className="w-full py-1.5 px-2 bg-arcade-card border border-arcade-border rounded-lg text-center text-sm font-black text-white"
                    />
                    <span className="text-[11px] text-gray-400 mr-1">لاعب</span>
                  </div>
                </div>
              </div>

              {/* عدد الجولات */}
              <div className="bg-arcade-bg/60 p-2.5 rounded-xl border border-arcade-border/60">
                <div className="flex justify-between items-center text-xs text-gray-300 mb-1.5 font-bold">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-arcade-yellow" />
                    <span>عدد الجولات:</span>
                  </span>
                  <span className="font-black text-arcade-yellow text-sm">{totalRounds} جولات</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(parseInt(e.target.value, 10))}
                  className="w-full accent-arcade-pink cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* زر التنفيذ الرئيسي */}
          <button
            type="submit"
            disabled={isLoading || !nickname.trim() || (tab === 'join' && !roomCode.trim())}
            className="w-full py-4 mt-4 bg-gradient-to-l from-arcade-pink via-arcade-purple to-arcade-cyan text-white font-black text-base rounded-2xl shadow-neon-purple hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 animate-spin" />
            <span>{tab === 'join' ? 'انضم إلى المنافسة!' : 'إنشاء وبدء الغرفة!'}</span>
          </button>
        </form>
      </div>

      {/* تذييل الصفحة */}
      <footer className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
        <Users className="w-4 h-4" />
        <span>العب، اخدع أصدقاءك، واجمع النقاط! 🎯</span>
      </footer>
    </div>
  );
};
