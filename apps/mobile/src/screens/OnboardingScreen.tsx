import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, Animated } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  title: string;
  description: string;
  emoji: string;
  color: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    title: 'Welcome to Mood Diary',
    description: 'Track your emotions and understand your patterns over time',
    emoji: '📖',
    color: '#3367D6',
  },
  {
    title: 'Write Your Thoughts',
    description: 'Add entries with your mood. Data is saved locally and synced when online',
    emoji: '✍️',
    color: '#6AB7FF',
  },
  {
    title: 'Explore Your Insights',
    description: 'See your mood distribution and patterns to better understand yourself',
    emoji: '📊',
    color: '#3367D6',
  },
  {
    title: 'All Set!',
    description: "You're ready to start journaling. Your entries are private and always yours",
    emoji: '🎉',
    color: '#6AB7FF',
  },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { colors } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
      scrollViewRef.current?.scrollTo({
        x: (currentSlide + 1) * width,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = SLIDES[currentSlide];
  const progress = ((currentSlide + 1) / SLIDES.length) * 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
          {currentSlide + 1} / {SLIDES.length}
        </Text>
        {currentSlide < SLIDES.length - 1 && (
          <Button onPress={handleSkip} compact>
            Skip
          </Button>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ width: width * SLIDES.length }}
      >
        {SLIDES.map((s, idx) => (
          <View key={idx} style={[styles.slide, { width }]}>
            <View style={[styles.emojiContainer, { backgroundColor: s.color + '20' }]}>
              <Text style={styles.emoji}>{s.emoji}</Text>
            </View>
            <Text variant="headlineMedium" style={[styles.title, { color: colors.onSurface }]}>
              {s.title}
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.description, { color: colors.onSurfaceVariant }]}
            >
              {s.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    idx === currentSlide ? colors.primary : colors.outlineVariant,
                },
              ]}
            />
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.button}
          contentStyle={{ paddingVertical: 8 }}
        >
          {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  slide: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: { fontSize: 56 },
  title: { textAlign: 'center', marginBottom: 16 },
  description: { textAlign: 'center', lineHeight: 24 },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  button: { width: '100%' },
});
