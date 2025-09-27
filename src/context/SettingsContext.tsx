import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { SQLiteRepository } from '../database/repositories/SQLiteRepository';

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
  defaultLanguage: 'urdu' | 'english';
  setDefaultLanguage: (l: 'urdu' | 'english') => void;
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
  defaultLanguage: 'urdu',
  setDefaultLanguage: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [accentColor, setAccentColor] = useState<string>('#16a34a');
  const [engFont, setEngFont] = useState<string>('System');
  const [urduFont, setUrduFont] = useState<string>('System');
  const [engFontScale, setEngFontScale] = useState<number>(1.0);
  const [urduFontScale, setUrduFontScale] = useState<number>(1.2);
  const [fontScale, setFontScale] = useState<number>(1);
  const [defaultLanguage, setDefaultLanguage] = useState<'urdu' | 'english'>('urdu');
  const db = useMemo(() => new SQLiteRepository(), []);

  useEffect(() => {
    const loadSettings = async () => {
      await db.init();
      const settings = await db.getAllSettings();
      if (settings.theme) setTheme(settings.theme as Theme);
      if (settings.accent_color) setAccentColor(settings.accent_color);
      if (settings.eng_font) setEngFont(settings.eng_font);
      if (settings.urdu_font) setUrduFont(settings.urdu_font);
      if (settings.eng_font_size) setEngFontScale(parseFloat(settings.eng_font_size));
      if (settings.urdu_font_size) setUrduFontScale(parseFloat(settings.urdu_font_size));
      if (settings.default_language) setDefaultLanguage(settings.default_language as 'urdu' | 'english');
    };
    loadSettings();
  }, [db]);

  const updateSetting = async (key: string, value: string) => {
    await db.setSetting(key, value);
  };

  const value = useMemo(() => ({ 
    theme, 
    setTheme: (t: Theme) => {
      setTheme(t);
      updateSetting('theme', t);
    },
    accentColor, 
    setAccentColor: (c: string) => {
      setAccentColor(c);
      updateSetting('accent_color', c);
    },
    engFont, 
    setEngFont: (f: string) => {
      setEngFont(f);
      updateSetting('eng_font', f);
    },
    urduFont, 
    setUrduFont: (f: string) => {
      setUrduFont(f);
      updateSetting('urdu_font', f);
    },
    engFontScale, 
    setEngFontScale: (s: number) => {
      setEngFontScale(s);
      updateSetting('eng_font_size', s.toString());
    },
    urduFontScale, 
    setUrduFontScale: (s: number) => {
      setUrduFontScale(s);
      updateSetting('urdu_font_size', s.toString());
    },
    fontScale, setFontScale,
    defaultLanguage,
    setDefaultLanguage: (l: 'urdu' | 'english') => {
      setDefaultLanguage(l);
      updateSetting('default_language', l);
    }
  }), [theme, accentColor, engFont, urduFont, engFontScale, urduFontScale, fontScale, defaultLanguage, db]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}

export default SettingsContext;


// ---------- Theme tokens ----------
export type ThemeTokens = {
  isDark: boolean;
  background: string;
  surface: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  divider: string;
  overlay: string;
  modalBackdrop: string;
  accent: string;
  accentOnAccent: string;
  accentSubtle: string; // subtle surface tinted by accent
  danger: string;
};

function hexToRGBA(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useThemeTokens(): ThemeTokens {
  const { theme, accentColor } = useSettings();
  const isDark = theme === 'dark';
  return useMemo(() => {
    if (isDark) {
      return {
        isDark: true,
        background: '#0b1220',
        surface: '#0f172a',
        card: '#0f172a',
        textPrimary: '#e5e7eb',
        textSecondary: '#cbd5e1',
        textMuted: '#94a3b8',
        border: '#1f2937',
        divider: '#111827',
        overlay: 'rgba(2,6,23,0.65)',
        modalBackdrop: 'rgba(2,6,23,0.7)',
        accent: accentColor,
        accentOnAccent: '#ffffff',
        accentSubtle: hexToRGBA(accentColor, 0.16),
        danger: '#ef4444',
      } as ThemeTokens;
    }
    return {
      isDark: false,
      background: '#f9fafb',
      surface: '#ffffff',
      card: '#ffffff',
      textPrimary: '#111827',
      textSecondary: '#374151',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      divider: '#f3f4f6',
      overlay: 'rgba(249,250,251,0.65)',
      modalBackdrop: 'rgba(17,24,39,0.5)',
      accent: accentColor,
      accentOnAccent: '#ffffff',
      accentSubtle: hexToRGBA(accentColor, 0.12),
      danger: '#dc2626',
    } as ThemeTokens;
  }, [isDark, accentColor]);
}
