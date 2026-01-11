// Offline authentication using localStorage
// Simple password-based auth for local diary privacy

const AUTH_TOKEN_KEY = "mood_diary_auth_token";
const PASSWORD_SET_KEY = "mood_diary_password_set";
const STORED_PASSWORD_KEY = "mood_diary_stored_password";

export const authService = {
  // Create password for first-time users
  signup: (password: string): boolean => {
    if (!password || password.trim().length < 6) {
      console.error('Password must be at least 6 characters');
      return false;
    }

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORED_PASSWORD_KEY, password);
        localStorage.setItem(PASSWORD_SET_KEY, "true");
      }
      // Automatically login after signup
      return authService.login(password);
    } catch (error) {
      console.error('Failed to create password:', error);
      return false;
    }
  },

  // Authenticate user with password
  login: (password: string): boolean => {
    if (typeof window === "undefined") return false;

    try {
      const storedPassword = localStorage.getItem(STORED_PASSWORD_KEY);

      if (password === storedPassword) {
        const token = btoa(`token_${Date.now()}`); // Simple token
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  // Check if password has been set up
  isPasswordSetup: (): boolean => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(PASSWORD_SET_KEY) === "true";
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },

  // Logout user
  logout: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  },

  // Get auth token for API requests
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
};
