import { readEntries, writeEntries, generateId, StoredEntry } from '../config/db';

export interface EntryInput {
  content: string;
  mood: string;
  sentimentScore: number;
}

export class Entry {
  // Find all entries, sorted by creation date (newest first)
  static async find(): Promise<StoredEntry[]> {
    const entries = readEntries();
    return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Find entry by ID
  static async findById(id: string): Promise<StoredEntry | null> {
    const entries = readEntries();
    return entries.find(entry => entry._id === id) || null;
  }

  // Create new entry
  static async create(data: EntryInput): Promise<StoredEntry> {
    const entries = readEntries();
    const now = new Date().toISOString();

    const newEntry: StoredEntry = {
      _id: generateId(),
      content: data.content,
      mood: data.mood,
      sentimentScore: data.sentimentScore,
      createdAt: now,
      updatedAt: now,
    };

    entries.push(newEntry);
    writeEntries(entries);

    return newEntry;
  }

  // Update entry by ID
  static async findByIdAndUpdate(
    id: string,
    update: Partial<EntryInput>,
    options?: { new?: boolean }
  ): Promise<StoredEntry | null> {
    const entries = readEntries();
    const index = entries.findIndex(entry => entry._id === id);

    if (index === -1) return null;

    entries[index] = {
      ...entries[index],
      ...update,
      updatedAt: new Date().toISOString(),
    };

    writeEntries(entries);
    return options?.new ? entries[index] : null;
  }

  // Delete entry by ID
  static async findByIdAndDelete(id: string): Promise<StoredEntry | null> {
    const entries = readEntries();
    const index = entries.findIndex(entry => entry._id === id);

    if (index === -1) return null;

    const deleted = entries[index];
    entries.splice(index, 1);
    writeEntries(entries);

    return deleted;
  }
}
