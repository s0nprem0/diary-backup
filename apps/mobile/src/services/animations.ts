import { Animated } from 'react-native';

// Fade in animation
export const useFadeInAnimation = () => {
  const fadeAnim = new Animated.Value(0);

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return { fadeAnim, fadeIn };
};

// Scale animation
export const useScaleAnimation = () => {
  const scaleAnim = new Animated.Value(0.95);

  const scaleIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return { scaleAnim, scaleIn };
};

// Slide in animation
export const useSlideInAnimation = () => {
  const slideAnim = new Animated.Value(-20);
  const fadeAnim = new Animated.Value(0);

  const slideIn = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { slideAnim, fadeAnim, slideIn };
};

// Create reusable animation config
export const animationConfig = {
  duration: 300,
  useNativeDriver: true,
};
