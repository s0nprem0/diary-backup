import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { getEntries } from '../services/entriesService';
import EntryCard from '../components/EntryCard';

export default function HistoryScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  useEffect(() => {
    (async () => setEntries(await getEntries()))();
  }, []);
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text variant="headlineMedium">History</Text>
      <View style={{ marginTop: 12 }}>
        {entries.length === 0 ? <Text>No history yet.</Text> : entries.map((e) => <EntryCard key={e.id} entry={e} />)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
