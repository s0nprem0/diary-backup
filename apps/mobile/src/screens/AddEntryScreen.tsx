import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Button, Text, useTheme, Snackbar, Chip, ActivityIndicator } from 'react-native-paper';
import { addEntry, updateEntry } from '../services/entriesService';
import { mobileAuthService } from '../services/authService';
import { ENTRIES_API } from '../../config';
import { inferMood } from '../services/mood';
import { MOOD_OPTIONS, getMoodEmoji } from '../services/moodUtils';
import * as Haptics from 'expo-haptics';

export default function AddEntryScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const existing = route?.params?.entry;
  const [notes, setNotes] = useState(existing?.notes || '');
  const [mood, setMood] = useState(existing?.mood || 'Neutral');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!existing;
  const initialNotes = existing?.notes || '';

  // Warn on unsaved changes when navigating away
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!isEditing && notes !== initialNotes && notes.trim()) {
        e.preventDefault();
        Alert.alert('Discard draft?', 'You have unsaved changes. Discard them?', [
          { text: 'Keep drafting', onPress: () => {} },
          {
            text: 'Discard',
            onPress: () => navigation.dispatch(e.data.action),
            style: 'destructive',
          },
        ]);
      } else if (isEditing && notes !== initialNotes) {
        e.preventDefault();
        Alert.alert('Discard changes?', 'You have unsaved changes to this entry.', [
          { text: 'Keep editing', onPress: () => {} },
          {
            text: 'Discard',
            onPress: () => navigation.dispatch(e.data.action),
            style: 'destructive',
          },
        ]);
      }
    });
    return unsubscribe;
  }, [navigation, notes, initialNotes, isEditing]);

  const handleSave = async () => {
    if (!notes.trim()) {
      Alert.alert('Empty entry', 'Please write something before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      /* ignore haptics errors */
    }

    // Local-first: write locally immediately, then attempt remote sync in background
    try {
      const token = await mobileAuthService.getToken();

      if (isEditing) {
        // Update locally first
        await updateEntry(existing.id, { notes, mood, synced: false });

        // Fire-and-forget remote update
        const remoteId = existing?.remoteId;
        if (remoteId) {
          try {
            const res = await fetch(`${ENTRIES_API}/${remoteId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify({ content: notes, mood }),
            });
            if (res.ok) {
              await updateEntry(existing.id, { synced: true });
            }
          } catch {
            // stay unsynced; background sync will retry later
          }
        }
      } else {
        // Create locally first with user-selected mood
        const local = await addEntry({ date: new Date().toISOString(), mood, notes }, false);

        // Fire-and-forget remote create
        try {
          const res = await fetch(ENTRIES_API, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ content: notes || '', mood }),
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

    setIsSaving(false);
    setShowSaveSuccess(true);

    // Show success message then navigate after 1.5 seconds
    setTimeout(() => {
      try {
        navigation.navigate('Main', { screen: 'Home' });
      } catch {
        navigation.goBack();
      }
    }, 1500);
  };

  return (
    <>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
            {isEditing ? 'Edit Entry' : 'How are you feeling?'}
          </Text>

          {/* Mood Selector */}
          <View style={{ marginBottom: 20 }}>
            <Text variant="labelLarge" style={{ marginBottom: 8, color: colors.onSurface }}>
              Your mood
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MOOD_OPTIONS.map((m) => (
                <Chip
                  key={m}
                  selected={mood === m}
                  mode={mood === m ? 'flat' : 'outlined'}
                  onPress={() => setMood(m)}
                  style={{
                    backgroundColor: mood === m ? colors.primary : 'transparent',
                  }}
                  textStyle={{
                    color: mood === m ? colors.onPrimary : colors.onSurface,
                  }}
                >
                  {getMoodEmoji(m)} {m}
                </Chip>
              ))}
            </View>
          </View>

          {/* Notes Input */}
          <Text variant="labelLarge" style={{ marginBottom: 8, color: colors.onSurface }}>
            What's on your mind?
          </Text>
          <TextInput
            placeholder="Write your thoughts here..."
            placeholderTextColor={colors.onSurfaceVariant || colors.onSurface}
            value={notes}
            onChangeText={setNotes}
            style={[
              {
                height: 150,
                borderWidth: 1,
                padding: 12,
                borderRadius: 8,
                borderColor: colors.outline || colors.surfaceVariant || colors.surface,
                backgroundColor: colors.surface,
                color: colors.onSurface,
                fontSize: 16,
              },
            ]}
            multiline
            editable={!isSaving}
          />

          {/* Save Button */}
          <Button
            mode="contained"
            onPress={handleSave}
            disabled={isSaving}
            style={{ marginTop: 20 }}
            loading={isSaving}
          >
            {isSaving ? 'Saving...' : isEditing ? 'Update Entry' : 'Save Entry'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Snackbar */}
      <Snackbar
        visible={showSaveSuccess}
        onDismiss={() => setShowSaveSuccess(false)}
        duration={2000}
        style={{ backgroundColor: colors.primary }}
      >
        ✓ Entry saved successfully
      </Snackbar>
    </>
  );
}
