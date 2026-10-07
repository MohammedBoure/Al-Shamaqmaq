import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { AudioToggle } from '../common/AudioToggle';
import { ConsolePet } from '../common/ConsolePet';

export const GameOverScreen: React.FC = () => {
  const { leaderboard, leaveRoom } = useGame();

  useEffect(() => {
    // إطلاق ألعاب نارية و Confetti متكررة احتفالاً بنهاية المسابقة
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const firstPlace = leaderboard[0];
  const secondPlace = leaderboard[1];
  const thirdPlace = leaderboard[2];

  return (
    <div className="flex flex-col min-h-screen px-4 py-8 max-w-lg mx-auto w-full text-center">
      <header className="flex justify-end mb-4">
        <AudioToggle />
      </header>

      {/* عنوان التتويج */}
      <div className="space-y-1 mb-6">
        <span className="text-4xl animate-bounce-subtle">👑</span>
        <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-l from-arcade-yellow via-arcade-pink to-arcade-cyan bg-clip-text text-transparent">
          نهاية اللعبة وتتويج الفائز!
        </h1>
        <p className="text-xs text-gray-400 font-semibold">
          تهانينا للأذكى والأكثر براعة في الخداع والتضليل! 🎭
        </p>
      </div>

      {/* منصة التتويج (Podium) */}
      <div className="flex items-end justify-center gap-3 mb-8 px-2">
        {/* المركز الثاني */}
        {secondPlace && (
          <div className="flex-1 flex flex-col items-center">
            <ConsolePet avatar={secondPlace.avatar} size={50} />
            <span className="text-xs font-black text-gray-200 truncate max-w-[90px] mt-1">
              {secondPlace.nickname}
            </span>
            <span className="text-[10px] text-arcade-cyan font-mono font-bold mb-1">
              {secondPlace.score} نقطة
            </span>
            <div className="w-full h-24 bg-gradient-to-t from-gray-800 to-gray-700 rounded-t-2xl border-t-2 border-x-2 border-gray-400 flex items-center justify-center text-lg font-black text-gray-300">
              🥈 2
            </div>
          </div>
        )}

        {/* المركز الأول - الفائز */}
        {firstPlace && (
          <div className="flex-1 flex flex-col items-center -mt-6">
            <div className="relative">
              <span className="absolute -top-4 right-1/2 translate-x-1/2 text-2xl animate-bounce">
                👑
              </span>
              <ConsolePet avatar={firstPlace.avatar} size={70} />
            </div>
            <span className="text-sm font-black text-arcade-yellow truncate max-w-[110px] mt-1">
              {firstPlace.nickname}
            </span>
            <span className="text-xs text-arcade-yellow font-mono font-black mb-1">
              {firstPlace.score} نقطة
            </span>
            <div className="w-full h-32 bg-gradient-to-t from-amber-900 to-amber-600 rounded-t-2xl border-t-2 border-x-2 border-arcade-yellow flex items-center justify-center text-2xl font-black text-white shadow-neon-yellow">
              🥇 1
            </div>
          </div>
        )}

        {/* المركز الثالث */}
        {thirdPlace && (
          <div className="flex-1 flex flex-col items-center">
            <ConsolePet avatar={thirdPlace.avatar} size={44} />
            <span className="text-xs font-black text-gray-300 truncate max-w-[90px] mt-1">
              {thirdPlace.nickname}
            </span>
            <span className="text-[10px] text-arcade-cyan font-mono font-bold mb-1">
              {thirdPlace.score} نقطة
            </span>
            <div className="w-full h-16 bg-gradient-to-t from-amber-950 to-amber-900 rounded-t-2xl border-t-2 border-x-2 border-amber-700 flex items-center justify-center text-base font-black text-amber-500">
              🥉 3
            </div>
          </div>
        )}
      </div>

      {/* الترتيب الكامل للمتسابقين */}
      <div className="flex-1 bg-arcade-card/90 border border-arcade-border rounded-3xl p-4 shadow-xl overflow-y-auto mb-6">
        <h3 className="text-xs font-black text-gray-400 mb-3 text-right">
          الترتيب العام لجميع اللاعبين:
        </h3>
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.id}
              className="p-2.5 rounded-xl bg-arcade-bg/70 border border-arcade-border/40 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-500 w-5">#{entry.rank}</span>
                <ConsolePet avatar={entry.avatar} size={28} />
                <span className="font-bold text-white">{entry.nickname}</span>
              </div>
              <span className="font-black text-arcade-cyan font-mono">{entry.score} نقطة</span>
            </div>
          ))}
        </div>
      </div>

      {/* زر العودة للرئيسية */}
      <footer className="mt-auto">
        <button
          type="button"
          onClick={leaveRoom}
          className="w-full py-4 bg-gradient-to-l from-arcade-pink via-arcade-purple to-arcade-cyan text-white font-black text-base rounded-2xl shadow-neon-purple hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>العودة للرئيسية ولعب جولة جديدة 🎮</span>
        </button>
      </footer>
    </div>
  );
};
