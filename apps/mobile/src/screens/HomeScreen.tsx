import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, Text, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { getEntries, deleteEntry, Entry as LocalEntry } from '../services/entriesService';
import EntryCard from '../components/EntryCard';

export default function HomeScreen({ navigation }: any) {
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const [isConnected, setIsConnected] = useState(true);
  const { colors } = useTheme();

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await getEntries();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries', error);
    } finally {
      setIsLoading(false);
    }
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Offline Indicator */}
      {!isConnected && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.errorContainer }]}>
          <Text style={{ color: colors.onErrorContainer, fontSize: 13, fontWeight: '500' }}>
            📡 Offline — entries stay saved on this device
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <View style={{ marginBottom: 20 }}>
            <Text variant="headlineMedium" style={{ color: colors.onBackground }}>Today</Text>
            {allEntriesCount > 0 && (
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
                {allEntriesCount} total entries in history
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
                icon="pencil"
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
      )}

      {/* FIX: The FAB was defined in styles but not rendered.
        This ensures users can add a 2nd entry for the day.
      */}
      {!isLoading && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: colors.primaryContainer }]}
          color={colors.onPrimaryContainer}
          onPress={() => navigation.navigate('AddEntry')}
          label={todayEntries.length > 0 ? "New Entry" : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0, // Adjusted for standard placement, relies on safe area or padding if needed.
    // If you have a bottom tab bar, you might want to increase 'bottom' or keep the original 88
    // bottom: 88,
  },
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
