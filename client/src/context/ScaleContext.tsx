import React, { createContext, useContext, useState, useEffect } from 'react';

interface ScaleContextType {
  scale: number;
  setScale: (newScale: number) => void;
  increaseScale: () => void;
  decreaseScale: () => void;
  resetScale: () => void;
}

const ScaleContext = createContext<ScaleContextType | undefined>(undefined);

const STORAGE_KEY = 'deception_game_scale';
const DEFAULT_SCALE = 1.0;
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.3;
const STEP = 0.05;

export const ScaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scale, setScaleState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= MIN_SCALE && parsed <= MAX_SCALE) {
          return Math.round(parsed * 100) / 100;
        }
      }
    } catch (_) {}
    return DEFAULT_SCALE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(scale));
    } catch (_) {}

    const root = document.documentElement;
    root.style.setProperty('--game-scale', `${scale}`);

    // If browser supports CSS zoom (Chromium, Safari, Edge):
    const hasZoom = typeof (root.style as any).zoom !== 'undefined';
    if (hasZoom) {
      (root.style as any).zoom = `${scale}`;
    } else {
      // Fallback for browsers without zoom support: scale base font size
      const basePx =
        window.innerWidth <= 375
          ? 12.5
          : window.innerWidth <= 640
          ? 13.5
          : window.innerWidth <= 1024
          ? 15
          : 16;
      (root as HTMLElement).style.fontSize = `${basePx * scale}px`;
    }
  }, [scale]);

  const setScale = (newScale: number) => {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(newScale * 100) / 100));
    setScaleState(clamped);
  };

  const increaseScale = () => {
    setScaleState((prev) => Math.min(MAX_SCALE, Math.round((prev + STEP) * 100) / 100));
  };

  const decreaseScale = () => {
    setScaleState((prev) => Math.max(MIN_SCALE, Math.round((prev - STEP) * 100) / 100));
  };

  const resetScale = () => {
    setScaleState(DEFAULT_SCALE);
  };

  return (
    <ScaleContext.Provider value={{ scale, setScale, increaseScale, decreaseScale, resetScale }}>
      {children}
    </ScaleContext.Provider>
  );
};

export const useScale = (): ScaleContextType => {
  const context = useContext(ScaleContext);
  if (!context) {
    throw new Error('useScale must be used within a ScaleProvider');
  }
  return context;
};
