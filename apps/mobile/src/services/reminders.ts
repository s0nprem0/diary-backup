import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_KEY = 'APP_REMINDER_TIME';
const REMINDER_ENABLED_KEY = 'APP_REMINDER_ENABLED';
const NOTIFICATION_ID_KEY = 'APP_NOTIFICATION_ID';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // For Android, configure notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-reminder', {
        name: 'Daily Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B6B',
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to get notification permissions:', error);
    return false;
  }
};

// Cancel existing notification
const cancelExistingNotification = async () => {
  try {
    const notificationId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
    }
  } catch (error) {
    console.error('Failed to cancel existing notification:', error);
  }
};

// Set daily reminder preference with actual notification scheduling
export const setDailyReminder = async (hour: number, minute: number = 0) => {
  try {
    // Request permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Cannot set reminder: notification permissions not granted');
      return false;
    }

    // Cancel any existing notification
    await cancelExistingNotification();

    // Schedule new daily notification
    const trigger: Notifications.CalendarTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📝 Time to journal!',
        body: 'Take a moment to reflect on your day and track your mood.',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { screen: 'AddEntry' },
      },
      trigger,
    });

    // Save notification ID for future cancellation
    await AsyncStorage.setItem(NOTIFICATION_ID_KEY, notificationId);

    // Save preference
    await AsyncStorage.setItem(REMINDER_KEY, `${hour}:${String(minute).padStart(2, '0')}`);
    await AsyncStorage.setItem(REMINDER_ENABLED_KEY, '1');

    console.log(`✅ Reminder scheduled for ${hour}:${String(minute).padStart(2, '0')} daily (ID: ${notificationId})`);
    return true;
  } catch (e) {
    console.error('Failed to set reminder:', e);
    return false;
  }
};

// Disable reminders and cancel scheduled notifications
export const disableReminders = async () => {
  try {
    // Cancel scheduled notification
    await cancelExistingNotification();

    // Update preferences
    await AsyncStorage.setItem(REMINDER_ENABLED_KEY, '0');
    console.log('✅ Reminders disabled');
    return true;
  } catch (e) {
    console.error('Failed to disable reminders:', e);
    return false;
  }
};

// Get current reminder time
export const getReminderTime = async (): Promise<{ hour: number; minute: number } | null> => {
  try {
    const time = await AsyncStorage.getItem(REMINDER_KEY);
    const enabled = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);

    if (!time || enabled !== '1') return null;

    const [hour, minute] = time.split(':').map(Number);
    return { hour, minute };
  } catch (e) {
    return null;
  }
};

// Get enabled status
export const isReminderEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);
    return enabled === '1';
  } catch (e) {
    return false;
  }
};

// Format time for display
export const formatReminderTime = (hour: number, minute: number) => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${ampm}`;
};

