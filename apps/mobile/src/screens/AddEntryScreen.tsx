import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { addEntry, updateEntry } from '../services/entriesService';
import { ENTRIES_API } from '../../config';
import { inferMood } from '../services/mood';
import * as Haptics from 'expo-haptics';

export default function AddEntryScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const existing = route?.params?.entry;
  const [notes, setNotes] = useState(existing?.notes || '');
  const isEditing = !!existing;

  const handleSave = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      /* ignore haptics errors */
    }

    // Local-first: write locally immediately, then attempt remote sync in background
    try {
      if (isEditing) {
        // Update locally first
        await updateEntry(existing.id || existing._id, { notes, synced: false });

        // Fire-and-forget remote update
        const remoteId = existing?.remoteId;
        if (remoteId) {
          try {
            const res = await fetch(`${ENTRIES_API}/${remoteId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: notes }),
            });
            if (res.ok) {
              await updateEntry(existing.id || existing._id, { synced: true });
            }
          } catch {
            // stay unsynced; background sync will retry later
          }
        }
      } else {
        // Create locally first with inferred mood for better UX
        const inferred = inferMood(notes || '');
        const local = await addEntry({ date: new Date().toISOString(), mood: inferred.mood, notes }, false);

        // Fire-and-forget remote create
        try {
          const res = await fetch(ENTRIES_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: notes || '' }),
          });
          if (res.ok) {
            const remote = await res.json();
            await updateEntry(local.id, {
              synced: true,
              remoteId: remote.id || remote._id,
              mood: remote.mood || local.mood,
              date: remote.createdAt || local.date,
              notes: remote.content || notes,
            });
          }
        } catch {
          // remain unsynced; background sync will retry later
        }
      }
    } catch {
      // swallow; local writes already done
    }

    // Navigate back to the Home tab inside the Main stack.
    // `Home` lives in the nested BottomTabs navigator registered under the "Main" stack entry.
    try {
      navigation.navigate('Main', { screen: 'Home' });
    } catch {
      // fallback to a generic goBack if nested navigation fails
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Text variant="headlineSmall" style={{ marginBottom: 8 }}>How are you feeling?</Text>

        <TextInput
          placeholder="Write a short note..."
          placeholderTextColor={colors.onSurfaceVariant || colors.onSurface}
          value={notes}
          onChangeText={setNotes}
          style={[styles.textarea, { borderColor: colors.outline || colors.surfaceVariant || colors.surface, backgroundColor: colors.surface }]}
          multiline
        />
        <Button mode="contained" onPress={handleSave} style={{ marginTop: 12 }}>
          {isEditing ? 'Update Entry' : 'Save Entry'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  textarea: { height: 120, borderWidth: 1, padding: 12, borderRadius: 8, marginTop: 12 },
});
