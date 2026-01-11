import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { addEntry, updateEntry } from '../services/entriesService';
import { ENTRIES_API } from '../../config';
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

    try {
      if (isEditing) {
        // Attempt to update remote if we have a remoteId
        const remoteId = existing?.remoteId;
        let remoteOk = false;
        if (remoteId) {
          try {
            const res = await fetch(`${ENTRIES_API}/${remoteId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: notes }),
            });
            remoteOk = res.ok;
          } catch (e) {
            remoteOk = false;
          }
        }

        // Update local entry; if remote update failed mark as not synced
        await updateEntry(existing.id || existing._id, { notes, synced: !!remoteOk });
      } else {
        // create new entry (same flow as before)
        const res = await fetch(ENTRIES_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: notes || '' }),
        });

        if (res.ok) {
          const remote = await res.json();
          await addEntry(
            {
              date: remote.createdAt || new Date().toISOString(),
              mood: remote.mood || 'Neutral',
              notes: remote.content || notes,
            },
            true,
            remote.id || remote._id,
          );
        } else {
          // fallback: save locally (not synced)
          await addEntry({ date: new Date().toISOString(), mood: 'Unknown', notes }, false);
        }
      }
    } catch (e) {
      // network error -> save locally (not synced) or mark not synced
      if (isEditing) {
        await updateEntry(existing.id || existing._id, { notes, synced: false });
      } else {
        await addEntry({ date: new Date().toISOString(), mood: 'Unknown', notes }, false);
      }
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
