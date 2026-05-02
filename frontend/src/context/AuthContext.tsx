import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import type { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('clinic_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('clinic_token')
  );

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('clinic_token', newToken);
    localStorage.setItem('clinic_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('clinic_token');
    localStorage.removeItem('clinic_user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: User) => {
    localStorage.setItem('clinic_user', JSON.stringify(updated));
    setUser(updated);
  }, []);

  // Verify token on mount
  useEffect(() => {
    if (token) {
      api.get('/auth/me').catch(() => logout());
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
