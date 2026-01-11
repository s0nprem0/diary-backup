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
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const isEditing = !!existing;
  const initialNotes = existing?.notes || '';

  // Auto-detect mood from notes content (for new entries only)
  useEffect(() => {
    if (!isEditing && notes.trim()) {
      const { mood: predictedMood } = inferMood(notes);
      setMood(predictedMood);
      setIsAutoDetected(true);
    }
  }, [notes, isEditing]);

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

    // Local-first: save to SQLite immediately (don't wait for haptics or API)
    try {
      if (isEditing) {
        // Update locally immediately
        await updateEntry(existing.id, { notes, mood, synced: false });
      } else {
        // Create locally immediately
        const date = new Date().toISOString();
        await addEntry({ date, mood, notes }, false);
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

      // Haptics: fire-and-forget (don't await)
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        /* ignore haptics errors */
      }

      // Sync to remote in background (don't wait)
      const token = await mobileAuthService.getToken();
      const date = isEditing ? existing.date : new Date().toISOString();

      if (isEditing && existing?.remoteId) {
        // Background PATCH
        fetch(`${ENTRIES_API}/${existing.remoteId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ notes, mood, date }),
        })
          .then(res => {
            if (res.ok && isEditing) {
              updateEntry(existing.id, { synced: true });
            }
          })
          .catch(() => {
            // Sync failed, will retry on next app launch
          });
      } else if (!isEditing) {
        // Background POST for new entry
        fetch(ENTRIES_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ notes: notes || '', mood, date }),
        })
          .then(res => res.json())
          .then(remote => {
            // We'll update sync status in the background
          })
          .catch(() => {
            // Sync failed, will retry on next app launch
          });
      }
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Save failed', 'Could not save entry locally');
      console.error('Save error:', error);
    }
  };

  return (
    <>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
            {isEditing ? 'Edit Entry' : 'How are you feeling?'}
          </Text>

          {/* Mood Display */}
          <View style={{ marginBottom: 20 }}>
            <Text variant="labelLarge" style={{ marginBottom: 12, color: colors.onSurface }}>
              Detected mood
            </Text>
            <View style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>
                {getMoodEmoji(mood)}
              </Text>
              <Text variant="titleLarge" style={{ color: colors.onPrimary }}>
                {mood}
              </Text>
              <Text variant="labelSmall" style={{ color: colors.onPrimary, marginTop: 4, opacity: 0.8 }}>
                Based on your entry
              </Text>
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
