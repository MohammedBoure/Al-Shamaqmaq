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
    <div className="flex flex-col min-h-screen bg-[#1b2245] light:bg-[#f4f7fb] bg-arcade-pattern px-3 pt-3 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto w-full select-none justify-between relative pb-1">
      {/* 1. الشريط العلوي التتويجي */}
      <GameTopHeader
        currentRound={totalRounds}
        totalRounds={totalRounds}
        centerType="crown"
        onMenuClick={leaveRoom}
      />

      {/* 2. عنوان التتويج والنجوم الذهبية الثلاث */}
      <div className="text-center my-2 relative z-10">
        <div className="flex justify-center items-end gap-1 mb-1">
          <span className="text-2xl drop-shadow-[0_2px_0_#000] transform -rotate-12">⭐</span>
          <span className="text-4xl drop-shadow-[0_2px_0_#000] -translate-y-1">👑</span>
          <span className="text-2xl drop-shadow-[0_2px_0_#000] transform rotate-12">⭐</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white light:text-slate-900 text-stroke-arcade tracking-wider drop-shadow-[0_2px_0_#000]">
          تتويج بطل اللعبة!
        </h1>
        <p className="text-xs md:text-sm text-amber-300 light:text-amber-700 font-bold mt-0.5">
          تهانينا للأذكى والأكثر براعة في الخداع والتضليل 🎭
        </p>
      </div>

      {/* 3. تتويج الفريق الفائز إذا كان وضع الفرق مفعلاً */}
      {room?.teamScores && room.teamScores.length > 0 && (
        <div className="mb-2 p-3 rounded-2xl bg-[#2d354b] light:bg-white border-3 border-black shadow-[0_4px_0_#000] text-center max-w-xl mx-auto w-full">
          <div className="text-xs font-black text-arcade-cyan light:text-purple-600 flex items-center justify-center gap-1.5 mb-1">
            <Swords className="w-4 h-4" />
            <span>نتيجة الفرق النهائية</span>
          </div>
          <div className="text-sm font-black text-white light:text-slate-900">
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

      {/* تخطيط مرن للكمبيوتر: المنصة على اليمين والترتيب على اليسار */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end my-auto py-2">
        {/* 4. منصة التتويج الثلاثية (Podium) */}
        <div className="md:col-span-7 flex items-end justify-center gap-3 px-1">
          {/* المركز الثاني */}
          {secondPlace && (
            <div className="flex-1 flex flex-col items-center">
              <div className="animate-bounce-subtle">
                <ConsolePet avatar={secondPlace.avatar} size={50} />
              </div>
              <span className="text-xs md:text-sm font-black text-white light:text-slate-900 truncate max-w-[90px] mt-0.5">
                {secondPlace.nickname}
              </span>
              <span className="text-[10px] md:text-xs text-gray-300 light:text-slate-500 font-black mb-1">
                {secondPlace.score} نقطة
              </span>
              <div className="w-full h-24 md:h-32 bg-[#64748b] border-3 border-black rounded-t-2xl flex items-center justify-center text-lg md:text-xl font-black text-white shadow-[0_3px_0_#334155]">
                🥈 2
              </div>
            </div>
          )}

          {/* المركز الأول - البطل */}
          {firstPlace && (
            <div className="flex-1 flex flex-col items-center -mt-6">
              <div className="relative animate-bounce">
                <span className="absolute -top-4 right-1/2 translate-x-1/2 text-2xl">
                  👑
                </span>
                <ConsolePet avatar={firstPlace.avatar} size={72} />
              </div>
              <span className="text-sm md:text-base font-black text-arcade-yellow light:text-amber-700 truncate max-w-[110px] mt-0.5 drop-shadow-[0_1px_0_#000]">
                {firstPlace.nickname}
              </span>
              <span className="text-xs md:text-sm text-arcade-yellow light:text-amber-600 font-black mb-1">
                {firstPlace.score} نقطة
              </span>
              <div className="w-full h-32 md:h-44 bg-[#f59e0b] border-3 border-black rounded-t-2xl flex items-center justify-center text-2xl md:text-3xl font-black text-black shadow-[0_4px_0_#b45309]">
                🥇 1
              </div>
            </div>
          )}

          {/* المركز الثالث */}
          {thirdPlace && (
            <div className="flex-1 flex flex-col items-center">
              <div className="animate-bounce-subtle">
                <ConsolePet avatar={thirdPlace.avatar} size={44} />
              </div>
              <span className="text-xs md:text-sm font-black text-white light:text-slate-900 truncate max-w-[90px] mt-0.5">
                {thirdPlace.nickname}
              </span>
              <span className="text-[10px] md:text-xs text-gray-300 light:text-slate-500 font-black mb-1">
                {thirdPlace.score} نقطة
              </span>
              <div className="w-full h-16 md:h-22 bg-[#b45309] border-3 border-black rounded-t-2xl flex items-center justify-center text-base md:text-lg font-black text-white shadow-[0_3px_0_#78350f]">
                🥉 3
              </div>
            </div>
          )}
        </div>

        {/* 5. الترتيب الكامل للمتسابقين */}
        <div className="md:col-span-5 bg-[#2d354b] light:bg-white border-3 border-black rounded-3xl p-3 md:p-4 shadow-[0_5px_0_#000] overflow-y-auto max-h-56">
          <h3 className="text-xs md:text-sm font-black text-gray-300 light:text-slate-700 mb-2 text-right">
            الترتيب العام للمشاركين:
          </h3>
          <div className="space-y-1.5">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className="p-2 md:p-2.5 rounded-xl bg-[#1e2337] light:bg-slate-100 border-2 border-black flex items-center justify-between text-xs md:text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-black text-gray-400 light:text-slate-500 w-5">#{entry.rank}</span>
                  <ConsolePet avatar={entry.avatar} size={28} />
                  <span className="font-black text-white light:text-slate-900">{entry.nickname}</span>
                </div>
                <span className="font-black text-arcade-yellow light:text-amber-700">{entry.score} نقطة</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. القسم السفلي وزر العودة للرئيسية */}
      <div className="w-full">
        <div className="bg-[#0070f3] border-3 border-black rounded-t-3xl p-3 md:p-4 shadow-[0_6px_0_#0047a5]">
          <button
            type="button"
            onClick={leaveRoom}
            className="w-full py-4 rounded-2xl arcade-btn-yellow text-black font-black text-lg md:text-xl border-3 border-black flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_0_#b45309] active:translate-y-1 active:shadow-[0_1px_0_#b45309]"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>لعب جولة جديدة 🎮</span>
          </button>
        </div>

        {/* كبسولة التبديل السفلية */}
        <div className="flex justify-center bg-[#1b2245] light:bg-[#f4f7fb] py-2">
          <div className="flex items-center bg-[#1e2337] light:bg-white border-2 border-black rounded-full p-1 shadow-[0_3px_0_#000]">
            <button
              type="button"
              onClick={() => setActiveBottomTab('game')}
              className={`px-6 py-1 rounded-full text-xs font-black transition-all ${
                activeBottomTab === 'game'
                  ? 'bg-[#0070f3] text-white border border-black shadow-sm'
                  : 'text-gray-400 light:text-slate-600 hover:text-white'
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
                  : 'text-gray-400 light:text-slate-600 hover:text-white'
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
