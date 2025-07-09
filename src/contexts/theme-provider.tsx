'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './auth-context';

type Theme = 'dark' | 'light'

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { gymProfile } = useAuth();
  
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return 'dark'
    }
    const storedTheme = localStorage.getItem('fitness-flow-theme') as Theme
    return storedTheme || 'dark'
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('fitness-flow-theme', theme);
  }, [theme]);

  useEffect(() => {
      const root = document.documentElement;
      
      const propertiesToReset = ['--background', '--foreground', '--card', '--card-foreground', '--popover', '--popover-foreground', '--primary', '--primary-foreground', '--secondary', '--secondary-foreground', '--muted', '--muted-foreground', '--accent', '--accent-foreground', '--destructive', '--destructive-foreground', '--border', '--input', '--ring'];

      // Function to reset styles to default (from globals.css)
      const resetStyles = () => {
        propertiesToReset.forEach(prop => root.style.removeProperty(prop));
      };

      if (theme === 'dark') {
          resetStyles();
          return;
      }

      if (theme === 'light' && gymProfile?.theme) {
          for (const [key, value] of Object.entries(gymProfile.theme)) {
              root.style.setProperty(`--${key}`, value);
          }
      } else {
        // If in light mode but no gym theme, ensure styles are reset
        resetStyles();
      }

  }, [gymProfile, theme]);


  const value = { theme, setTheme }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
