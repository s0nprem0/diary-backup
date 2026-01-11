import express from "express";
import cors from "cors";
import { initStorage } from "./config/db";
import { Entry } from "./models/Entry";
import { analyzeEmotion } from "./services/emotionService";
import { authMiddleware } from "./middleware/auth";

// Initialize local file storage
initStorage();

const app = express();
const PORT = 3001;

// Allowed mood options (must match mobile app)
const VALID_MOODS = ['Happy', 'Sad', 'Neutral', 'Anxious', 'Excited', 'Tired'];

app.use(cors());
app.use(express.json());

// Validation helper
const validateEntry = (content?: string, mood?: string): { valid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Content is required and cannot be empty' };
  }
  if (content.trim().length > 5000) {
    return { valid: false, error: 'Content exceeds maximum length of 5000 characters' };
  }
  if (mood && !VALID_MOODS.includes(mood)) {
    return { valid: false, error: `Invalid mood. Must be one of: ${VALID_MOODS.join(', ')}` };
  }
  return { valid: true };
};

// Health Check
app.get("/", (req, res) => {
  res.json({ message: "Mood Diary API is running! 🚀" });
});

// DIARY ROUTES

// Get all entries
app.get("/entries", async (req, res) => {
  try {
    const entries = await Entry.find();
    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: "Failed to fetch entries", details: (error as Error).message });
  }
});

// Create new entry
app.post("/entries", async (req, res) => {
  try {
    const { content, notes, mood, date } = req.body;
    const entryContent = content || notes;

    const validation = validateEntry(entryContent, mood);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    // Use provided mood or analyze if not provided
    // Use provided mood or analyze if not provided
    let finalMood = mood;
    let sentimentScore = 0;

    if (!mood) {
      // Only analyze if mood not provided (saves 50-100ms)
      const analyzed = analyzeEmotion(entryContent);
      finalMood = analyzed.mood;
      sentimentScore = analyzed.score;
    }

    // Create entry with user data
    const newEntry = await Entry.create({
      content: entryContent,
      mood: finalMood,
      sentimentScore,
      date,
    });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Error saving entry:", error);
    res.status(500).json({ error: "Failed to save entry", details: (error as Error).message });
  }
});

// Get single entry by ID
app.get("/entries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Entry.findById(id);

    if (!entry) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    res.json(entry);
  } catch (error) {
    console.error("Error fetching entry:", error);
    res.status(500).json({ error: "Failed to fetch entry", details: (error as Error).message });
  }
});

// Update entry
app.patch("/entries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { content, notes, mood } = req.body;
    const entryContent = content || notes;

    const validation = validateEntry(entryContent, mood);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    // Use provided mood or re-analyze
    let finalMood = mood;
    let sentimentScore: number | undefined = undefined;

    if (!mood) {
      const analyzed = analyzeEmotion(entryContent);
      finalMood = analyzed.mood;
      sentimentScore = analyzed.score;
    }

    const updated = await Entry.findByIdAndUpdate(
      id,
      { content: entryContent, mood: finalMood, sentimentScore },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating entry:", error);
    res.status(500).json({ error: "Failed to update entry", details: (error as Error).message });
  }
});

// Delete entry
app.delete("/entries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Entry.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    res.json({ message: "Entry deleted successfully", entry: deleted });
  } catch (error) {
    console.error("Error deleting entry:", error);
    res.status(500).json({ error: "Failed to delete entry", details: (error as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});
