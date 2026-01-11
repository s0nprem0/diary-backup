import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Switch, Text, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'APP_THEME_DARK';

export default function SettingsScreen({ setIsDark, isDark: propIsDark }: { setIsDark: (v: boolean) => void; isDark?: boolean }) {
  const [isDark, setLocalDark] = useState<boolean>(propIsDark ?? false);

  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem(THEME_KEY);
      if (v !== null) {
        setLocalDark(v === '1');
      } else if (typeof propIsDark === 'boolean') {
        setLocalDark(propIsDark);
      }
    })();
  }, [propIsDark]);

  const toggle = async () => {
    const next = !isDark;
    setLocalDark(next);
    await AsyncStorage.setItem(THEME_KEY, next ? '1' : '0');
    setIsDark(next);
  };

  return (
    <View style={{ padding: 16 }}>
      <Text variant="headlineSmall">Settings</Text>
      <View style={{ marginTop: 12 }}>
        <Text>Dark Theme</Text>
        <Switch value={isDark} onValueChange={toggle} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Button mode="outlined">Reminders (coming)</Button>
      </View>
    </View>
  );
}
