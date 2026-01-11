import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Provider as PaperProvider } from 'react-native-paper';

import AddEntryScreen from './src/screens/AddEntryScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import BottomTabs from './src/navigation/BottomTabs';
import { lightTheme, darkTheme } from './src/theme';
import { syncPendingEntries } from './src/services/entriesService';
import { ENTRIES_API } from './config';

// helper to post a local entry to the server
const postEntryToServer = async (entry: any) => {
  try {
    const res = await fetch(`${ENTRIES_API}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: entry.notes || '', date: entry.date, mood: entry.mood }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (e) {
    return { ok: false };
  }
};

export type RootStackParamList = {
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

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(THEME_KEY);
        setIsDark(v === '1');
        const onboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasOnboarded(onboarded === '1');
      } catch (e) {
        // ignore
      }
      // attempt to sync any pending entries when the app starts
      try {
        await syncPendingEntries(postEntryToServer as any);
      } catch (e) {
        // ignore sync errors on startup
      }
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    // when connectivity returns, try to sync pending entries
    const sub = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncPendingEntries(postEntryToServer as any).catch(() => {
          /* ignore */
        });
      }
    });
    return () => sub();
  }, []);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    setHasOnboarded(true);
  };

  if (isLoading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={isDark ? (darkTheme as any) : (lightTheme as any)}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName={hasOnboarded ? 'Main' : 'Onboarding'} screenOptions={{ headerShown: false }}>
            {!hasOnboarded && (
              <Stack.Screen
                name="Onboarding"
              >
                {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
              </Stack.Screen>
            )}
            <Stack.Screen name="Main">
              {() => <BottomTabs isDark={isDark} setIsDark={setIsDark} />}
            </Stack.Screen>

            {/* keep AddEntry as a dedicated screen */}
            <Stack.Screen name="AddEntry" component={AddEntryScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
