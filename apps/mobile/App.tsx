import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  FlatList, SafeAreaView, Platform, KeyboardAvoidingView, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// ---------------------------------------------------------
// 🔧 CONFIGURATION: YOUR API URL
// ---------------------------------------------------------
// Android Emulator uses 10.0.2.2 to access localhost
// iOS Simulator uses localhost
// Physical Device? Use your PC's LAN IP (e.g., http://192.168.1.50:3001)
const API_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3001/entries'
  : 'http://localhost:3001/entries';

interface Entry {
  _id: string;
  content: string;
  mood: string;
  sentimentScore: number;
  createdAt: string;
}

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Fetch Entries
  const fetchEntries = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setEntries(data);
    } catch (error) {
      console.log('Error fetching:', error);
      // Fail silently on UI for now, or show an alert
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // 2. Submit Entry
  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      const newEntry = await res.json();

      setEntries([newEntry, ...entries]);
      setText('');
      // Dismiss keyboard logic could go here
    } catch (error) {
      Alert.alert("Error", "Could not save entry. Is the server running?");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper for Mood Colors
  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Happy': return '#dcfce7'; // green-100
      case 'Good': return '#dbeafe'; // blue-100
      case 'Sad': return '#fce7f3'; // pink-100
      case 'Bad': return '#fee2e2'; // red-100
      default: return '#f3f4f6'; // gray-100
    }
  };

  const renderItem = ({ item }: { item: Entry }) => (
    <View style={[styles.card, { backgroundColor: getMoodColor(item.mood) }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.moodText}>{item.mood}</Text>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.contentText}>{item.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <View style={styles.header}>
          <Text style={styles.title}>📘 Mood Diary</Text>
        </View>

        {/* List of Entries */}
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="How are you feeling?"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "..." : "Save"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardContainer: { flex: 1 },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  listContent: { padding: 15 },
  card: { padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  moodText: { fontWeight: 'bold', fontSize: 16 },
  dateText: { color: '#666', fontSize: 12 },
  contentText: { fontSize: 14, lineHeight: 20, color: '#333' },
  inputContainer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fafafa' },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100 },
  button: { backgroundColor: '#000', borderRadius: 20, paddingHorizontal: 20, justifyContent: 'center', marginLeft: 10 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
