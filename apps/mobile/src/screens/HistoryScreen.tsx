import React, { useEffect, useState } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { getEntries, deleteEntry } from '../services/entriesService';
import EntryCard from '../components/EntryCard';

export default function HistoryScreen({ navigation }: any) {
  const [entries, setEntries] = useState<any[]>([]);
  useEffect(() => {
    (async () => setEntries(await getEntries()))();
  }, []);

  const handleEdit = (entry: any) => navigation.navigate('AddEntry', { entry });

  const handleDelete = (id: string) => {
    Alert.alert('Delete entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
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

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text variant="headlineMedium">History</Text>
      <View style={{ marginTop: 12 }}>
        {entries.length === 0 ? (
          <Text>No history yet.</Text>
        ) : (
          entries.map((e) => <EntryCard key={e.id || e._id} entry={e} onEdit={handleEdit} onDelete={handleDelete} />)
        )}
      </View>
    </ScrollView>
  );
}


