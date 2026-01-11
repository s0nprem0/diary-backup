import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, useTheme } from 'react-native-paper';

export default function EntryCard({ entry }: { entry: any }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        <View style={styles.row}>
          <Text style={[styles.mood, { color: colors.primary }]}>{entry.mood}</Text>
          <Text style={styles.date}>{new Date(entry.date).toLocaleString()}</Text>
        </View>
        <Text style={styles.notes}>{entry.notes}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: 6, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mood: { fontWeight: '700', fontSize: 16 },
  date: { fontSize: 12, color: '#666' },
  notes: { marginTop: 8, color: '#333' },
});
