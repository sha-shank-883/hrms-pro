import { useState, useEffect, createContext, useContext } from 'react';
import { settingsService } from '../services';

// Create Settings Context
const SettingsContext = createContext();

// Settings Provider Component
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getAll();
      const settingsObj = {};
      response.data.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      setSettings(settingsObj);
      setError(null);
    } catch (err) {
      // Only log error if it's not a 401 (unauthorized)
      if (err.response?.status !== 401) {
        setError(err.message);
        console.error('Failed to load settings:', err);
      }
      // For 401 errors, set empty settings (user not logged in yet)
      setSettings({});
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key, defaultValue = '') => {
    return settings[key] || defaultValue;
  };

  const getSettingNumber = (key, defaultValue = 0) => {
    const value = settings[key];
    return value ? parseFloat(value) : defaultValue;
  };

  const getSettingBoolean = (key, defaultValue = false) => {
    const value = settings[key];
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return defaultValue;
  };

  const refreshSettings = () => {
    loadSettings();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Apply Theme Settings
  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      const root = document.documentElement;

      if (settings.brand_primary_color) {
        root.style.setProperty('--primary-color', settings.brand_primary_color);
        // Simple darkening for hover state - could be improved with color lib
        // For now, we rely on the main color or user can set overrides if we add them
      }

      if (settings.brand_secondary_color) {
        root.style.setProperty('--secondary-color', settings.brand_secondary_color);
      }

      // Reset if not present (optional, or stick to defaults defined in CSS)
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      error,
      getSetting,
      getSettingNumber,
      getSettingBoolean,
      refreshSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use settings
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
