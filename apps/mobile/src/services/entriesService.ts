import { listEntries, insertEntry, patchEntry, removeEntry } from '../storage/db';

export interface Entry {
  id: string;
  date: string; // ISO
  mood: string;
  notes?: string;
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
  }));
};

// Deprecated: persisted via SQLite now
export const saveEntries = async (_entries: Entry[]) => {};

export const addEntry = async (entry: Omit<Entry, 'id'>) => {
  const newEntry: Entry = { ...entry, id: genId() };
  await insertEntry({
    id: newEntry.id,
    date: newEntry.date,
    mood: newEntry.mood,
    notes: newEntry.notes ?? undefined,
  });
  return newEntry;
};

export const updateEntry = async (id: string, patch: Partial<Entry>) => {
  await patchEntry(id, {
    date: patch.date,
    mood: patch.mood,
    notes: patch.notes,
  });
  const entries = await getEntries();
  return entries.find((e) => e.id === id) ?? null;
};

export const deleteEntry = async (id: string) => {
  await removeEntry(id);
};

