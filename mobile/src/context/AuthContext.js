import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService, settingsService } from '../api';
import { appStorage } from '../utils/storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const mapSettings = (rows = []) => {
    const mapped = {};
    rows.forEach((item) => {
      mapped[item.setting_key] = item.setting_value;
    });
    return mapped;
  };

  const loadSettings = async () => {
    try {
      const response = await settingsService.getAllSettings({ category: 'mobile' });
      const rows = response.data?.data || [];
      setSettings(mapSettings(rows));
    } catch (error) {
      console.log('Error loading mobile settings', error);
      setSettings({});
    }
  };

  const loadUser = async () => {
    try {
      const storedToken = await appStorage.getItem('token');
      const storedTenant = await appStorage.getItem('tenantId');
      
      if (storedToken && storedTenant) {
        setTenantId(storedTenant);
        const { data } = await authService.getProfile();
        setUser(data.data || data.user);
        await loadSettings();
      }
    } catch (error) {
      console.log('Error loading user', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (tenant, email, password) => {
    try {
      // First save tenant ID so interceptor catches it
      await appStorage.setItem('tenantId', tenant);
      setTenantId(tenant);
      
      const { data } = await authService.login({ email, password });
      
      if (data.requires2FA) {
        return { requires2FA: true, tempToken: data.tempToken, userId: data.userId };
      }
      
      // Axios returns the JSON payload in 'data'. The backend wraps the actual info in a nested 'data' object.
      const payload = data.data || data; // Fallback in case of structure differences
      
      await appStorage.setItem('token', String(payload.token));
      setUser(payload.user);
      await loadSettings();
      return { success: true };
    } catch (error) {
      await appStorage.deleteItem('tenantId');
      setTenantId(null);
      throw error;
    }
  };

  const verify2FA = async (userId, token) => {
    try {
      const { data } = await authService.verify2FALogin({ userId, token });
      const payload = data.data || data;
      
      await appStorage.setItem('token', String(payload.token));
      setUser(payload.user);
      await loadSettings();
      return true;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await appStorage.deleteItem('token');
    await appStorage.deleteItem('tenantId');
    setUser(null);
    setTenantId(null);
  };

  const refreshSettings = async () => {
    try {
      await loadSettings();
      return true;
    } catch (error) {
      console.log('Error refreshing settings', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, tenantId, settings, loading, loadUser, login, logout, verify2FA, refreshSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
