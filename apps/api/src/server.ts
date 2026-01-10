import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "./config/db";
import { Entry } from "./models/Entry";
import { User } from "./models/User";
import { analyzeEmotion } from "./services/emotionService";
import { protect, AuthRequest } from "./middleware/auth";

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_change_me";

app.use(cors());
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
  res.json({ message: "Mood Diary API is running! 🚀" });
});

// ==========================
// AUTH ROUTES
// ==========================

// 1. Register User
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: "Email already exists" });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = await User.create({
      email,
      password: hashedPassword,
    });

    // Generate Token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "30d" });

    res.status(201).json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// 2. Login User
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find User
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    // Generate Token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "30d" });

    res.status(200).json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// ==========================
// DIARY ROUTES (PROTECTED)
// ==========================

// 3. Get My Entries
// We use the 'protect' middleware here to ensure only logged-in users can access
app.get("/entries", protect, async (req: AuthRequest, res) => {
  try {
    // Only return entries that match the logged-in user's ID
    const entries = await Entry.find({ userId: req.user }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

// 4. Create Entry
app.post("/entries", protect, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: "Content is required" });
      return;
    }

    // Analyze mood
    const { mood, score } = analyzeEmotion(content);

    // Save with the user's ID
    const newEntry = await Entry.create({
      userId: req.user, // Got from the token
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

app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});
