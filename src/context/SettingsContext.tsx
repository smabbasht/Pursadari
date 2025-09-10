import React, { createContext, useContext, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';

type SettingsValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  engFont: string;
  setEngFont: (f: string) => void;
  urduFont: string;
  setUrduFont: (f: string) => void;
  engFontScale: number;
  setEngFontScale: (s: number) => void;
  urduFontScale: number;
  setUrduFontScale: (s: number) => void;
  // Legacy support
  fontScale: number;
  setFontScale: (n: number) => void;
};

const SettingsContext = createContext<SettingsValue>({
  theme: 'light',
  setTheme: () => {},
  accentColor: '#16a34a',
  setAccentColor: () => {},
  engFont: 'System',
  setEngFont: () => {},
  urduFont: 'System',
  setUrduFont: () => {},
  engFontScale: 1.0,
  setEngFontScale: () => {},
  urduFontScale: 1.2,
  setUrduFontScale: () => {},
  fontScale: 1,
  setFontScale: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [accentColor, setAccentColor] = useState<string>('#16a34a');
  const [engFont, setEngFont] = useState<string>('System');
  const [urduFont, setUrduFont] = useState<string>('System');
  const [engFontScale, setEngFontScale] = useState<number>(1.0);
  const [urduFontScale, setUrduFontScale] = useState<number>(1.2);
  const [fontScale, setFontScale] = useState<number>(1);

  const value = useMemo(() => ({ 
    theme, setTheme, 
    accentColor, setAccentColor,
    engFont, setEngFont,
    urduFont, setUrduFont,
    engFontScale, setEngFontScale,
    urduFontScale, setUrduFontScale,
    fontScale, setFontScale 
  }), [theme, accentColor, engFont, urduFont, engFontScale, urduFontScale, fontScale]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}

export default SettingsContext;


