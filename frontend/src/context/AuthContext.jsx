import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    
    const currentUser = authService.getCurrentUser();
    const authenticated = authService.isAuthenticated();
    
    

    if (currentUser && authenticated) {
      setUser(currentUser);
      setIsAuthenticated(true);
      // Fetch latest profile in background to keep permissions synced
      authService.getProfile().then(res => {
        const fullUser = { ...currentUser, ...res.data };
        setUser(fullUser);
        localStorage.setItem('user', JSON.stringify(fullUser));
        if (fullUser.tenant_id) {
          localStorage.setItem('tenant_id', fullUser.tenant_id);
        }
      }).catch(err => console.error('Failed to sync profile on load', err));
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  // Listen for auth:logout event from API interceptor
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
      // Redirect to login page only if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async (email, password, extra = {}) => {
    const data = await authService.login(email, password, extra);
    

    if (data.requires2FA) {
      return data;
    }

    // Fetch full profile to get employee information
    const profileResponse = await authService.getProfile();
    const fullUser = { ...data.data.user, ...profileResponse.data };

    setUser(fullUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(fullUser));
    if (fullUser.tenant_id) {
      localStorage.setItem('tenant_id', fullUser.tenant_id);
    }

    
    return data;
  };

  const register = async (email, password, role) => {
    const data = await authService.register(email, password, role);
    // Fetch full profile to get employee information
    const profileResponse = await authService.getProfile();
    const fullUser = { ...data.data.user, ...profileResponse.data };
    setUser(fullUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(fullUser));
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    // Redirect to login page
    window.location.replace('/login');
  };

  const refreshProfile = async () => {
    try {
      const profileResponse = await authService.getProfile();
      setUser(prevUser => {
        const fullUser = { ...prevUser, ...profileResponse.data };
        localStorage.setItem('user', JSON.stringify(fullUser));
        return fullUser;
      });
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      // If it's an auth error, redirect to login
      if (error.response?.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
  };

  const hasModule = (moduleKey) => {
    if (!user) return false;
    // Super Admin has access to all modules
    if (user.isSuperAdmin || user.role === 'super_admin') return true;
    if (user.tenant_modules && user.tenant_modules.includes('all')) return true;
    if (user.tenant_modules && Array.isArray(user.tenant_modules)) {
      return user.tenant_modules.includes(moduleKey);
    }
    // Default fallback: core modules
    return ['core_hr', 'attendance', 'leaves', 'tasks', 'documents'].includes(moduleKey);
  };

  const value = {
    user,
    login,
    register,
    logout,
    refreshProfile,
    hasModule,
    isAuthenticated,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};