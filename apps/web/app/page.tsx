"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Entry {
  _id: string;
  content: string;
  mood: string;
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    // Fetch entries (no auth required)
    fetch("http://localhost:3001/entries")
      .then((res) => res.json())
      .then((data) => setEntries(data))
      .catch((err) => console.error("Failed to fetch entries:", err));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: text }),
      });

      const newEntry = await res.json();
      setEntries([newEntry, ...entries]);
      setText("");
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setLoading(false);
    }
  };

  // No auth required

  // Helper for colors
  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "Happy": return "bg-green-100 border-green-300";
      case "Good": return "bg-blue-100 border-blue-300";
      case "Sad": return "bg-pink-100 border-pink-300";
      case "Bad": return "bg-red-100 border-red-300";
      default: return "bg-gray-100 border-gray-300";
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">📘 Mood Diary</h1>
        {/* auth removed: logout not needed */}
      </div>

      <form onSubmit={handleSubmit} className="mb-8 gap-4 flex flex-col">
        <textarea
          className="w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-black"
          rows={4}
          placeholder="How was your day?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          disabled={loading}
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
              <span className="text-sm text-gray-500">
                {new Date(entry.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700">{entry.content}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
