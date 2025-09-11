import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // Load theme from localStorage or system preference
    const savedTheme = localStorage.getItem('freelancex-theme') as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Update CSS custom properties for smooth transitions
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--bg-primary', '15 23 42'); // slate-900
      root.style.setProperty('--bg-secondary', '30 41 59'); // slate-800
      root.style.setProperty('--bg-tertiary', '51 65 85'); // slate-700
      root.style.setProperty('--text-primary', '248 250 252'); // slate-50
      root.style.setProperty('--text-secondary', '226 232 240'); // slate-300
      root.style.setProperty('--border-primary', '71 85 105'); // slate-600
      root.style.setProperty('--accent-primary', '147 51 234'); // purple-600
      root.style.setProperty('--accent-secondary', '236 72 153'); // pink-500
    } else {
      root.style.setProperty('--bg-primary', '255 255 255'); // white
      root.style.setProperty('--bg-secondary', '248 250 252'); // slate-50
      root.style.setProperty('--bg-tertiary', '241 245 249'); // slate-100
      root.style.setProperty('--text-primary', '15 23 42'); // slate-900
      root.style.setProperty('--text-secondary', '71 85 105'); // slate-600
      root.style.setProperty('--border-primary', '226 232 240'); // slate-300
      root.style.setProperty('--accent-primary', '147 51 234'); // purple-600
      root.style.setProperty('--accent-secondary', '236 72 153'); // pink-500
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('freelancex-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={`theme-transition ${theme}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
