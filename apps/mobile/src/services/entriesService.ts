import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface Entry {
  id: string;
  date: string; // ISO
  mood: string;
  notes?: string;
  // Local-only metadata
  synced?: boolean; // whether this entry has been synced to the server
  remoteId?: string; // optional server id
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

export const addEntry = async (entry: Omit<Entry, 'id' | 'synced' | 'remoteId'>, synced = false, remoteId?: string) => {
  const entries = await getEntries();
  const newEntry: Entry = { ...entry, id: Date.now().toString(), synced, remoteId };
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

// Return entries that are not yet synced to the server
export const getPendingEntries = async (): Promise<Entry[]> => {
  const entries = await getEntries();
  return entries.filter((e) => !e.synced);
};

// Try to sync pending entries to the given API endpoint. The caller should provide the
// POST function (for example, a fetch wrapper that knows the server shape).
export const syncPendingEntries = async (postFn: (entry: Entry) => Promise<{ ok: boolean; data?: any }>) => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { synced: 0 };

  const entries = await getEntries();
  let syncedCount = 0;

  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e.synced) continue;
    try {
      const res = await postFn(e);
      if (res.ok) {
        // mark as synced and (optionally) store remote id
        entries[i] = { ...e, synced: true, remoteId: res.data?.id || res.data?._id || e.remoteId };
        syncedCount++;
      }
    } catch (err) {
      // ignore and continue with next
    }
  }

  if (syncedCount > 0) await saveEntries(entries);
  return { synced: syncedCount };
};
