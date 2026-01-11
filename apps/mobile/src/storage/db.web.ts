// Web fallback storage: use localStorage to avoid bundling expo-sqlite wasm.

const STORAGE_KEY = 'MOOD_ENTRIES_SQLITE_FALLBACK_V1';

export interface DbEntry {
  id: string;
  date: string;
  mood: string;
  notes?: string | null;
  synced: number; // 0/1
  remoteId?: string | null;
  updatedAt: number; // epoch ms
}

function load(): DbEntry[] {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as DbEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function save(entries: DbEntry[]) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export async function listEntries(): Promise<DbEntry[]> {
  const rows = load();
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  return rows;
}

export async function insertEntry(e: Omit<DbEntry, 'updatedAt'>) {
  const now = Date.now();
  const rows = load();
  const idx = rows.findIndex((r) => r.id === e.id);
  const row: DbEntry = { ...e, notes: e.notes ?? null, synced: e.synced ?? 0, remoteId: e.remoteId ?? null, updatedAt: now };
  if (idx >= 0) rows[idx] = row; else rows.unshift(row);
  save(rows);
}

export async function patchEntry(id: string, patch: Partial<DbEntry>) {
  const now = Date.now();
  const rows = load();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return;
  rows[idx] = {
    ...rows[idx],
    ...patch,
    notes: patch.notes !== undefined ? (patch.notes ?? null) : rows[idx].notes,
    remoteId: patch.remoteId !== undefined ? (patch.remoteId ?? null) : rows[idx].remoteId,
    updatedAt: now,
  } as DbEntry;
  save(rows);
}

export async function removeEntry(id: string) {
  const rows = load();
  const filtered = rows.filter((r) => r.id !== id);
  save(filtered);
}

export async function listPendingEntries(): Promise<DbEntry[]> {
  const rows = load();
  return rows.filter((r) => !r.synced);
}
