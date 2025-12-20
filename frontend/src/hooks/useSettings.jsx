import { useState, useEffect, createContext, useContext } from 'react';
import { settingsService } from '../services';
import { applyDesignSettings } from '../utils/designSystem';

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
      
      // Apply design settings
      applyDesignSettings(settingsObj);
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

  const refreshSettings = async () => {
    await loadSettings();
    
    // Dispatch event to notify other parts of the app
    window.dispatchEvent(new CustomEvent('settingsUpdated', {
      detail: settings
    }));
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
    if (value === 'true') return true;
    if (value === 'false') return false;
    return defaultValue;
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      error,
      loadSettings,
      refreshSettings,
      getSetting,
      getSettingNumber,
      getSettingBoolean
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook to use settings
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};