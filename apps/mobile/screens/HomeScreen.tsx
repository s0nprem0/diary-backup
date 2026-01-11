import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  FlatList, SafeAreaView, Platform, KeyboardAvoidingView, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { ENTRIES_API } from '../config'; // Import shared config

interface Entry {
  _id: string;
  content: string;
  mood: string;
  sentimentScore: number;
  createdAt: string;
}

export default function HomeScreen({ navigation }: any) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Fetch Entries with Token
  const fetchEntries = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const res = await fetch(ENTRIES_API, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        await SecureStore.deleteItemAsync('token');
        navigation.replace('Login');
        return;
      }

      const data = await res.json();
      setEntries(data);
    } catch (error) {
      console.log('Error fetching:', error);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // 2. Submit Entry with Token
  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(ENTRIES_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: text }),
      });

      const newEntry = await res.json();
      setEntries([newEntry, ...entries]);
      setText('');
    } catch (error) {
      Alert.alert("Error", "Could not save entry.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    navigation.replace('Login');
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Happy': return '#dcfce7';
      case 'Good': return '#dbeafe';
      case 'Sad': return '#fce7f3';
      case 'Bad': return '#fee2e2';
      default: return '#f3f4f6';
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
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />

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
  header: { padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  title: { fontSize: 24, fontWeight: 'bold' },
  logoutButton: { position: 'absolute', right: 20, top: 55 },
  logoutText: { color: 'red', fontWeight: '600' },
  listContent: { padding: 15 },
  card: { padding: 15, borderRadius: 12, marginBottom: 10 },
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
