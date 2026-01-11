import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Entry {
  id: string;
  date: string; // ISO
  mood: string;
  intensity: number; // 0-100
  notes?: string;
}

const STORAGE_KEY = 'MOOD_ENTRIES_V1';

export const getEntries = async (): Promise<Entry[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Entry[];
  } catch (e) {
    return [];
  }
};

export const saveEntries = async (entries: Entry[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const addEntry = async (entry: Omit<Entry, 'id'>) => {
  const entries = await getEntries();
  const newEntry: Entry = { ...entry, id: Date.now().toString() };
  entries.unshift(newEntry);
  await saveEntries(entries);
  return newEntry;
};

export const updateEntry = async (id: string, patch: Partial<Entry>) => {
  const entries = await getEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], ...patch };
  await saveEntries(entries);
  return entries[idx];
};

export const deleteEntry = async (id: string) => {
  let entries = await getEntries();
  entries = entries.filter((e) => e.id !== id);
  await saveEntries(entries);
};
