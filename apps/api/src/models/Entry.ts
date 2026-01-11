import mongoose from "mongoose";

const entrySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true, // User must write something
  },
  mood: {
    type: String,
    required: true, // e.g., "Happy", "Sad", "Neutral"
  },
  sentimentScore: {
    type: Number, // e.g., 0.8 (Positive) or -0.5 (Negative)
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the date
  },
});

export const Entry = mongoose.model("Entry", entrySchema);
