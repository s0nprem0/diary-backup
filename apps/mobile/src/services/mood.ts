// Dictionary-based offline mood inference with context awareness (negation/intensifiers).
// Analyzes local context to "measure" mood intensity rather than just counting keywords.

type MoodType = 'Happy' | 'Sad' | 'Anxious' | 'Excited' | 'Tired' | 'Neutral';

const MOOD_DICTIONARY: Record<MoodType, string[]> = {
  Happy: ['happy', 'joy', 'great', 'good', 'love', 'grateful', 'content', 'calm', 'peace', 'smile', 'ok', 'fine', 'awesome', 'wonderful', 'lucky'],
  Sad: ['sad', 'down', 'blue', 'unhappy', 'depressed', 'cry', 'lonely', 'miserable', 'bad', 'hurt', 'pain', 'grief', 'miss'],
  Anxious: ['anxious', 'worried', 'nervous', 'panic', 'stressed', 'stress', 'overwhelmed', 'fear', 'scared', 'tense', 'uneasy'],
  Excited: ['excited', 'thrilled', 'eager', 'pumped', 'stoked', 'passionate', 'energetic', 'motivated', 'inspired'],
  Tired: ['tired', 'sleepy', 'exhausted', 'fatigued', 'drained', 'lazy', 'burnout', 'weak'],
  Neutral: [],
};

// Words that reverse the meaning of the following keyword
const NEGATIONS = new Set(['not', 'no', 'never', "don't", "cant", "cannot", "couldn't", "won't", "shouldn't", "wouldn't", "didn't"]);

// Words that boost the score of the following keyword
const INTENSIFIERS = new Set(['very', 'really', 'so', 'extremely', 'totally', 'super', 'absolutely', 'incredibly', 'highly']);

// Mapping for "not [Mood]" -> [OppositeMood]
// This helps "measure" the real sentiment. e.g. "not happy" -> contributes to Sadness.
const NEGATION_MAP: Partial<Record<MoodType, MoodType>> = {
  Happy: 'Sad',
  Sad: 'Happy',
  Excited: 'Tired', // debatable, but "not excited" often implies boredom/tiredness or neutral
  Tired: 'Excited', // "not tired" -> energetic
  Anxious: 'Happy', // "not anxious" -> calm/happy
};

export function inferMood(text: string): { mood: string; score: number } {
  if (!text || !text.trim()) return { mood: 'Neutral', score: 0 };

  const tokens = text.toLowerCase().match(/\b\w+\b/g) || [];
  const scores: Record<string, number> = {
    Happy: 0, Sad: 0, Anxious: 0, Excited: 0, Tired: 0, Neutral: 0
  };

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];

    // Check which mood this word belongs to
    let foundMood: MoodType | null = null;
    for (const [mood, keywords] of Object.entries(MOOD_DICTIONARY)) {
      if (keywords.includes(word)) {
        foundMood = mood as MoodType;
        break;
      }
    }

    if (foundMood) {
      // Look back for context (window of 2 words)
      const prev1 = tokens[i - 1];
      const prev2 = tokens[i - 2];

      let score = 1;
      let isNegated = false;

      // Check immediate predecessor
      if (prev1) {
        if (NEGATIONS.has(prev1)) isNegated = true;
        else if (INTENSIFIERS.has(prev1)) score += 1;
      }

      // Check word before that (e.g. "really not happy" or "did not feel good")
      if (prev2 && !isNegated) {
        if (NEGATIONS.has(prev2)) isNegated = true;
        // logic: "not very happy" -> negated intensifier handles naturally?
        // simplistic approach: if negation is found in window, flip logic.
      }

      if (isNegated) {
        // If negated, give points to the opposite mood instead
        const opposite = NEGATION_MAP[foundMood];
        if (opposite) {
          scores[opposite] += 1; // "not happy" = 1 point for Sad
        }
        // If no direct opposite defined, we just ignore this word (score 0 for original mood)
      } else {
        scores[foundMood] += score;
      }
    }
  }

  // Find winner
  let bestMood = 'Neutral';
  let highestScore = 0;

  Object.entries(scores).forEach(([mood, score]) => {
    // Tie-breaker: prefer non-Neutral if scores are equal
    if (score > highestScore) {
      highestScore = score;
      bestMood = mood;
    }
  });

  return { mood: bestMood, score: highestScore };
}
