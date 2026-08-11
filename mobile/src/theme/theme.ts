export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  muted: string;
  success: string;
  warning: string;
  error: string;
  heroStart: string;
  heroEnd: string;
  [key: string]: string;
}

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
}

export const DEFAULT_THEME: Theme = {
  mode: 'light',
  isDark: false,
  colors: {
    primary: '#4f46e5', // Modern Indigo
    accent: '#10b981',  // Success Green
    background: '#f8fafc',
    surface: '#ffffff',
    card: '#ffffff',
    text: '#0f172a',
    subtext: '#64748b',
    border: '#f1f5f9',
    muted: '#94a3b8',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    heroStart: '#4f46e5',
    heroEnd: '#818cf8',
  },
};

const palette = {
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    card: '#ffffff',
    text: '#0f172a',
    subtext: '#64748b',
    border: '#f1f5f9',
    muted: '#94a3b8',
  },
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    card: '#1e293b',
    text: '#f8fafc',
    subtext: '#94a3b8',
    border: '#334155',
    muted: '#475569',
  },
};

const normalizeColor = (value: string | undefined, fallback: string) => {
  if (!value || typeof value !== 'string') return fallback;
  return value.trim();
};

export const createThemeFromSettings = (settings: Record<string, any> | null | undefined = {}): Theme => {
  const safeSettings = settings || {};
  const mode = safeSettings.mobile_theme_mode === 'dark' ? 'dark' : 'light';
  const startColor = normalizeColor(safeSettings.mobile_brand_primary_color, DEFAULT_THEME.colors.primary);
  const accentColor = normalizeColor(safeSettings.mobile_brand_accent_color, DEFAULT_THEME.colors.accent);

  return {
    mode,
    isDark: mode === 'dark',
    colors: {
      primary: startColor,
      accent: accentColor,
      heroStart: startColor,
      heroEnd: normalizeColor(safeSettings.mobile_brand_gradient_end, DEFAULT_THEME.colors.heroEnd),
      ...palette[mode],
      success: normalizeColor(safeSettings.mobile_success_color, DEFAULT_THEME.colors.success),
      warning: normalizeColor(safeSettings.mobile_warning_color, DEFAULT_THEME.colors.warning),
      error: normalizeColor(safeSettings.mobile_error_color, DEFAULT_THEME.colors.error),
    },
  };
};
