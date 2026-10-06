import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { useGame } from './context/GameContext';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { WaitingRoomScreen } from './components/screens/WaitingRoomScreen';
import { TopicSelectionScreen } from './components/screens/TopicSelectionScreen';
import { AnsweringScreen } from './components/screens/AnsweringScreen';
import { VotingScreen } from './components/screens/VotingScreen';
import { RoundResultsScreen } from './components/screens/RoundResultsScreen';
import { GameOverScreen } from './components/screens/GameOverScreen';

export const App: React.FC = () => {
  const { room, player, phase, errorMessage, successMessage, clearError } = useGame();

  const renderCurrentScreen = () => {
    // إذا لم ينضم بعد لغرفة
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
    <div className="min-h-screen bg-arcade-bg text-white flex flex-col relative selection:bg-arcade-pink selection:text-white">
      {/* إشعار الخطأ العائم */}
      {errorMessage && (
        <div className="fixed top-4 right-1/2 translate-x-1/2 z-50 max-w-sm w-[90%] p-3.5 rounded-2xl bg-rose-950/95 border-2 border-rose-500 text-rose-200 text-xs font-bold shadow-2xl flex items-center justify-between gap-2 backdrop-blur-lg animate-bounce-subtle">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="p-1 rounded-lg hover:bg-rose-800/40 text-rose-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* إشعار النجاح العائم */}
      {successMessage && (
        <div className="fixed top-4 right-1/2 translate-x-1/2 z-50 max-w-sm w-[90%] p-3.5 rounded-2xl bg-emerald-950/95 border-2 border-emerald-500 text-emerald-200 text-xs font-bold shadow-2xl flex items-center gap-2 backdrop-blur-lg animate-bounce-subtle">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* الشاشة النشطة */}
      <main className="flex-1 flex flex-col justify-center">
        {renderCurrentScreen()}
      </main>
    </div>
  );
};

export default App;
