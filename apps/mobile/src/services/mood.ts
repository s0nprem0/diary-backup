// Dictionary-based offline mood inference to map journal text to our supported moods.
// Prefers clarity over heavy sentiment analysis to stay cheap on-device.

const MOOD_DICTIONARY: Record<string, string[]> = {
  Happy: ['happy', 'joy', 'great', 'good', 'love', 'grateful', 'content', 'calm', 'peace', 'smile', 'ok', 'fine'],
  Sad: ['sad', 'down', 'blue', 'unhappy', 'depressed', 'cry', 'lonely', 'miserable', 'bad'],
  Anxious: ['anxious', 'worried', 'nervous', 'panic', 'stressed', 'stress', 'overwhelmed', 'fear'],
  Excited: ['excited', 'thrilled', 'eager', 'pumped', 'stoked'],
  Tired: ['tired', 'sleepy', 'exhausted', 'fatigued', 'drained'],
  Neutral: [],
};

const escapeRegex = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const countOccurrences = (text: string, word: string) => {
  if (!word.trim()) return 0;
  const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'g');
  return (text.match(regex) || []).length;
};

export function inferMood(text: string): { mood: string; score: number } {
  const content = (text || '').toLowerCase();
  let bestMood: string = 'Neutral';
  let bestScore = 0;

  Object.entries(MOOD_DICTIONARY).forEach(([mood, keywords]) => {
    const score = keywords.reduce((sum, word) => sum + countOccurrences(content, word), 0);
    if (score > bestScore || (score === bestScore && bestMood === 'Neutral' && mood !== 'Neutral')) {
      bestMood = mood;
      bestScore = score;
    }
  });

  // If nothing matched, stay neutral
  return { mood: bestMood, score: bestScore };
}
