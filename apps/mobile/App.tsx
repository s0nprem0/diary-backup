import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider as PaperProvider } from 'react-native-paper';

import HomeScreen from './src/screens/HomeScreen';
import AddEntryScreen from './src/screens/AddEntryScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { lightTheme, darkTheme } from './src/theme';

export type RootStackParamList = {
  Home: undefined;
  AddEntry: undefined;
  History: undefined;
  Insights: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const THEME_KEY = 'APP_THEME_DARK';

export default function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(THEME_KEY);
        setIsDark(v === '1');
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={isDark ? (darkTheme as any) : (lightTheme as any)}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="AddEntry" component={AddEntryScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Insights" component={InsightsScreen} />
            <Stack.Screen name="Settings">
              {() => <SettingsScreen isDark={isDark} setIsDark={setIsDark} />}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
