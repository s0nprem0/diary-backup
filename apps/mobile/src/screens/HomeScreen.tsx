import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { FAB, Text, Button, useTheme } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { getEntries, deleteEntry, Entry as LocalEntry } from '../services/entriesService';
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
    const unsub = navigation.addListener('focus', load);
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
          // Delete locally first
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
      {/* Offline Indicator */}
      {!isConnected && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.onSurfaceVariant }]}>
          <Text style={{ color: colors.surface, fontSize: 13, fontWeight: '500' }}>
            📡 Offline — entries stay saved on this device
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
