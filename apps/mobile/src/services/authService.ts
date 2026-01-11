import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { jwtEncode } from './tokenService';

const AUTH_TOKEN_KEY = 'mood_diary_auth_token';
const PASSWORD_SET_KEY = 'mood_diary_password_set';
const STORED_PASSWORD_KEY = 'mood_diary_stored_password';
const PASSWORD_HINT_KEY = 'mood_diary_password_hint';

// Check if password has been set by the user
const isPasswordSet = async (): Promise<boolean> => {
  try {
    const passwordSet = await AsyncStorage.getItem(PASSWORD_SET_KEY);
    return passwordSet === 'true';
  } catch (error) {
    console.error('Failed to check if password is set:', error);
    return false;
  }
};

// Get stored password
const getStoredPassword = async (): Promise<string | null> => {
  try {
    // Try to get from secure storage first
    try {
      const password = await SecureStore.getItemAsync(STORED_PASSWORD_KEY);
      if (password) return password;
    } catch {
      // Fall back to AsyncStorage
    }

    const password = await AsyncStorage.getItem(STORED_PASSWORD_KEY);
    return password;
  } catch (error) {
    console.error('Failed to get stored password:', error);
    return null;
  }
};

export const mobileAuthService = {
  // Create password for first-time users
  signup: async (password: string, hint?: string): Promise<boolean> => {
    if (!password || password.trim().length < 6) {
      console.error('Password must be at least 6 characters');
      return false;
    }

    try {
      // Store password securely
      try {
        await SecureStore.setItemAsync(STORED_PASSWORD_KEY, password);
      } catch {
        // Fall back to AsyncStorage if secure store fails
        await AsyncStorage.setItem(STORED_PASSWORD_KEY, password);
      }

      // Mark password as set
      await AsyncStorage.setItem(PASSWORD_SET_KEY, 'true');

      // Store password hint if provided
      if (hint && hint.trim()) {
        try {
          await SecureStore.setItemAsync(PASSWORD_HINT_KEY, hint.trim());
        } catch {
          await AsyncStorage.setItem(PASSWORD_HINT_KEY, hint.trim());
        }
      }

      // Automatically login after signup
      return await mobileAuthService.login(password);
    } catch (error) {
      console.error('Failed to create password:', error);
      return false;
    }
  },

  // Authenticate user with password
  login: async (password: string): Promise<boolean> => {
    try {
      const storedPassword = await getStoredPassword();

      if (password === storedPassword) {
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
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  // Check if password has been set up
  isPasswordSetup: isPasswordSet,

  // Get password hint
  getPasswordHint: async (): Promise<string | null> => {
    try {
      // Try secure store first
      try {
        const hint = await SecureStore.getItemAsync(PASSWORD_HINT_KEY);
        if (hint) return hint;
      } catch {
        // Fall back to AsyncStorage
      }

      const hint = await AsyncStorage.getItem(PASSWORD_HINT_KEY);
      return hint;
    } catch (error) {
      console.error('Failed to get password hint:', error);
      return null;
    }
  },

  // Reset password with current password verification
  resetPassword: async (oldPassword: string, newPassword: string, newHint?: string): Promise<boolean> => {
    try {
      // Verify old password
      const storedPassword = await getStoredPassword();
      if (oldPassword !== storedPassword) {
        return false;
      }

      if (!newPassword || newPassword.trim().length < 6) {
        console.error('New password must be at least 6 characters');
        return false;
      }

      // Store new password
      try {
        await SecureStore.setItemAsync(STORED_PASSWORD_KEY, newPassword);
      } catch {
        await AsyncStorage.setItem(STORED_PASSWORD_KEY, newPassword);
      }

      // Update hint if provided
      if (newHint && newHint.trim()) {
        try {
          await SecureStore.setItemAsync(PASSWORD_HINT_KEY, newHint.trim());
        } catch {
          await AsyncStorage.setItem(PASSWORD_HINT_KEY, newHint.trim());
        }
      }

      // Auto-login with new password
      return await mobileAuthService.login(newPassword);
    } catch (error) {
      console.error('Failed to reset password:', error);
      return false;
    }
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
