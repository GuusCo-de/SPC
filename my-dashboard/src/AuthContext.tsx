import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AuthState = {
  token: string | null;
  user?: { username: string } | null;
};

type AuthContextType = AuthState & {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<{ username: string } | null>(() => {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem('auth_token', token); else localStorage.removeItem('auth_token');
    if (user) localStorage.setItem('auth_user', JSON.stringify(user)); else localStorage.removeItem('auth_user');
  }, [token, user]);

  const login = async (username: string, password: string) => {
    try {
      const base = (import.meta as any).env.VITE_BACKEND_URL || 'https://spc-8hcz.onrender.com';
      const res = await fetch(`${String(base).replace(/\/$/, '')}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) return false;
      const data = await res.json();
      setToken(data.token);
      setUser(data.user || { username });
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => { setToken(null); setUser(null); };

  const value = useMemo(() => ({ token, user, login, logout }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const authHeader = (token: string | null | undefined): Record<string, string> => token ? { Authorization: `Bearer ${token}` } : {};
