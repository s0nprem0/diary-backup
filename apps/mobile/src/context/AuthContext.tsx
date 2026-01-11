import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { mobileAuthService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'mood_diary_auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Try to get token from AsyncStorage first (migration)
      let token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

      if (token) {
        // Token exists in AsyncStorage, keep it for now
        setIsAuthenticated(true);
      } else {
        // No token found
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (password: string): Promise<boolean> => {
    const success = await mobileAuthService.login(password);
    if (success) {
      setIsAuthenticated(true);
    }
    return success;
  }, []);

  const logout = useCallback(async () => {
    await mobileAuthService.logout();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
