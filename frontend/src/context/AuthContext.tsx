import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthTokens, User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokens, setTokens] = useState<AuthTokens | null>(() => {
    const saved = localStorage.getItem('auth_tokens');
    return saved ? JSON.parse(saved) : null;
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (tokens) {
      localStorage.setItem('auth_tokens', JSON.stringify(tokens));
    } else {
      localStorage.removeItem('auth_tokens');
    }
  }, [tokens]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  const login = async (credentials: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(credentials);
      setTokens(res.data);

      const usernameLower = credentials.username.toLowerCase();
      let detectedRole: UserRole = 'receptionist';

      if (usernameLower.includes('admin')) {
        detectedRole = 'admin';
      } else if (usernameLower.includes('security') || usernameLower.includes('officer') || usernameLower.includes('guard')) {
        detectedRole = 'security_officer';
      }

      const userObj: User = {
        id: 1,
        username: credentials.username,
        role: detectedRole,
      };
      setUser(userObj);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setTokens(null);
    setUser(null);
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, tokens, isAuthenticated: !!tokens, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};