import express from "express";
import cors from "cors";
import { initStorage } from "./config/db";
import { Entry } from "./models/Entry";
import { analyzeEmotion } from "./services/emotionService";

// Initialize local file storage
initStorage();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
  res.json({ message: "Mood Diary API is running! 🚀" });
});

// DIARY ROUTES (Offline - No authentication needed)

// Get all entries
app.get("/entries", async (req, res) => {
  try {
    const entries = await Entry.find();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

// Create new entry
app.post("/entries", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: "Content is required" });
      return;
    }

    // Analyze mood
    const { mood, score } = analyzeEmotion(content);

    // Save entry
    const newEntry = await Entry.create({
      content,
      mood,
      sentimentScore: score,
    });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Error saving entry:", error);
    res.status(500).json({ error: "Failed to save entry" });
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
    res.status(500).json({ error: "Failed to fetch entry" });
  }
});

// Update entry
app.patch("/entries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: "Content is required" });
      return;
    }

    // Re-analyze mood for updated content
    const { mood, score } = analyzeEmotion(content);

    const updated = await Entry.findByIdAndUpdate(
      id,
      { content, mood, sentimentScore: score },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating entry:", error);
    res.status(500).json({ error: "Failed to update entry" });
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
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});
