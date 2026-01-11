import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import MoodPicker from '../components/MoodPicker';
import MoodSlider from '../components/MoodSlider';
import { addEntry } from '../services/entriesService';
import * as Haptics from 'expo-haptics';

export default function AddEntryScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [mood, setMood] = useState('good');
  const [intensity, setIntensity] = useState(70);
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addEntry({ date: new Date().toISOString(), mood, intensity, notes });
    navigation.navigate('Home');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Text variant="headlineSmall" style={{ marginBottom: 8 }}>How are you feeling?</Text>
        <MoodPicker value={mood} onChange={setMood} />
        <MoodSlider value={intensity} onChange={setIntensity} />
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
