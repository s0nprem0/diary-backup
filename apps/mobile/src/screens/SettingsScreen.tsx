import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Switch, Text, Button, useTheme, Card, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReminderTime, isReminderEnabled, setDailyReminder, disableReminders, formatReminderTime, requestNotificationPermissions } from '../services/reminders';
import { useAuth } from '../context/AuthContext';
import { getEntries } from '../services/entriesService';

const THEME_KEY = 'APP_THEME_DARK';

export default function SettingsScreen({ setIsDark, isDark: propIsDark }: { setIsDark: (v: boolean) => void; isDark?: boolean }) {
  const { colors } = useTheme();
  const { logout } = useAuth();
  const [isDark, setLocalDark] = useState<boolean>(propIsDark ?? false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState<{ hour: number; minute: number } | null>(null);

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

  useEffect(() => {
    (async () => {
      const enabled = await isReminderEnabled();
      const time = await getReminderTime();
      setReminderEnabled(enabled);
      setReminderTime(time);
    })();
  }, []);

  const toggle = async () => {
    const next = !isDark;
    setLocalDark(next);
    await AsyncStorage.setItem(THEME_KEY, next ? '1' : '0');
    setIsDark(next);
  };

  const handleSetReminder = () => {
    Alert.alert('Set Daily Reminder', 'What time would you like to be reminded to journal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: '6:00 AM', onPress: () => setReminderAndRefresh(6, 0) },
      { text: '9:00 AM', onPress: () => setReminderAndRefresh(9, 0) },
      { text: '12:00 PM', onPress: () => setReminderAndRefresh(12, 0) },
      { text: '3:00 PM', onPress: () => setReminderAndRefresh(15, 0) },
      { text: '6:00 PM', onPress: () => setReminderAndRefresh(18, 0) },
      { text: '9:00 PM', onPress: () => setReminderAndRefresh(21, 0) },
    ]);
  };

  const setReminderAndRefresh = async (hour: number, minute: number) => {
    const success = await setDailyReminder(hour, minute);
    if (success) {
      setReminderTime({ hour, minute });
      setReminderEnabled(true);
      Alert.alert('✅ Reminder Set', `You'll receive a daily notification at ${formatReminderTime(hour, minute)}`);
    } else {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive reminders.',
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Open Settings', onPress: () => requestNotificationPermissions() }
        ]
      );
    }
  };

  const handleDisableReminder = async () => {
    await disableReminders();
    setReminderEnabled(false);
    setReminderTime(null);
  };

  const handleExportData = async () => {
    try {
      const entries = await getEntries();

      if (entries.length === 0) {
        Alert.alert('No Data', 'You have no entries to export.');
        return;
      }

      // Create JSON export
      const exportData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
        totalEntries: entries.length,
        entries: entries.map(entry => ({
          date: entry.date,
          mood: entry.mood,
          notes: entry.notes,
        })),
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      // Share the data
      await Share.share({
        message: jsonString,
        title: 'Mood Diary Export',
      });
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Could not export your data. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text variant="headlineSmall" style={{ marginBottom: 20, color: colors.onSurface }}>
          Settings
        </Text>

      {/* Theme Section */}
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="titleMedium" style={{ color: colors.onSurface }}>
              Dark Theme
            </Text>
            <Switch value={isDark} onValueChange={toggle} />
          </View>
        </Card.Content>
      </Card>

      {/* Reminders Section */}
      <Text variant="labelLarge" style={{ marginTop: 20, marginBottom: 8, color: colors.onSurfaceVariant }}>
        Notifications
      </Text>
      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text variant="titleMedium" style={{ color: colors.onSurface }}>
              Daily Reminder
            </Text>
            <Switch value={reminderEnabled} onValueChange={(value) => {
              if (value) {
                handleSetReminder();
              } else {
                handleDisableReminder();
              }
            }} />
          </View>
          {reminderEnabled && reminderTime && (
            <>
              <Divider style={{ marginVertical: 8 }} />
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginBottom: 8 }}>
                Reminder set for {formatReminderTime(reminderTime.hour, reminderTime.minute)}
              </Text>
              <Button
                mode="outlined"
                onPress={handleSetReminder}
                compact
              >
                Change time
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Info Section */}
      <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.outlineVariant }}>
        <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
          App Info
        </Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          Version 1.0.0
        </Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: 12, lineHeight: 20 }}>
          Mood Diary helps you track your emotional well-being over time. All entries are stored locally on your device.
        </Text>
      </View>

      {/* Data Management Section */}
      <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.outlineVariant }}>
        <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant, marginBottom: 12 }}>
          Data Management
        </Text>
        <Card style={{ marginBottom: 12 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8, color: colors.onSurface }}>
              Export Your Data
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginBottom: 12 }}>
              Download all your diary entries as JSON format for backup or analysis.
            </Text>
            <Button
              mode="outlined"
              onPress={handleExportData}
              icon="download"
            >
              Export Data
            </Button>
          </Card.Content>
        </Card>
      </View>

        {/* Security Section */}
        <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.outlineVariant }}>
          <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant, marginBottom: 12 }}>
            Security
          </Text>
          <Button
            mode="outlined"
            onPress={() => {
              Alert.alert('Logout', 'Are you sure you want to logout? You will need to enter your password again.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Logout',
                  onPress: async () => {
                    await logout();
                  },
                  style: 'destructive',
                },
              ]);
            }}
            icon="logout"
            textColor={colors.error}
          >
            Logout
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
