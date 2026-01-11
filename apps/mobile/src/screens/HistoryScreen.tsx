import React, { useEffect, useState } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { Text, useTheme, Searchbar, Chip, Button } from 'react-native-paper';
import { getEntries, deleteEntry } from '../services/entriesService';
import { MOOD_OPTIONS, getMoodEmoji } from '../services/moodUtils';
import EntryCard from '../components/EntryCard';

// Group entries by date
const groupEntriesByDate = (entries: any[]): Record<string, any[]> => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const weekAgo = new Date(Date.now() - 604800000).toDateString();
  const monthAgo = new Date(Date.now() - 2592000000).toDateString();

  const groups: Record<string, any[]> = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'This Month': [],
    'Older': [],
  };

  entries.forEach((entry) => {
    const entryDate = new Date(entry.date).toDateString();
    const entryTime = new Date(entry.date).getTime();
    const nowTime = Date.now();

    if (entryDate === today) {
      groups['Today'].push(entry);
    } else if (entryDate === yesterday) {
      groups['Yesterday'].push(entry);
    } else if (entryTime > nowTime - 604800000) {
      groups['This Week'].push(entry);
    } else if (entryTime > nowTime - 2592000000) {
      groups['This Month'].push(entry);
    } else {
      groups['Older'].push(entry);
    }
  });

  return groups;
};

export default function HistoryScreen({ navigation }: any) {
  const [entries, setEntries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);
  const { colors } = useTheme();

  useEffect(() => {
    (async () => setEntries(await getEntries()))();
  }, []);

  const handleEdit = (entry: any) => navigation.navigate('AddEntry', { entry });

  const handleDelete = (id: string) => {
    Alert.alert('Delete entry?', 'This action cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(id);
          setEntries(await getEntries());
        },
      },
    ]);
  };

  // Filter entries by search query and mood
  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.mood.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMood = !selectedMoodFilter || e.mood === selectedMoodFilter;
    return matchesSearch && matchesMood;
  });

  // Group filtered entries by date
  const entriesByGroup = groupEntriesByDate(filteredEntries);
  const nonEmptyGroups = Object.entries(entriesByGroup).filter(([_, entries]) => entries.length > 0);

  const allEntriesCount = entries.length;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text variant="headlineMedium" style={{ marginBottom: 16 }}>
        History
      </Text>

      {allEntriesCount > 0 ? (
        <>
          {/* Search Bar */}
          <Searchbar
            placeholder="Search entries..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={{ marginBottom: 12 }}
          />

          {/* Mood Filters */}
          <View style={{ marginBottom: 16 }}>
            <Text variant="labelLarge" style={{ marginBottom: 8, color: colors.onSurface }}>
              Filter by mood
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {selectedMoodFilter && (
                <Chip
                  mode="flat"
                  onPress={() => setSelectedMoodFilter(null)}
                  selected={true}
                  style={{ backgroundColor: colors.primary }}
                  textStyle={{ color: colors.onPrimary }}
                >
                  Clear filter ✕
                </Chip>
              )}
              {MOOD_OPTIONS.map((mood: string) => (
                <Chip
                  key={mood}
                  selected={selectedMoodFilter === mood}
                  mode={selectedMoodFilter === mood ? 'flat' : 'outlined'}
                  onPress={() => setSelectedMoodFilter(selectedMoodFilter === mood ? null : mood)}
                  style={{
                    backgroundColor: selectedMoodFilter === mood ? colors.primary : 'transparent',
                  }}
                  textStyle={{
                    color: selectedMoodFilter === mood ? colors.onPrimary : colors.onSurface,
                  }}
                >
                  {getMoodEmoji(mood)} {mood}
                </Chip>
              ))}
            </View>
          </View>

          {/* Results */}
          {filteredEntries.length === 0 ? (
            <View
              style={[
                {
                  borderRadius: 12,
                  padding: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surfaceVariant,
                  marginTop: 12,
                },
              ]}
            >
              <Text variant="titleMedium" style={{ color: colors.onSurface, marginBottom: 8 }}>
                No entries found
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                Try different search terms or filters
              </Text>
            </View>
          ) : (
            nonEmptyGroups.map(([groupName, groupEntries]) => (
              <View key={groupName} style={{ marginTop: 16 }}>
                <Text
                  variant="labelLarge"
                  style={{
                    color: colors.onSurfaceVariant,
                    paddingHorizontal: 4,
                    marginBottom: 8,
                    marginTop: groupName !== 'Today' ? 12 : 0,
                  }}
                >
                  {groupName}
                </Text>
                {groupEntries.map((e) => (
                  <EntryCard key={e.id || e._id} entry={e} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </View>
            ))
          )}
        </>
      ) : (
        <View
          style={[
            {
              borderRadius: 12,
              padding: 32,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surfaceVariant,
              marginTop: 12,
            },
          ]}
        >
          <Text variant="displaySmall" style={{ marginBottom: 12 }}>
            📚
          </Text>
          <Text variant="titleLarge" style={{ marginBottom: 8, color: colors.onSurface }}>
            No entries yet
          </Text>
          <Text
            variant="bodyMedium"
            style={{
              color: colors.onSurfaceVariant,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Your mood history will appear here
          </Text>
          <Button mode="contained" onPress={() => navigation.navigate('Home')} icon="plus">
            Create First Entry
          </Button>
        </View>
      )}
    </ScrollView>
  );
}


