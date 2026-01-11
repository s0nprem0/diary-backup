import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_NAME = 'mood_diary.db';

export interface StoredEntry {
  id: string;
  date: string;
  mood: string;
  notes?: string;
  synced: number; // 0 or 1
  remoteId?: string;
  createdAt: number;
}

let db: SQLite.SQLiteDatabase | null = null;

export const SQLiteService = {
  async init() {
    try {
      db = await SQLite.openDatabaseAsync(DB_NAME);

      // Enable foreign keys
      await db.execAsync('PRAGMA foreign_keys = ON;');

      // Create entries table if it doesn't exist
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS entries (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          mood TEXT NOT NULL,
          notes TEXT,
          synced INTEGER NOT NULL DEFAULT 0,
          remoteId TEXT,
          createdAt INTEGER NOT NULL
        );
      `);

      console.log('✅ SQLite initialized');

      // Migrate from AsyncStorage if needed
      await this.migrateFromAsyncStorage();
    } catch (error) {
      console.error('❌ Error initializing SQLite:', error);
      throw error;
    }
  },

  async getDb() {
    if (!db) {
      await this.init();
    }
    return db!;
  },

  async migrateFromAsyncStorage() {
    try {
      const existingEntries = await db?.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM entries');

      if (existingEntries && existingEntries[0]?.count > 0) {
        console.log('✅ SQLite already has data, skipping migration');
        return;
      }

      // Check if AsyncStorage has entries
      const asyncKeys = await AsyncStorage.getAllKeys();
      const entryKeys = asyncKeys.filter(key => key.startsWith('entry_'));

      if (entryKeys.length === 0) {
        console.log('ℹ️ No AsyncStorage entries to migrate');
        return;
      }

      console.log(`📦 Migrating ${entryKeys.length} entries from AsyncStorage to SQLite...`);

      const values = await AsyncStorage.multiGet(entryKeys);

      for (const [key, value] of values) {
        if (value) {
          try {
            const entry = JSON.parse(value);
            await this.insertEntry({
              id: entry.id,
              date: entry.date,
              mood: entry.mood,
              notes: entry.notes,
              synced: entry.synced ? 1 : 0,
              remoteId: entry.remoteId,
              createdAt: entry.createdAt || Date.now(),
            });
          } catch (parseError) {
            console.warn(`Failed to migrate entry ${key}:`, parseError);
          }
        }
      }

      console.log('✅ Migration complete');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      // Don't throw - continue with empty SQLite
    }
  },

  async insertEntry(entry: StoredEntry) {
    const database = await this.getDb();
    await database.runAsync(
      `INSERT OR REPLACE INTO entries (id, date, mood, notes, synced, remoteId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [entry.id, entry.date, entry.mood, entry.notes ?? null, entry.synced ?? 0, entry.remoteId ?? null, entry.createdAt]
    );
  },

  async getEntry(id: string): Promise<StoredEntry | null> {
    const database = await this.getDb();
    const result = await database.getFirstAsync<StoredEntry>(
      'SELECT * FROM entries WHERE id = ?',
      [id]
    );
    return result || null;
  },

  async getAllEntries(): Promise<StoredEntry[]> {
    const database = await this.getDb();
    const entries = await database.getAllAsync<StoredEntry>(
      'SELECT * FROM entries ORDER BY date DESC'
    );
    return entries;
  },

  async getPendingEntries(): Promise<StoredEntry[]> {
    const database = await this.getDb();
    const entries = await database.getAllAsync<StoredEntry>(
      'SELECT * FROM entries WHERE synced = 0 ORDER BY createdAt DESC'
    );
    return entries;
  },

  async updateEntry(id: string, updates: Partial<StoredEntry>) {
    const database = await this.getDb();
    const sets: string[] = [];
    const params: any[] = [];

    if (updates.date !== undefined) {
      sets.push('date = ?');
      params.push(updates.date);
    }
    if (updates.mood !== undefined) {
      sets.push('mood = ?');
      params.push(updates.mood);
    }
    if (updates.notes !== undefined) {
      sets.push('notes = ?');
      params.push(updates.notes ?? null);
    }
    if (updates.synced !== undefined) {
      sets.push('synced = ?');
      params.push(updates.synced);
    }
    if (updates.remoteId !== undefined) {
      sets.push('remoteId = ?');
      params.push(updates.remoteId ?? null);
    }

    params.push(id);

    await database.runAsync(
      `UPDATE entries SET ${sets.join(', ')} WHERE id = ?`,
      params
    );
  },

  async deleteEntry(id: string) {
    const database = await this.getDb();
    await database.runAsync('DELETE FROM entries WHERE id = ?', [id]);
  },

  async clearAll() {
    const database = await this.getDb();
    await database.runAsync('DELETE FROM entries');
  },
};
