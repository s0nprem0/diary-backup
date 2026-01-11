import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, useTheme, IconButton } from 'react-native-paper';

export default function EntryCard({ entry, onEdit, onDelete }: { entry: any; onEdit?: (e: any) => void; onDelete?: (id: string) => void }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        <View style={styles.row}>
          <Text style={[styles.mood, { color: colors.primary }]}>{entry.mood}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.date, { color: colors.onSurfaceVariant || colors.outline }]}>{new Date(entry.date).toLocaleString()}</Text>
            {onEdit && (
              <IconButton icon="pencil" size={18} onPress={() => onEdit(entry)} accessibilityLabel="Edit entry" />
            )}
            {onDelete && (
              <IconButton icon="delete" size={18} onPress={() => onDelete(entry.id || entry._id || entry.remoteId)} accessibilityLabel="Delete entry" />
            )}
          </View>
        </View>
        <Text style={[styles.notes, { color: colors.onSurface }]}>{entry.notes}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: 6, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mood: { fontWeight: '700', fontSize: 16 },
  date: { fontSize: 12 },
  notes: { marginTop: 8 },
});
