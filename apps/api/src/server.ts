import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow frontend to access this
app.use(express.json()); // Parse JSON bodies

// Health Check Route
app.get("/", (req, res) => {
  res.json({ message: "Mood Diary API is running! 🚀" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});
