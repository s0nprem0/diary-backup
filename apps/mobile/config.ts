import { Platform } from 'react-native';

// ---------------------------------------------------------
// 🔧 CONFIGURATION
// ---------------------------------------------------------
// Android Emulator uses 10.0.2.2 to access localhost
// iOS Simulator uses localhost
// Physical Device? Use your PC's LAN IP (e.g., http://192.168.1.50:3001)

const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3001'
  : 'http://localhost:3001';

export const AUTH_API = `${BASE_URL}/auth`;
export const ENTRIES_API = `${BASE_URL}/entries`;
