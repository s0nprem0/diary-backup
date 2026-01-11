"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { authService } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Entry {
  _id: string;
  content: string;
  mood: string;
  createdAt: string;
}

export default function Home() {
  const { logout } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchEntries = async () => {
    try {
      const res = await fetch(`${API_URL}/entries`);
      if (!res.ok) throw new Error("Failed to fetch entries");
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error("Failed to fetch entries:", err);
      setError("Failed to load entries");
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Optimistic update: save locally first, show UI immediately
    const optimisticEntry: Entry = {
      _id: `temp_${Date.now()}`,
      content: text,
      mood: "Neutral",
      createdAt: new Date().toISOString(),
    };

    setEntries([optimisticEntry, ...entries]);
    setText("");
    setLoading(true);
    setError("");

    try {
      const token = authService.getToken();
      const res = await fetch(`${API_URL}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          content: text,
          date: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        // Remove optimistic entry on failure
        setEntries(entries.filter(e => e._id !== optimisticEntry._id));
        throw new Error(errorData.error || "Failed to save entry");
      }

      const newEntry = await res.json();
      // Replace optimistic entry with real entry
      setEntries(current =>
        current.map(e => e._id === optimisticEntry._id ? newEntry : e)
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error saving entry";
      console.error("Error saving:", error);
      setError(message);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const token = authService.getToken();
      const res = await fetch(`${API_URL}/entries/${id}`, {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!res.ok) throw new Error("Failed to delete entry");
      setEntries(entries.filter((e) => e._id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
      setError("Failed to delete entry");
    }
  };

  // Helper for colors
  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "Happy": return "bg-green-100 border-green-300";
      case "Excited": return "bg-yellow-100 border-yellow-300";
      case "Sad": return "bg-pink-100 border-pink-300";
      case "Anxious": return "bg-orange-100 border-orange-300";
      case "Tired": return "bg-purple-100 border-purple-300";
      default: return "bg-gray-100 border-gray-300";
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">📘 Mood Diary</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm"
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-8 gap-4 flex flex-col">
        <textarea
          className="w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-black"
          rows={4}
          placeholder="How was your day?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
        <button
          disabled={loading || !text.trim()}
          className="bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Analyzing..." : "Save Entry"}
        </button>
      </form>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry._id}
            className={`p-4 rounded-lg border shadow-sm ${getMoodColor(entry.mood)}`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-lg text-gray-800">{entry.mood}</span>
              <div className="flex gap-2">
                <span className="text-sm text-gray-500">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(entry._id)}
                  className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-gray-700">{entry.content}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
