import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { FAB, Text, Button } from 'react-native-paper';
import { getEntries } from '../services/entriesService';
import EntryCard from '../components/EntryCard';

export default function HomeScreen({ navigation }: any) {
  const [entries, setEntries] = useState<any[]>([]);

  const load = async () => {
    const data = await getEntries();
    setEntries(data);
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    load();
    return unsub;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text variant="headlineMedium">Today</Text>
        {entries.length === 0 ? (
          <View style={{ marginTop: 24 }}>
            <Text>No entries yet — start your mood diary.</Text>
            <Button mode="contained" style={{ marginTop: 12 }} onPress={() => navigation.navigate('AddEntry')}>
              Add Entry
            </Button>
          </View>
        ) : (
          entries.map((e) => <EntryCard key={e.id} entry={e} />)
        )}
      </ScrollView>
      <FAB icon="plus" onPress={() => navigation.navigate('AddEntry')} style={styles.fab} accessibilityLabel="Add entry" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
