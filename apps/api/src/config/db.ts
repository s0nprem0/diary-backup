import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ENTRIES_FILE = path.join(DATA_DIR, 'entries.json');

export interface StoredEntry {
  _id: string;
  content: string;
  mood: string;
  sentimentScore: number;
  createdAt: string;
  updatedAt: string;
}

// Initialize local file storage
export const initStorage = () => {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Create entries file if it doesn't exist
    if (!fs.existsSync(ENTRIES_FILE)) {
      fs.writeFileSync(ENTRIES_FILE, JSON.stringify([]));
    }

    console.log('✅ Local storage initialized');
  } catch (error) {
    console.error(`❌ Error initializing storage: ${(error as Error).message}`);
    process.exit(1);
  }
};

// Read all entries from file
export const readEntries = (): StoredEntry[] => {
  try {
    const data = fs.readFileSync(ENTRIES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading entries:', error);
    return [];
  }
};

// Write entries to file
export const writeEntries = (entries: StoredEntry[]): void => {
  try {
    fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2));
  } catch (error) {
    console.error('Error writing entries:', error);
    throw error;
  }
};

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
