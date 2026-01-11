import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

export default function MoodSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={{ color: colors.onSurface, marginBottom: 8 }}>Intensity</Text>
      <Slider
        value={value}
        onValueChange={(v: number) => {
          Haptics.selectionAsync();
          onChange(Math.round(v));
        }}
        minimumValue={0}
        maximumValue={100}
        step={1}
        style={{ width: '100%', height: 40 }}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.onSurface}
        thumbTintColor={colors.primary}
      />
      <Text style={{ color: colors.primary, marginTop: 6 }}>{value}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
});
