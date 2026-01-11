import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'mood_diary_auth_token';
const AUTH_PASSWORD = 'diary123'; // Use env var in production

export const mobileAuthService = {
  // Authenticate user with password
  login: async (password: string): Promise<boolean> => {
    if (password === AUTH_PASSWORD) {
      const token = btoa(`token_${Date.now()}`);
      try {
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
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return !!token;
    } catch (error) {
      console.error('Failed to check auth status:', error);
      return false;
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  },

  // Get auth token for API requests
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  },
};
