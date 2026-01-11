import NetInfo from '@react-native-community/netinfo';
import { listEntries, insertEntry, patchEntry, removeEntry, listPendingEntries } from '../storage/db';

export interface Entry {
  id: string;
  date: string; // ISO
  mood: string;
  notes?: string;
  // Local-only metadata
  synced?: boolean; // whether this entry has been synced to the server
  remoteId?: string; // optional server id
}

// Generate simple unique ids without external deps
const genId = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

export const getEntries = async (): Promise<Entry[]> => {
  const rows = await listEntries();
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    mood: r.mood,
    notes: r.notes ?? undefined,
    synced: !!r.synced,
    remoteId: r.remoteId ?? undefined,
  }));
};

// Deprecated: persisted via SQLite now
export const saveEntries = async (_entries: Entry[]) => {};

export const addEntry = async (entry: Omit<Entry, 'id' | 'synced' | 'remoteId'>, synced = false, remoteId?: string) => {
  const newEntry: Entry = { ...entry, id: genId(), synced, remoteId };
  await insertEntry({
    id: newEntry.id,
    date: newEntry.date,
    mood: newEntry.mood,
    notes: newEntry.notes ?? null,
    synced: newEntry.synced ? 1 : 0,
    remoteId: newEntry.remoteId ?? null,
  });
  return newEntry;
};

export const updateEntry = async (id: string, patch: Partial<Entry>) => {
  await patchEntry(id, {
    date: patch.date,
    mood: patch.mood,
    notes: patch.notes,
    synced: patch.synced === undefined ? undefined : patch.synced ? 1 : 0,
    remoteId: patch.remoteId,
  });
  const entries = await getEntries();
  return entries.find((e) => e.id === id) ?? null;
};

export const deleteEntry = async (id: string) => {
  await removeEntry(id);
};

// Return entries that are not yet synced to the server
export const getPendingEntries = async (): Promise<Entry[]> => {
  const rows = await listPendingEntries();
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    mood: r.mood,
    notes: r.notes ?? undefined,
    synced: !!r.synced,
    remoteId: r.remoteId ?? undefined,
  }));
};

// Try to sync pending entries to the given API endpoint. The caller should provide the
// POST function (for example, a fetch wrapper that knows the server shape).
export const syncPendingEntries = async (postFn: (entry: Entry) => Promise<{ ok: boolean; data?: any }>) => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { synced: 0 };

  const pending = await getPendingEntries();
  let syncedCount = 0;

  for (let i = pending.length - 1; i >= 0; i--) {
    const e = pending[i];
    try {
      const res = await postFn(e);
      if (res.ok) {
        await updateEntry(e.id, { synced: true, remoteId: res.data?.id || res.data?._id || e.remoteId });
        syncedCount++;
      }
    } catch (err) {
      // ignore and continue with next
    }
  }

  return { synced: syncedCount };
};
