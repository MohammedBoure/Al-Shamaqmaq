import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Swords } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { ConsolePet } from '../common/ConsolePet';
import { GameTopHeader } from '../common/GameTopHeader';

export const GameOverScreen: React.FC = () => {
  const { leaderboard, leaveRoom, room, totalRounds } = useGame();
  const [activeBottomTab, setActiveBottomTab] = useState<'game' | 'chat'>('game');

  useEffect(() => {
    // إطلاق ألعاب نارية و Confetti متكررة احتفالاً بنهاية المسابقة
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 6,
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
    <div className="flex flex-col min-h-screen bg-[#1b2245] bg-arcade-pattern px-3 pt-3 max-w-md mx-auto w-full select-none justify-between relative pb-1">
      {/* 1. الشريط العلوي التتويجي */}
      <GameTopHeader
        currentRound={totalRounds}
        totalRounds={totalRounds}
        centerType="crown"
        onMenuClick={leaveRoom}
      />

      {/* 2. عنوان التتويج والنجوم الذهبية الثلاث */}
      <div className="text-center my-1 relative z-10">
        <div className="flex justify-center items-end gap-1 mb-1">
          <span className="text-2xl drop-shadow-[0_2px_0_#000] transform -rotate-12">⭐</span>
          <span className="text-4xl drop-shadow-[0_2px_0_#000] -translate-y-1">👑</span>
          <span className="text-2xl drop-shadow-[0_2px_0_#000] transform rotate-12">⭐</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white text-stroke-arcade tracking-wider drop-shadow-[0_2px_0_#000]">
          تتويج بطل اللعبة!
        </h1>
        <p className="text-xs text-amber-300 font-bold mt-0.5">
          تهانينا للأذكى والأكثر براعة في الخداع والتضليل 🎭
        </p>
      </div>

      {/* 3. تتويج الفريق الفائز إذا كان وضع الفرق مفعلاً */}
      {room?.teamScores && room.teamScores.length > 0 && (
        <div className="mb-2 p-3 rounded-2xl bg-[#2d354b] border-3 border-black shadow-[0_4px_0_#000] text-center">
          <div className="text-xs font-black text-arcade-cyan flex items-center justify-center gap-1.5 mb-1">
            <Swords className="w-4 h-4" />
            <span>نتيجة الفرق النهائية</span>
          </div>
          <div className="text-sm font-black text-white">
            {room.teamScores[0]?.score === room.teamScores[1]?.score ? (
              <span>تعادل بطولي بين الفريقين! ({room.teamScores[0]?.score} نقطة لكل فريق)</span>
            ) : (
              <span>
                الفريق الفائز:{' '}
                <span className={room.teamScores[0]?.teamId === 'red' ? 'text-red-400 font-black' : 'text-blue-400 font-black'}>
                  {room.teamScores[0]?.teamName} 🏆
                </span>{' '}
                بـ {room.teamScores[0]?.score} نقطة!
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4. منصة التتويج الثلاثية (Podium) */}
      <div className="flex items-end justify-center gap-2 px-1 mb-2">
        {/* المركز الثاني */}
        {secondPlace && (
          <div className="flex-1 flex flex-col items-center">
            <div className="animate-bounce-subtle">
              <ConsolePet avatar={secondPlace.avatar} size={46} />
            </div>
            <span className="text-xs font-black text-white truncate max-w-[85px] mt-0.5">
              {secondPlace.nickname}
            </span>
            <span className="text-[10px] text-gray-300 font-black mb-1">
              {secondPlace.score} نقطة
            </span>
            <div className="w-full h-20 bg-[#64748b] border-2 border-black rounded-t-2xl flex items-center justify-center text-lg font-black text-white shadow-[0_3px_0_#334155]">
              🥈 2
            </div>
          </div>
        )}

        {/* المركز الأول - البطل */}
        {firstPlace && (
          <div className="flex-1 flex flex-col items-center -mt-4">
            <div className="relative animate-bounce">
              <span className="absolute -top-3.5 right-1/2 translate-x-1/2 text-xl">
                👑
              </span>
              <ConsolePet avatar={firstPlace.avatar} size={64} />
            </div>
            <span className="text-sm font-black text-arcade-yellow truncate max-w-[100px] mt-0.5 drop-shadow-[0_1px_0_#000]">
              {firstPlace.nickname}
            </span>
            <span className="text-xs text-arcade-yellow font-black mb-1">
              {firstPlace.score} نقطة
            </span>
            <div className="w-full h-28 bg-[#f59e0b] border-3 border-black rounded-t-2xl flex items-center justify-center text-2xl font-black text-black shadow-[0_4px_0_#b45309]">
              🥇 1
            </div>
          </div>
        )}

        {/* المركز الثالث */}
        {thirdPlace && (
          <div className="flex-1 flex flex-col items-center">
            <div className="animate-bounce-subtle">
              <ConsolePet avatar={thirdPlace.avatar} size={40} />
            </div>
            <span className="text-xs font-black text-white truncate max-w-[85px] mt-0.5">
              {thirdPlace.nickname}
            </span>
            <span className="text-[10px] text-gray-300 font-black mb-1">
              {thirdPlace.score} نقطة
            </span>
            <div className="w-full h-14 bg-[#b45309] border-2 border-black rounded-t-2xl flex items-center justify-center text-base font-black text-white shadow-[0_3px_0_#78350f]">
              🥉 3
            </div>
          </div>
        )}
      </div>

      {/* 5. الترتيب الكامل للمتسابقين */}
      <div className="flex-1 bg-[#2d354b] border-3 border-black rounded-3xl p-3 shadow-[0_5px_0_#000] overflow-y-auto max-h-40 mb-2">
        <h3 className="text-xs font-black text-gray-300 mb-2 text-right">
          الترتيب العام للمشاركين:
        </h3>
        <div className="space-y-1.5">
          {leaderboard.map((entry) => (
            <div
              key={entry.id}
              className="p-2 rounded-xl bg-[#1e2337] border-2 border-black flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-black text-gray-400 w-5">#{entry.rank}</span>
                <ConsolePet avatar={entry.avatar} size={26} />
                <span className="font-black text-white">{entry.nickname}</span>
              </div>
              <span className="font-black text-arcade-yellow">{entry.score} نقطة</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. القسم السفلي وزر العودة للرئيسية */}
      <div className="w-full">
        <div className="bg-[#0070f3] border-3 border-black rounded-t-3xl p-3 shadow-[0_6px_0_#0047a5]">
          <button
            type="button"
            onClick={leaveRoom}
            className="w-full py-3.5 rounded-2xl arcade-btn-yellow text-black font-black text-lg border-3 border-black flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-[0_1px_0_#b45309]"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>لعب جولة جديدة 🎮</span>
          </button>
        </div>

        {/* كبسولة التبديل السفلية */}
        <div className="flex justify-center bg-[#1b2245] py-2">
          <div className="flex items-center bg-[#1e2337] border-2 border-black rounded-full p-1 shadow-[0_3px_0_#000]">
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
    </div>
  );
};
