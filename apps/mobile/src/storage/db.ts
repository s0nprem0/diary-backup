import { SQLiteService, StoredEntry } from '../services/sqliteService';

// Re-export from SQLiteService for backward compatibility
export async function getDb() {
  return SQLiteService.getDb();
}

export type DbEntry = StoredEntry;

export async function listEntries(): Promise<DbEntry[]> {
  return SQLiteService.getAllEntries();
}

export async function insertEntry(e: Omit<DbEntry, 'createdAt'>) {
  await SQLiteService.insertEntry({
    ...e,
    createdAt: Date.now(),
  });
}

export async function patchEntry(id: string, patch: Partial<DbEntry>) {
  await SQLiteService.updateEntry(id, patch);
}

export async function removeEntry(id: string) {
  await SQLiteService.deleteEntry(id);
}
