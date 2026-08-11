import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useAuth } from './AuthContext';
import { createThemeFromSettings, DEFAULT_THEME, Theme } from '../theme/theme';

const ThemeContext = createContext<Theme>(DEFAULT_THEME);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { settings } = useAuth();
  const systemColorScheme = useColorScheme();
  
  const theme = useMemo(() => {
    const activeSettings = {
      ...settings,
      mobile_theme_mode: settings?.mobile_theme_mode === 'system' || !settings?.mobile_theme_mode 
        ? systemColorScheme 
        : settings?.mobile_theme_mode
    };
    return createThemeFromSettings(activeSettings);
  }, [settings, systemColorScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

