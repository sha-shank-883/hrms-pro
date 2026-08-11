import React, { createContext, useState, useContext, useEffect } from 'react';
import { mobileConfigService } from '../api';
import { useAuth } from './AuthContext';

const AppConfigContext = createContext();

export const AppConfigProvider = ({ children }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState({
    mobile_branding: {
      primaryColor: '#6366f1',
      accentColor: '#4f46e5',
      logoUrl: null,
      appName: 'HRMS PRO'
    },
    mobile_features: {
      enableChat: true,
      enableBiometrics: true,
      enableFaceId: false,
      enableGeofencing: true
    },
    mobile_maintenance: {
      isUnderMaintenance: false,
      minAppVersion: '1.0.0',
      message: 'System upgrade in progress.'
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicConfig();
  }, []);

  useEffect(() => {
    if (user) {
      loadAllConfigs();
    }
  }, [user]);

  const loadPublicConfig = async () => {
    try {
      const res = await mobileConfigService.getPublicConfig();
      if (res.data.success) {
        setConfig(prev => ({
          ...prev,
          ...res.data.data
        }));
      }
    } catch (error) {
      console.log('Error loading public app config', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllConfigs = async () => {
    try {
      const res = await mobileConfigService.getAllConfigs();
      if (res.data.success) {
        const fullConfig = {};
        res.data.data.forEach(item => {
          fullConfig[item.config_key] = item.config_value;
        });
        setConfig(prev => ({
          ...prev,
          ...fullConfig
        }));
      }
    } catch (error) {
      console.log('Error loading all app configs', error);
    }
  };

  const isFeatureEnabled = (featureKey) => {
    return config.mobile_features?.[featureKey] ?? false;
  };

  return (
    <AppConfigContext.Provider value={{ 
      config, 
      loading, 
      loadPublicConfig, 
      loadAllConfigs,
      isFeatureEnabled 
    }}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => useContext(AppConfigContext);
