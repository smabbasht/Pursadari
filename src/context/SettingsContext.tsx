import React, { createContext, useContext, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';

type SettingsValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  fontScale: number; // 0.8 - 1.6
  setFontScale: (n: number) => void;
};

const SettingsContext = createContext<SettingsValue>({
  theme: 'light',
  setTheme: () => {},
  fontScale: 1,
  setFontScale: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [fontScale, setFontScale] = useState<number>(1);

  const value = useMemo(() => ({ theme, setTheme, fontScale, setFontScale }), [theme, fontScale]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}

export default SettingsContext;


