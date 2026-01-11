import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_KEY = 'APP_REMINDER_TIME';
const REMINDER_ENABLED_KEY = 'APP_REMINDER_ENABLED';

// Request notification permissions (placeholder)
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    console.log('Note: Push notifications can be enabled with expo-notifications setup');
    return true;
  } catch (error) {
    console.error('Notification permission request failed:', error);
    return false;
  }
};

// Set daily reminder preference
export const setDailyReminder = async (hour: number, minute: number = 0): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(REMINDER_KEY, `${hour}:${String(minute).padStart(2, '0')}`);
    await AsyncStorage.setItem(REMINDER_ENABLED_KEY, '1');
    console.log(`✅ Reminder set for ${hour}:${String(minute).padStart(2, '0')}`);
    return true;
  } catch (e) {
    console.error('Failed to set reminder:', e);
    return false;
  }
};

// Disable reminders
export const disableReminders = async () => {
  try {
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
