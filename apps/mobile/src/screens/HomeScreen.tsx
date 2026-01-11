import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { FAB, Text, Button, useTheme } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { getEntries, deleteEntry, syncPendingEntries, Entry as LocalEntry } from '../services/entriesService';
import { mobileAuthService } from '../services/authService';
import { ENTRIES_API } from '../../config';
import EntryCard from '../components/EntryCard';

export default function HomeScreen({ navigation }: any) {
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [isConnected, setIsConnected] = useState(true);
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
        const token = await mobileAuthService.getToken();
        await syncPendingEntries(async (entry: LocalEntry) => {
          // If entry has a remoteId, try to patch; else create
          try {
            if (entry.remoteId) {
              const res = await fetch(`${ENTRIES_API}/${entry.remoteId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                  notes: entry.notes || '',
                  mood: entry.mood,
                  date: entry.date,
                }),
              });
              return { ok: res.ok, data: res.ok ? await res.json() : undefined };
            } else {
              const res = await fetch(ENTRIES_API, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                  notes: entry.notes || '',
                  mood: entry.mood,
                  date: entry.date,
                }),
              });
              return { ok: res.ok, data: res.ok ? await res.json() : undefined };
            }
          } catch (e) {
            return { ok: false };
          }
        });
        // reload to reflect any synced status updates
        await load();
      } catch (err) {
        // Log but don't block - sync errors are non-critical
        console.warn('Background sync on focus failed:', err);
      }
    });
    load();
    return unsub;
  }, [navigation]);

  // Monitor connectivity
  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => sub();
  }, []);

  const handleEdit = (entry: any) => {
    navigation.navigate('AddEntry', { entry });
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete entry?', 'This action cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // Find the entry to get its remoteId
          const entry = entries.find(e => e.id === id);

          // Delete locally first
          await deleteEntry(id);

          // Try to delete from remote if we have a remoteId and are online
          if (entry?.remoteId && isConnected) {
            try {
              const token = await mobileAuthService.getToken();
              await fetch(`${ENTRIES_API}/${entry.remoteId}`, {
                method: 'DELETE',
                headers: {
                  ...(token && { Authorization: `Bearer ${token}` }),
                },
              });
            } catch (err) {
              // Ignore remote delete errors - local delete already happened
              console.warn('Failed to delete from remote:', err);
            }
          }

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
      {/* Offline Indicator */}
      {!isConnected && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.onSurfaceVariant }]}>
          <Text style={{ color: colors.surface, fontSize: 13, fontWeight: '500' }}>
            📡 Offline — entries will sync when connected
          </Text>
        </View>
      )}

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
            <EntryCard key={e.id} entry={e} onEdit={handleEdit} onDelete={handleDelete} />
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
  offlineBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
