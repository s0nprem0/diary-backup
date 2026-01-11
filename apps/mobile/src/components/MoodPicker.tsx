import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

const MOODS = [
  { key: 'happy', label: 'Happy', emoji: '😊' },
  { key: 'good', label: 'Good', emoji: '🙂' },
  { key: 'neutral', label: 'Neutral', emoji: '😐' },
  { key: 'sad', label: 'Sad', emoji: '😔' },
  { key: 'angry', label: 'Angry', emoji: '😠' },
];

export default function MoodPicker({ value, onChange }: { value?: string; onChange: (m: string) => void }) {
  const { colors } = useTheme();
  const selectedStyle = { borderColor: colors.primary, transform: [{ scale: 1.06 }] };

  return (
    <View style={styles.row}>
      {MOODS.map((m) => {
        const isSelected = value === m.key;
        return (
          <TouchableOpacity
            key={m.key}
            onPress={async () => {
              try {
                await Haptics.selectionAsync();
              } catch {
                /* ignore haptics errors */
              }
              onChange(m.key);
            }}
            accessibilityLabel={m.label}
            style={[styles.button, { backgroundColor: colors.surface }, isSelected && selectedStyle]}
          >
            <Text style={styles.emoji}>{m.emoji}</Text>
            <Text style={[styles.label, { color: colors.onSurface }]}>{m.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  button: {
    flex: 1,
    marginHorizontal: 6,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    elevation: 2,
  },
  emoji: { fontSize: 28 },
  label: { marginTop: 6, fontSize: 12 },
});
