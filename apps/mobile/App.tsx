import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider as PaperProvider, Button, Text } from 'react-native-paper';

import AddEntryScreen from './src/screens/AddEntryScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import BottomTabs from './src/navigation/BottomTabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { lightTheme, darkTheme } from './src/theme';
import { SQLiteService } from './src/services/sqliteService';

export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  Main: undefined;
  Home: undefined;
  AddEntry: undefined;
  History: undefined;
  Insights: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const THEME_KEY = 'APP_THEME_DARK';
const ONBOARDING_KEY = 'APP_ONBOARDED';

function AppNavigator() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Initialize SQLite first - this is critical
        try {
          await SQLiteService.init();
        } catch (dbError) {
          console.error('Critical: Failed to initialize database:', dbError);
          setInitError('Failed to initialize database. Please restart the app.');
          setIsLoading(false);
          return; // Stop further initialization if DB fails
        }

        const v = await AsyncStorage.getItem(THEME_KEY);
        setIsDark(v === '1');
        const onboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasOnboarded(onboarded === '1');
      } catch (e) {
        console.error('Error initializing app:', e);
        setInitError('Failed to initialize app. Please restart.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
    })();
  }, []);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    setHasOnboarded(true);
  };

  // Show error UI if initialization failed
  if (initError) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <Text variant="headlineSmall" style={{ marginBottom: 16, textAlign: 'center' }}>
            ⚠️ Error
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 20 }}>
            {initError}
          </Text>
          <Button
            mode="contained"
            onPress={() => {
              // Force app restart
              setInitError(null);
              setIsLoading(true);
            }}
          >
            Retry
          </Button>
        </View>
      </SafeAreaProvider>
    );
  }

  if (isLoading || authLoading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={isDark ? (darkTheme as any) : (lightTheme as any)}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
              <Stack.Screen name="Login" component={LoginScreen} />
            ) : !hasOnboarded ? (
              <Stack.Screen name="Onboarding">
                {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
              </Stack.Screen>
            ) : (
              <>
                <Stack.Screen name="Main">
                  {() => <BottomTabs isDark={isDark} setIsDark={setIsDark} />}
                </Stack.Screen>
                <Stack.Screen name="AddEntry" component={AddEntryScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
