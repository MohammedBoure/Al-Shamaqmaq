import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GameProvider } from './context/GameContext';
import { ThemeProvider } from './context/ThemeContext';
import { ScaleProvider } from './context/ScaleContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ScaleProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </ScaleProvider>
    </ThemeProvider>
  </React.StrictMode>
);
