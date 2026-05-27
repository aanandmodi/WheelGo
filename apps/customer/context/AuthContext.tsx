import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { setSessionExpiredCallback } from '../constants/ApiService';

interface User {
  id: number;
  phone_number: string;
  full_name: string;
  email?: string;
  role: 'customer' | 'vendor';
  is_active: boolean;
  profile_picture?: string;
  is_kyc_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
    setSessionExpiredCallback(() => {
      logout();
    });
    return () => setSessionExpiredCallback(() => {});
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedRefresh, storedUser] = await Promise.all([
        SecureStore.getItemAsync('access_token'),
        SecureStore.getItemAsync('refresh_token'),
        SecureStore.getItemAsync('user_data'),
      ]);
      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        setRefreshToken(storedRefresh);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load auth', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (access: string, refresh: string, userData: User) => {
    try {
      await Promise.all([
        SecureStore.setItemAsync('access_token', access),
        SecureStore.setItemAsync('refresh_token', refresh),
        SecureStore.setItemAsync('user_data', JSON.stringify(userData)),
      ]);
      setAccessToken(access);
      setRefreshToken(refresh);
      setUser(userData);
    } catch (e) {
      console.error('Failed to save credentials on login', e);
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('access_token'),
        SecureStore.deleteItemAsync('refresh_token'),
        SecureStore.deleteItemAsync('user_data'),
      ]);
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    } catch (e) {
      console.error('Failed to clear credentials on logout', e);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    try {
      await SecureStore.setItemAsync('user_data', JSON.stringify(updated));
      setUser(updated);
    } catch (e) {
      console.error('Failed to update user data', e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, accessToken, refreshToken,
      isLoggedIn: !!accessToken,
      isLoading, login, logout, updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
