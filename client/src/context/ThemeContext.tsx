import React, { createContext, useContext, useState, useEffect } from 'react';
import { GameThemeId, GAME_THEMES } from '../types/theme';

interface ThemeContextType {
  theme: GameThemeId;
  setTheme: (themeId: GameThemeId) => void;
  toggleTheme: () => void;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<GameThemeId>(() => {
    try {
      const saved = localStorage.getItem('deception_theme') as GameThemeId;
      if (saved && GAME_THEMES.some((t) => t.id === saved)) return saved;
      if (saved === ('dark' as any)) return 'monochrome-magic';
    } catch (_) {}
    return 'monochrome-magic';
  });

  const selectedOption = GAME_THEMES.find((t) => t.id === theme);
  const isLight = !!selectedOption?.isLight || theme === 'light' || theme === 'light-steel';

  useEffect(() => {
    try {
      localStorage.setItem('deception_theme', theme);
    } catch (_) {}

    const root = document.documentElement;
    // Remove all previous theme classes
    GAME_THEMES.forEach((t) => {
      root.classList.remove(`theme-${t.id}`);
    });
    root.classList.remove('theme-light', 'theme-dark', 'dark', 'light');

    // Add current theme class and data-theme attribute
    root.classList.add(`theme-${theme}`);
    root.setAttribute('data-theme', theme);

    if (isLight) {
      root.classList.add('theme-light', 'light');
    } else {
      root.classList.add('dark');
    }
  }, [theme, isLight]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'monochrome-magic' ? 'light' : 'monochrome-magic'));
  };

  const setTheme = (themeId: GameThemeId) => {
    setThemeState(themeId);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isLight }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
