import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Card, useTheme, IconButton } from 'react-native-paper';
import { getMoodEmoji } from '../services/moodUtils';
import { useFadeInAnimation } from '../services/animations';

export default function EntryCard({ entry, onEdit, onDelete }: { entry: any; onEdit?: (e: any) => void; onDelete?: (id: string) => void }) {
  const { colors } = useTheme();
  const { fadeAnim, fadeIn } = useFadeInAnimation();

  useEffect(() => {
    fadeIn();
  }, []);
  const formattedDate = new Date(entry.date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Card style={styles.card} elevation={2}>
      <Card.Content>
        {/* Header: Mood + Sync Status */}
        <View style={styles.header}>
          <Text style={[styles.mood, { color: colors.primary }]}>
            {getMoodEmoji(entry.mood)} {entry.mood}
          </Text>
        </View>

        {/* Date */}
        <Text style={[styles.date, { color: colors.onSurfaceVariant }]}>{formattedDate}</Text>

        {/* Notes */}
        <Text style={[styles.notes, { color: colors.onSurface }]} numberOfLines={3}>
          {entry.notes}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          {onEdit && (
            <IconButton
              icon="pencil"
              size={24}
              onPress={() => onEdit(entry)}
              accessibilityLabel="Edit entry"
            />
          )}
          {onDelete && (
            <IconButton
              icon="delete"
              size={24}
              onPress={() => onDelete(entry.id)}
              accessibilityLabel="Delete entry"
            />
          )}
        </View>
      </Card.Content>
    </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: 8, borderRadius: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  mood: { fontWeight: '700', fontSize: 18 },
  date: { fontSize: 12, marginBottom: 8 },
  notes: { marginBottom: 12, fontSize: 16, lineHeight: 22 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, paddingRight: 4 },
});
