import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { getEntries } from '../services/entriesService';

export default function InsightsScreen() {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    (async () => setEntries(await getEntries()))();
  }, []);

  // Simple weekly counts per mood
  const weeklyCounts = () => {
    const now = new Date();
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      return d.toDateString();
    });
    const counts: Record<string, number> = {};
    entries.forEach((e) => { counts[e.mood] = (counts[e.mood] || 0) + 1; });
    return { days, counts };
  };

  const { days, counts } = weeklyCounts();

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text variant="headlineMedium">Insights</Text>
      <View style={{ marginTop: 12 }}>
        <Text variant="titleMedium">Weekly overview</Text>
        {Object.keys(counts).length === 0 ? (
          <Text style={{ marginTop: 12 }}>No data yet. Add entries to see trends.</Text>
        ) : (
          Object.entries(counts).map(([mood, c]) => (
            <View key={mood} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text>{mood}</Text>
              <Text>{c}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}


