import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  FlatList, SafeAreaView, Platform, KeyboardAvoidingView, Alert,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ENTRIES_API } from '../config';

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
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEntries = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setFetching(true);

      const res = await fetch(ENTRIES_API);

      // 🔴 IMPROVEMENT: Read the error message if status is not 200
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch entries");
      }

      setEntries(data);
    } catch (error: any) {
      console.log('Error fetching:', error);
      // Only alert if it's not a common auth redirect
      if (error.message !== "Failed to fetch entries") {
          Alert.alert("Error", error.message);
      }
    } finally {
      setFetching(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEntries(true);
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(ENTRIES_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: text }),
      });

      // 🔴 IMPROVEMENT: Read the JSON error response from the server!
      const data = await res.json();

      if (!res.ok) {
        // This will now show "Content is required" or other specific server errors
        throw new Error(data.error || "Server rejected the request");
      }

      setEntries([data, ...entries]);
      setText('');
    } catch (error: any) {
      Alert.alert("Submission Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // auth removed — no-op
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
          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

        {fetching && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <FlatList
            data={entries}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={entries.length === 0 ? styles.listContentEmpty : styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No entries yet.</Text>
                <Text style={styles.emptySubtext}>Write about your day below!</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="How are you feeling?"
            value={text}
            onChangeText={setText}
            multiline
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={[styles.button, (loading || !text.trim()) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !text.trim()}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Save</Text>}
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
  header: {
    padding: 20, paddingTop: 60, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    zIndex: 10
  },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  logoutButton: { position: 'absolute', right: 20, top: 65 },
  logoutText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listContent: { padding: 15, paddingBottom: 100 },
  listContentEmpty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  emptySubtext: { fontSize: 14, color: '#666' },

  card: { padding: 15, borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  moodText: { fontWeight: '700', fontSize: 16, textTransform: 'uppercase', opacity: 0.8 },
  dateText: { color: '#666', fontSize: 12, fontWeight: '500' },
  contentText: { fontSize: 15, lineHeight: 22, color: '#1f2937' },

  inputContainer: { flexDirection: 'row', padding: 15, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff' },
  input: { flex: 1, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 12, maxHeight: 100, fontSize: 16 },
  button: { backgroundColor: '#000', borderRadius: 25, paddingHorizontal: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 10, height: 50 },
  buttonDisabled: { opacity: 0.5, backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
