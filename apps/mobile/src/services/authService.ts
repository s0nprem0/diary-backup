import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { jwtEncode } from './tokenService';

const AUTH_TOKEN_KEY = 'mood_diary_auth_token';

// Get password from environment or use default for development
const getAuthPassword = (): string => {
  // In production, set MOOD_DIARY_PASSWORD env var
  return process.env.MOOD_DIARY_PASSWORD || 'diary123';
};

export const mobileAuthService = {
  // Authenticate user with password
  login: async (password: string): Promise<boolean> => {
    const expectedPassword = getAuthPassword();

    if (password === expectedPassword) {
      try {
        // Generate secure JWT token with expiration
        const token = await jwtEncode(
          { sub: 'user', iat: Date.now() },
          'secret_key' // In production, use environment variable
        );

        // Store token securely using expo-secure-store (encrypted)
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);

        // Also store in AsyncStorage as fallback (non-critical)
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);

        return true;
      } catch (error) {
        console.error('Failed to save auth token:', error);
        return false;
      }
    }
    return false;
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      // Try to get from secure storage first
      let token: string | null = null;
      try {
        token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      } catch {
        // If secure store fails, fall back to AsyncStorage
        token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      }

      if (!token) {
        return false;
      }

      // Verify token is still valid (not expired)
      const isValid = isTokenValid(token);
      if (!isValid) {
        // Token expired, clear it
        await mobileAuthService.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to check auth status:', error);
      return false;
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      // Try to remove from secure storage
      try {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      } catch {
        // Ignore if secure store fails, try AsyncStorage
      }

      // Also remove from AsyncStorage as fallback
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  },

  // Get auth token for API requests
  getToken: async (): Promise<string | null> => {
    try {
      // Try to get from secure storage first
      let token: string | null = null;
      try {
        token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      } catch {
        // If secure store fails, fall back to AsyncStorage
        token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      }

      if (!token) {
        return null;
      }

      // Check if token is still valid
      const isValid = isTokenValid(token);
      if (!isValid) {
        // Token expired, logout and return null
        await mobileAuthService.logout();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  },
};

/**
 * Helper function to validate token
 */
function isTokenValid(token: string): boolean {
  try {
    const { isValidToken } = require('./tokenService');
    return isValidToken(token);
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}
