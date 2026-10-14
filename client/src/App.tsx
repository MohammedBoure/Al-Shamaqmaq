import React from 'react';
import { useGame } from './context/GameContext';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { WaitingRoomScreen } from './components/screens/WaitingRoomScreen';
import { TopicSelectionScreen } from './components/screens/TopicSelectionScreen';
import { AnsweringScreen } from './components/screens/AnsweringScreen';
import { VotingScreen } from './components/screens/VotingScreen';
import { RoundResultsScreen } from './components/screens/RoundResultsScreen';
import { GameOverScreen } from './components/screens/GameOverScreen';
import { AnimatedBackground } from './components/common/AnimatedBackground';

export const App: React.FC = () => {
  const { room, player, phase, timeRemaining, errorMessage, successMessage, clearError } = useGame();

  const isTimeLow =
    timeRemaining > 0 &&
    timeRemaining <= 10 &&
    (phase === 'TOPIC_SELECTION' || phase === 'ANSWERING' || phase === 'VOTING');

  const renderCurrentScreen = () => {
    if (!room || !player) {
      return <LobbyScreen />;
    }

    switch (phase) {
      case 'LOBBY':
        return <WaitingRoomScreen />;
      case 'TOPIC_SELECTION':
        return <TopicSelectionScreen />;
      case 'ANSWERING':
        return <AnsweringScreen />;
      case 'VOTING':
        return <VotingScreen />;
      case 'ROUND_RESULTS':
        return <RoundResultsScreen />;
      case 'GAME_OVER':
        return <GameOverScreen />;
      default:
        return <WaitingRoomScreen />;
    }
  };

  return (
    <div className="min-h-[100dvh] w-full table-canvas-dark text-on-surface antialiased flex flex-col relative selection:bg-surface-bright selection:text-white">
      <AnimatedBackground />

      {/* وميض أطراف الشاشة باللون الأحمر التحذيري عند بقاء 10 ثوانٍ أو أقل */}
      {isTimeLow && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-40 border-4 sm:border-8 border-rose-500 urgency-border-flash"
        />
      )}

      {/* إشعار الخطأ العائم */}
      {errorMessage && (
        <div className="fixed top-4 right-1/2 translate-x-1/2 z-50 max-w-sm w-[90%] p-3.5 rounded-2xl bg-surface-container-high/95 border border-red-500/40 text-white text-xs font-semibold shadow-2xl flex items-center justify-between gap-2 backdrop-blur-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-400 text-[20px] shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* إشعار النجاح العائم */}
      {successMessage && (
        <div className="fixed top-4 right-1/2 translate-x-1/2 z-50 max-w-sm w-[90%] p-3.5 rounded-2xl bg-surface-container-high/95 border border-white/40 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-fadeIn">
          <span className="material-symbols-outlined text-white text-[20px] shrink-0">check_circle</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* الشاشة النشطة */}
      <main className="flex-1 w-full min-h-0 flex flex-col">
        {renderCurrentScreen()}
      </main>
    </div>
  );
};

export default App;
