import { MD3LightTheme as DefaultTheme, MD3DarkTheme } from 'react-native-paper';
import { Platform } from 'react-native';

// Custom Material You (MD3) theme
export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3367D6',
    secondary: '#6AB7FF',
    background: '#FFFDF8',
    surface: '#FFFFFF',
    error: '#B00020',
    onPrimary: '#FFFFFF',
    onSurface: '#1f2937',
    // added commonly-used MD tokens to avoid undefined lookups across the app
    surfaceVariant: '#F3F4F6',
    onSurfaceVariant: '#6B7280',
    outline: '#E5E7EB',
    outlineVariant: '#E5E7EB',
  },
  // subtle typography adjustments
  fonts: DefaultTheme.fonts,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#8EA8FF',
    secondary: '#5AA9FF',
    background: '#0F172A',
    surfaceVariant: '#0B1220',
    onSurfaceVariant: '#9CA3AF',
  },
};

// small helper for platform spacing if needed
export const spacing = (n: number) => (Platform.OS === 'web' ? n : n * 1);
