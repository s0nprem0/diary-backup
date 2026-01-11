import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { addEntry } from '../services/entriesService';
import { ENTRIES_API } from '../../config';
import * as Haptics from 'expo-haptics';

export default function AddEntryScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      /* ignore haptics errors */
    }

    try {
      const res = await fetch(ENTRIES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: notes || '' }),
      });

      if (res.ok) {
        const remote = await res.json();
        await addEntry({
          date: remote.createdAt || new Date().toISOString(),
          mood: remote.mood || 'Neutral',
          notes: remote.content || notes,
        });
      } else {
        // fallback: save locally with unknown mood
        await addEntry({ date: new Date().toISOString(), mood: 'Unknown', notes });
      }
    } catch (e) {
      // network error -> save locally
      await addEntry({ date: new Date().toISOString(), mood: 'Unknown', notes });
    }

    navigation.navigate('Home');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Text variant="headlineSmall" style={{ marginBottom: 8 }}>How are you feeling?</Text>

        <TextInput
          placeholder="Write a short note..."
          value={notes}
          onChangeText={setNotes}
          style={styles.textarea}
          multiline
        />
        <Button mode="contained" onPress={handleSave} style={{ marginTop: 12 }}>
          Save Entry
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  textarea: { height: 120, borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, marginTop: 12 },
});
