import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrentLocation } from '@/utils/location';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth`, {
        headers: { 'x-auth-token': token }
      });
      const userData = res.data;
      
      setUser({
        id: userData.id,
        role: userData.role,
        name: userData.name,
        permissions: userData.permissions || []
      });
      
      sessionStorage.setItem('userRole', userData.role.name);
      sessionStorage.setItem('userName', userData.name);
      sessionStorage.setItem('userId', userData.id);
      sessionStorage.setItem('userPermissions', JSON.stringify(userData.permissions || []));
    } catch (err) {
      console.error('Error refreshing user context:', err);
      // Only logout on 401 Unauthorized to avoid session loss on transient network errors
      if (err.response?.status === 401) logout();
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const savedRole = sessionStorage.getItem('userRole');
    const savedName = sessionStorage.getItem('userName');
    const savedId = sessionStorage.getItem('userId');
    const savedPermissions = JSON.parse(sessionStorage.getItem('userPermissions') || '[]');

    if (token && savedRole) {
      setUser({ 
        id: savedId, 
        role: { name: savedRole }, 
        name: savedName || 'User',
        permissions: savedPermissions
      });
      // On mount, perform a "live" refresh to catch any changes since last login
      refreshUser();
    }
    setLoading(false);
  }, []);

  // Periodic polling for subadmin permissions (Heartbeat)
  useEffect(() => {
    if (!user || user.role?.name !== 'subadmin') return;

    const heartbeat = setInterval(() => {
      refreshUser();
    }, 30000); // 30 second interval for live updates

    return () => clearInterval(heartbeat);
  }, [user?.id, user?.role?.name]);

  const login = (userData) => {
    setUser(userData);
    sessionStorage.setItem('token', userData.token);
    sessionStorage.setItem('userRole', userData.role.name);
    sessionStorage.setItem('userName', userData.name);
    sessionStorage.setItem('userId', userData.id);
    sessionStorage.setItem('userPermissions', JSON.stringify(userData.permissions || []));
  };

  const logout = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (token) {
        const locationData = await getCurrentLocation();
        await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, 
          { location: locationData },
          { headers: { 'x-auth-token': token } }
        );
      }
    } catch (err) {
      console.error('Logout logging failed:', err);
    } finally {
      setUser(null);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('userPermissions');
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
