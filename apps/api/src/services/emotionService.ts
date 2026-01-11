import Sentiment from "sentiment";

const sentiment = new Sentiment();

interface EmotionResult {
  score: number;
  mood: string;
}

// Mood mapping must match mobile app MOOD_OPTIONS
const MOOD_MAP = ['Happy', 'Sad', 'Neutral', 'Anxious', 'Excited', 'Tired'];

export const analyzeEmotion = (text: string): EmotionResult => {
  const result = sentiment.analyze(text);
  const score = result.score;

  // Rule-based mood detection based on sentiment score
  let mood = "Neutral";
  if (score > 2) mood = "Happy";
  else if (score > 0) mood = "Excited";
  else if (score < -2) mood = "Sad";
  else if (score < -1) mood = "Anxious";

  // Ensure mood is in valid list
  if (!MOOD_MAP.includes(mood)) {
    mood = "Neutral";
  }

  return { score, mood };
};
