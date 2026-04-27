import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrentLocation } from '@/utils/location';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
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
      
      localStorage.setItem('userRole', userData.role.name);
      localStorage.setItem('userName', userData.name);
      localStorage.setItem('userId', userData.id);
      localStorage.setItem('userPermissions', JSON.stringify(userData.permissions || []));
    } catch (err) {
      console.error('Error refreshing user context:', err);
      // Only logout on 401 Unauthorized to avoid session loss on transient network errors
      if (err.response?.status === 401) logout();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedRole = localStorage.getItem('userRole');
    const savedName = localStorage.getItem('userName');
    const savedId = localStorage.getItem('userId');
    const savedPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');

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
    localStorage.setItem('token', userData.token);
    localStorage.setItem('userRole', userData.role.name);
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('userId', userData.id);
    localStorage.setItem('userPermissions', JSON.stringify(userData.permissions || []));
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      localStorage.removeItem('userPermissions');
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
