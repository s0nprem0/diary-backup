// Offline authentication using localStorage
// Simple password-based auth for local diary privacy

const AUTH_TOKEN_KEY = "mood_diary_auth_token";
const AUTH_PASSWORD = process.env.NEXT_PUBLIC_DIARY_PASSWORD || "diary123";

export const authService = {
  // Authenticate user with password
  login: (password: string): boolean => {
    if (password === AUTH_PASSWORD) {
      const token = btoa(`token_${Date.now()}`); // Simple token
      if (typeof window !== "undefined") {
      }
      return true;
    }
    return false;
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
