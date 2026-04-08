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

  const login = async (email, password) => {
    
    

    const data = await authService.login(email, password);
    

    if (data.requires2FA) {
      return data;
    }

    // Fetch full profile to get employee information
    const profileResponse = await authService.getProfile();
    

    const fullUser = { ...data.data.user, ...profileResponse.data.data };
    

    setUser(fullUser);
    setIsAuthenticated(true);

    
    return data;
  };

  const register = async (email, password, role) => {
    const data = await authService.register(email, password, role);
    // Fetch full profile to get employee information
    const profileResponse = await authService.getProfile();
    const fullUser = { ...data.data.user, ...profileResponse.data.data };
    setUser(fullUser);
    setIsAuthenticated(true);
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
      setUser(prevUser => ({ ...prevUser, ...profileResponse.data.data }));
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      // If it's an auth error, redirect to login
      if (error.response?.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    refreshProfile,
    isAuthenticated,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};