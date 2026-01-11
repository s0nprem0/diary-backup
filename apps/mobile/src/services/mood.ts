// Dictionary-based offline mood inference with context awareness (negation/intensifiers).
// Analyzes local context to "measure" mood intensity rather than just counting keywords.

type MoodType = 'Happy' | 'Sad' | 'Anxious' | 'Excited' | 'Tired' | 'Neutral';

export type MoodResult = {
  mood: string;
  score: number;
  scores: Record<MoodType, number>;
  confidence: number; // best score divided by total evidence
  tokensUsed: number;
};

// Expanded vocabulary (single words)
const MOOD_DICTIONARY: Record<MoodType, string[]> = {
  Happy: [
    'happy', 'joy', 'great', 'good', 'love', 'grateful', 'content', 'calm', 'peace', 'smile', 'ok', 'fine',
    'awesome', 'wonderful', 'lucky', 'glad', 'cheerful', 'bright', 'optimistic', 'satisfied', 'chill', 'relaxed',
    'joyful', 'sunny', 'upbeat', 'buoyant', 'grinning', 'delighted', 'thriving', 'playful'
  ],
  Sad: [
    'sad', 'down', 'blue', 'unhappy', 'depressed', 'cry', 'lonely', 'miserable', 'bad', 'hurt', 'pain', 'grief',
    'miss', 'gloomy', 'teary', 'hopeless', 'lost', 'empty', 'heartbroken', 'drained', 'low', 'melancholy', 'bummed'
  ],
  Anxious: [
    'anxious', 'worried', 'nervous', 'panic', 'stressed', 'stress', 'overwhelmed', 'fear', 'scared', 'tense',
    'uneasy', 'onedge', 'restless', 'jittery', 'afraid', 'dread', 'concerned', 'shaky', 'frazzled'
  ],
  Excited: [
    'excited', 'thrilled', 'eager', 'pumped', 'stoked', 'passionate', 'energetic', 'motivated', 'inspired', 'amped',
    'hyped', 'ecstatic', 'buzzing', 'fired', 'zest', 'giddy'
  ],
  Tired: [
    'tired', 'sleepy', 'exhausted', 'fatigued', 'drained', 'lazy', 'burnout', 'weak', 'worn', 'drowsy', 'groggy',
    'sluggish', 'spent', 'weary', 'done', 'wiped'
  ],
  Neutral: [],
};

// Common multiword phrases
const PHRASES: Array<{ phrase: string; mood: MoodType }> = [
  { phrase: 'over the moon', mood: 'Happy' },
  { phrase: 'on top of the world', mood: 'Happy' },
  { phrase: 'not a big deal', mood: 'Neutral' },
  { phrase: 'at peace', mood: 'Happy' },
  { phrase: 'burned out', mood: 'Tired' },
  { phrase: 'on edge', mood: 'Anxious' },
  { phrase: 'worked up', mood: 'Anxious' },
  { phrase: 'fed up', mood: 'Sad' },
  { phrase: 'worn out', mood: 'Tired' },
];

// Words that reverse the meaning of the nearby keyword
const NEGATIONS = new Set([
  'not', 'no', 'never', "don't", "cant", "cannot", "couldn't", "won't", "shouldn't", "wouldn't", "didn't",
  "isn't", "aren't", "ain't"
]);

// Boosters and softeners
const STRONG_INTENSIFIERS = new Set(['extremely', 'totally', 'absolutely', 'incredibly', 'highly', 'so', 'super']);
const LIGHT_INTENSIFIERS = new Set(['very', 'really', 'quite', 'pretty', 'especially']);
const DOWNTONERS = new Set(['slightly', 'somewhat', 'kinda', 'kind', 'sorta', 'sort', 'little', 'barely', 'hardly']);

// Stop/filler words we can skip when scanning for negation or boosters
const SKIP_WORDS = new Set(['a', 'an', 'the', 'to', 'of', 'and', 'or', 'but', 'just', 'really', 'very', 'so', 'feel', 'feeling', 'felt', 'am', 'is', 'are', 'was', 'were']);

// Mapping for "not [Mood]" -> [OppositeMood]
const NEGATION_MAP: Partial<Record<MoodType, MoodType>> = {
  Happy: 'Sad',
  Sad: 'Happy',
  Excited: 'Tired',
  Tired: 'Excited',
  Anxious: 'Happy',
};

// Precompute word->mood lookup for O(1)
const WORD_TO_MOOD = (() => {
  const map: Record<string, MoodType> = {};
  Object.entries(MOOD_DICTIONARY).forEach(([mood, words]) => {
    words.forEach((w) => {
      map[w] = mood as MoodType;
    });
  });
  return map;
})();

function tokenize(text: string): string[] {
  // Capture words and simple emoticons/emoji markers; keeps contractions
  return text.toLowerCase().match(/[a-z']+|[:;=8][-~]?[)d(\/]/g) || [];
}

function clampTokens(tokens: string[], limit = 600): string[] {
  return tokens.length > limit ? tokens.slice(0, limit) : tokens;
}

function applyPhraseBoost(text: string, scores: Record<MoodType, number>) {
  const lower = text.toLowerCase();
  PHRASES.forEach(({ phrase, mood }) => {
    if (lower.includes(phrase)) {
      scores[mood] += 1.5;
    }
  });
}

function detectNegation(tokens: string[], index: number): boolean {
  // Look back up to 3 tokens (skipping fillers) and forward 2 tokens for trailing negation
  let skipped = 0;
  for (let i = index - 1; i >= 0 && skipped < 3; i--) {
    const w = tokens[i];
    if (SKIP_WORDS.has(w)) continue;
    if (NEGATIONS.has(w)) return true;
    skipped++;
  }

  // Check a short lookahead for patterns like "happy not really"
  for (let i = 1; i <= 2; i++) {
    const w = tokens[index + i];
    if (!w) break;
    if (NEGATIONS.has(w)) return true;
    if (!SKIP_WORDS.has(w)) break; // stop early if a real word appears
  }

  return false;
}

function computeBoost(tokens: string[], index: number): number {
  let boost = 1;

  // Look at immediate predecessor that is not a skip word
  let i = index - 1;
  while (i >= 0 && SKIP_WORDS.has(tokens[i])) {
    i--;
  }

  const prev = tokens[i];
  if (prev) {
    if (STRONG_INTENSIFIERS.has(prev)) boost += 1.2;
    else if (LIGHT_INTENSIFIERS.has(prev)) boost += 0.6;
    else if (DOWNTONERS.has(prev)) boost -= 0.4;
  }

  if (boost < 0.4) boost = 0.4; // avoid zeroing evidence
  return boost;
}

export function inferMood(text: string): MoodResult {
  if (!text || !text.trim()) {
    return {
      mood: 'Neutral',
      score: 0,
      scores: { Happy: 0, Sad: 0, Anxious: 0, Excited: 0, Tired: 0, Neutral: 0 },
      confidence: 0,
      tokensUsed: 0,
    };
  }

  const tokens = clampTokens(tokenize(text));
  const scores: Record<MoodType, number> = {
    Happy: 0,
    Sad: 0,
    Anxious: 0,
    Excited: 0,
    Tired: 0,
    Neutral: 0,
  };

  applyPhraseBoost(text, scores);

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    const foundMood = WORD_TO_MOOD[word];
    if (!foundMood) continue;

    const isNegated = detectNegation(tokens, i);
    const boost = computeBoost(tokens, i);

    if (isNegated) {
      const opposite = NEGATION_MAP[foundMood];
      if (opposite) {
        scores[opposite] += boost;
      } else {
        scores.Neutral += boost * 0.3; // small neutral credit when no mapped opposite
      }
    } else {
      scores[foundMood] += boost;
    }
  }

  // Find winner with tie-breaker preferring non-neutral
  let bestMood: MoodType = 'Neutral';
  let highestScore = 0;
  Object.entries(scores).forEach(([mood, score]) => {
    if (score > highestScore) {
      highestScore = score;
      bestMood = mood as MoodType;
    }
  });

  const total = Object.values(scores).reduce((sum, val) => sum + val, 0) || 1;
  const confidence = Math.min(1, highestScore / total);

  return {
    mood: bestMood,
    score: highestScore,
    scores,
    confidence,
    tokensUsed: tokens.length,
  };
}
