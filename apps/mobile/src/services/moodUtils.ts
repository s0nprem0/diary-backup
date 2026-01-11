// Mood emoji mapping and utilities
export const MOOD_EMOJI_MAP: Record<string, string> = {
  'Happy': '😊',
  'Sad': '😞',
  'Neutral': '😐',
  'Anxious': '😰',
  'Excited': '🤩',
  'Tired': '😴',
};

export const MOOD_OPTIONS = Object.keys(MOOD_EMOJI_MAP);

export const getMoodEmoji = (mood: string): string => {
  return MOOD_EMOJI_MAP[mood] || '😐';
};

export const getMoodWithEmoji = (mood: string): string => {
  return `${getMoodEmoji(mood)} ${mood}`;
};

// Get emoji only (for headers, stats)
export const getMoodEmojiOnly = (mood: string): string => {
  return getMoodEmoji(mood);
};
