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
  return (
    <View style={styles.row}>
      {MOODS.map((m) => (
        <TouchableOpacity
          key={m.key}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(m.key);
          }}
          accessibilityLabel={m.label}
          style={[styles.button, value === m.key && { borderColor: colors.primary, transform: [{ scale: value === m.key ? 1.06 : 1 }] }]}
        >
          <Text style={styles.emoji}>{m.emoji}</Text>
          <Text style={styles.label}>{m.label}</Text>
        </TouchableOpacity>
      ))}
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
    backgroundColor: '#fff',
    elevation: 2,
  },
  emoji: { fontSize: 28 },
  label: { marginTop: 6, fontSize: 12, color: '#333' },
});
