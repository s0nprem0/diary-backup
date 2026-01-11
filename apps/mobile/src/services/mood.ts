// Lightweight client-side mood inference for offline UX.
// Not as accurate as server analysis, but avoids "Unknown".

const positiveWords = [
  'happy', 'joy', 'great', 'good', 'love', 'excited', 'awesome', 'fantastic', 'wonderful', 'smile', 'grateful', 'calm', 'peace'
];
const negativeWords = [
  'sad', 'bad', 'terrible', 'hate', 'angry', 'upset', 'anxious', 'depressed', 'awful', 'worried', 'tired', 'stress', 'cry'
];

export function inferMood(text: string): { mood: string; score: number } {
  const content = (text || '').toLowerCase();
  let score = 0;
  for (const w of positiveWords) if (content.includes(w)) score += 1;
  for (const w of negativeWords) if (content.includes(w)) score -= 1;
  const mood = score > 0 ? 'Happy' : score < 0 ? 'Sad' : 'Neutral';
  return { mood, score };
}
