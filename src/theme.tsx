import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Mode = 'light' | 'dark';

export interface Theme {
  surface: string;
  primary: string;
  secondary: string;
  muted: string;
  gridline: string;
  baseline: string;
  asset: string;
  liability: string;
  expense: string;
  income: string;
  forecast: string;
  areaFill: string;
}

const LIGHT: Theme = {
  surface: '#fcfcfb',
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  gridline: '#e1e0d9',
  baseline: '#c3c2b7',
  asset: '#2a78d6',
  liability: '#eb6834',
  expense: '#1baf7a',
  income: '#008300',
  forecast: '#898781',
  areaFill: 'rgba(42, 120, 214, 0.10)',
};

const DARK: Theme = {
  surface: '#1a1a19',
  primary: '#f0efec',
  secondary: '#c3c2b7',
  muted: '#898781',
  gridline: '#2c2c2a',
  baseline: '#383835',
  asset: '#3987e5',
  liability: '#d95926',
  expense: '#199e70',
  income: '#008300',
  forecast: '#898781',
  areaFill: 'rgba(57, 135, 229, 0.12)',
};

export const chartTheme: Record<Mode, Theme> = { light: LIGHT, dark: DARK };

interface ThemeCtx {
  mode: Mode;
  theme: Theme;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const value = useMemo<ThemeCtx>(
    () => ({
      mode,
      theme: chartTheme[mode],
      toggle: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
    }),
    [mode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
