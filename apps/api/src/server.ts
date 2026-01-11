import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// auth removed: bcrypt/jwt not needed
import { connectDB } from "./config/db";
import { Entry } from "./models/Entry";
import { analyzeEmotion } from "./services/emotionService";
// auth middleware removed

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
  res.json({ message: "Mood Diary API is running! 🚀" });
});

// DIARY ROUTES (PUBLIC)

// 3. Get Entries (public)
app.get("/entries", async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

// 4. Create Entry (public)
app.post("/entries", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: "Content is required" });
      return;
    }

    // Analyze mood
    const { mood, score } = analyzeEmotion(content);

    // Save entry (no user association)
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

// 5. Update Entry content (public)
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

app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});
