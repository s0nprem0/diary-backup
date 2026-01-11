import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('mood_diary.db');
  }
  const db = await dbPromise;
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.runAsync(
    `CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      mood TEXT NOT NULL,
      notes TEXT,
      updatedAt INTEGER NOT NULL
    );`
  );
  return db;
}

export interface DbEntry {
  id: string;
  date: string;
  mood: string;
  notes?: string | null;
  updatedAt: number; // epoch ms
}

export async function listEntries(): Promise<DbEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<DbEntry>('SELECT id, date, mood, notes, updatedAt FROM entries ORDER BY date DESC');
  return rows;
}

export async function insertEntry(e: Omit<DbEntry, 'updatedAt'>) {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    'INSERT OR REPLACE INTO entries (id, date, mood, notes, updatedAt) VALUES (?, ?, ?, ?, ?)',
    [e.id, e.date, e.mood, e.notes ?? null, now]
  );
}

export async function patchEntry(id: string, patch: Partial<DbEntry>) {
  const db = await getDb();
  const now = Date.now();
  const sets: string[] = [];
  const params: any[] = [];
  if (patch.date !== undefined) { sets.push('date = ?'); params.push(patch.date); }
  if (patch.mood !== undefined) { sets.push('mood = ?'); params.push(patch.mood); }
  if (patch.notes !== undefined) { sets.push('notes = ?'); params.push(patch.notes ?? null); }
  sets.push('updatedAt = ?'); params.push(now);
  params.push(id);
  await db.runAsync(`UPDATE entries SET ${sets.join(', ')} WHERE id = ?`, params);
}

export async function removeEntry(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
}
