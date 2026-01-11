import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Card, useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getMoodEmoji } from '../services/moodUtils';
import { useFadeInAnimation } from '../services/animations';

export default function EntryCard({ entry, onEdit, onDelete }: { entry: any; onEdit?: (e: any) => void; onDelete?: (id: string) => void }) {
  const { colors } = useTheme();
  const { fadeAnim, fadeIn } = useFadeInAnimation();

  useEffect(() => {
    fadeIn();
  }, []);

  // Determine sync status indicator
  const getSyncStatus = () => {
    if (entry.synced) {
      return { icon: 'check-circle' as const, color: colors.primary, label: 'Synced' };
    } else {
      return { icon: 'cloud-upload-outline' as const, color: colors.onSurfaceVariant, label: 'Syncing...' };
    }
  };

  const syncStatus = getSyncStatus();
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
          <View style={styles.syncBadge}>
            <MaterialCommunityIcons name={syncStatus.icon} size={16} color={syncStatus.color} />
            <Text style={[styles.syncLabel, { color: syncStatus.color }]}>{syncStatus.label}</Text>
          </View>
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
              size={18}
              onPress={() => onEdit(entry)}
              accessibilityLabel="Edit entry"
            />
          )}
          {onDelete && (
            <IconButton
              icon="delete"
              size={18}
              onPress={() => onDelete(entry.id || entry._id || entry.remoteId)}
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
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  syncLabel: { fontSize: 12, fontWeight: '500' },
  date: { fontSize: 12, marginBottom: 8 },
  notes: { marginBottom: 12, fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, marginRight: -8 },
});
