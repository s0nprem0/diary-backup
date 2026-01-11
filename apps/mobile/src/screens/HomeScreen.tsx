import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { FAB, Text, Button, useTheme } from 'react-native-paper';
import { getEntries, deleteEntry, syncPendingEntries, Entry as LocalEntry } from '../services/entriesService';
import { ENTRIES_API } from '../../config';
import EntryCard from '../components/EntryCard';

export default function HomeScreen({ navigation }: any) {
  const [entries, setEntries] = useState<any[]>([]);
  const { colors } = useTheme();

  const load = async () => {
    const data = await getEntries();
    setEntries(data);
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', async () => {
      await load();
      // Attempt background sync of pending entries whenever returning to Home
      try {
        await syncPendingEntries(async (entry: LocalEntry) => {
          // If entry has a remoteId, try to patch; else create
          try {
            if (entry.remoteId) {
              const res = await fetch(`${ENTRIES_API}/${entry.remoteId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: entry.notes || '' }),
              });
              return { ok: res.ok, data: res.ok ? await res.json() : undefined };
            } else {
              const res = await fetch(ENTRIES_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: entry.notes || '' }),
              });
              return { ok: res.ok, data: res.ok ? await res.json() : undefined };
            }
          } catch (e) {
            return { ok: false };
          }
        });
        // reload to reflect any synced status updates
        await load();
      } catch {
        // ignore sync errors
      }
    });
    load();
    return unsub;
  }, [navigation]);

  const handleEdit = (entry: any) => {
    navigation.navigate('AddEntry', { entry });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete entry?', 'This action cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(id);
          load();
        },
      },
    ]);
  };

  const getTodayEntries = () => {
    const today = new Date().toDateString();
    return entries.filter((e) => new Date(e.date).toDateString() === today);
  };

  const todayEntries = getTodayEntries();
  const allEntriesCount = entries.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={{ marginBottom: 20 }}>
          <Text variant="headlineMedium">Today</Text>
          {allEntriesCount > 0 && (
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
              {allEntriesCount} total entries
            </Text>
          )}
        </View>

        {todayEntries.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surfaceVariant }]}>
            <Text variant="displaySmall" style={{ marginBottom: 8 }}>
              📖
            </Text>
            <Text variant="titleLarge" style={{ marginBottom: 8, color: colors.onSurface }}>
              Begin your mood journey
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, marginBottom: 16, textAlign: 'center' }}>
              No entries yet today. What's on your mind?
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('AddEntry')}
              style={{ alignSelf: 'center' }}
              icon="plus"
            >
              Write Now
            </Button>
          </View>
        ) : (
          todayEntries.map((e) => (
            <EntryCard key={e.id || e._id} entry={e} onEdit={handleEdit} onDelete={handleDelete} />
          ))
        )}
      </ScrollView>
      <FAB
        icon="plus"
        onPress={() => navigation.navigate('AddEntry')}
        style={styles.fab}
        accessibilityLabel="Add entry"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fab: { position: 'absolute', right: 16, bottom: 24 },
  emptyState: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
});
