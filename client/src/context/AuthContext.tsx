import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export type RoleType = 'student' | 'staff' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: RoleType;
  phone?: string;
  student_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => void;
  demoLogin: (role: 'student' | 'staff' | 'admin') => Promise<User>;
  updateProfile: (payload: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  getDashboardRoute: (role?: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('queueless_token'));
  const [loading, setLoading] = useState(true);

  const normalizeUser = (u: any): User => {
    const rawRole = (u.role || '').toLowerCase();
    const role: RoleType = rawRole === 'staff' ? 'staff' : rawRole === 'admin' ? 'admin' : 'student';
    return { ...u, role };
  };

  const getDashboardRoute = (targetRole?: string): string => {
    const r = (targetRole || user?.role || 'student').toLowerCase();
    if (r === 'admin') return '/admin/dashboard';
    if (r === 'staff') return '/staff/dashboard';
    return '/student/dashboard';
  };

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('queueless_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      const normalized = normalizeUser(res.user);
      setUser(normalized);
    } catch {
      localStorage.removeItem('queueless_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    localStorage.setItem('queueless_token', res.token);
    setToken(res.token);
    const normalized = normalizeUser(res.user);
    setUser(normalized);
    return normalized;
  };

  const register = async (payload: any): Promise<User> => {
    const res = await api.register(payload);
    localStorage.setItem('queueless_token', res.token);
    setToken(res.token);
    const normalized = normalizeUser(res.user);
    setUser(normalized);
    return normalized;
  };

  const logout = () => {
    localStorage.removeItem('queueless_token');
    setToken(null);
    setUser(null);
  };

  const demoLogin = async (role: 'student' | 'staff' | 'admin'): Promise<User> => {
    const res = await api.demoLogin(role);
    localStorage.setItem('queueless_token', res.token);
    setToken(res.token);
    const normalized = normalizeUser(res.user);
    setUser(normalized);
    return normalized;
  };

  const updateProfile = async (payload: any) => {
    const res = await api.updateProfile(payload);
    const normalized = normalizeUser(res.user);
    setUser(normalized);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        demoLogin,
        updateProfile,
        refreshUser,
        getDashboardRoute
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
