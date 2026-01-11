import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, useTheme, Card, ProgressBar } from 'react-native-paper';
import { getEntries } from '../services/entriesService';
import { getMoodEmoji } from '../services/moodUtils';

export default function InsightsScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const { colors } = useTheme();

  useEffect(() => {
    (async () => setEntries(await getEntries()))();
  }, []);

  // Calculate mood counts and percentages
  const getMoodStats = () => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
    });
    return counts;
  };

  // Calculate streak
  const getStreakInfo = () => {
    if (entries.length === 0) return { streak: 0, streakDate: null };

    let streak = 1;
    for (let i = 1; i < entries.length; i++) {
      const prevDate = new Date(entries[i - 1].date).toDateString();
      const currDate = new Date(entries[i].date).toDateString();

      if (prevDate === currDate) {
        streak++;
      } else {
        break;
      }
    }

    return { streak, latestDate: new Date(entries[0].date).toLocaleDateString() };
  };

  const moodStats = getMoodStats();
  const streakInfo = getStreakInfo();
  const totalEntries = entries.length;
  const totalMoods = Object.keys(moodStats).length;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text variant="headlineMedium" style={{ marginBottom: 20 }}>
        Insights
      </Text>

      {totalEntries === 0 ? (
        <Card style={{ backgroundColor: colors.surfaceVariant, padding: 24 }}>
          <Text variant="titleLarge" style={{ color: colors.onSurface, marginBottom: 8 }}>
            📊 No data yet
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            Start journaling to see your mood patterns and trends.
          </Text>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <Card style={[styles.statCard, { flex: 1, backgroundColor: colors.surfaceVariant }]}>
              <Text variant="displaySmall" style={{ color: colors.primary, marginBottom: 4 }}>
                {totalEntries}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                Total entries
              </Text>
            </Card>
            <Card style={[styles.statCard, { flex: 1, backgroundColor: colors.surfaceVariant }]}>
              <Text variant="displaySmall" style={{ color: colors.primary, marginBottom: 4 }}>
                {totalMoods}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                Mood types
              </Text>
            </Card>
          </View>

          {/* Mood Distribution */}
          <Text variant="titleMedium" style={{ marginBottom: 12, marginTop: 12, color: colors.onSurface }}>
            Mood Distribution
          </Text>
          {Object.entries(moodStats)
            .sort((a, b) => b[1] - a[1])
            .map(([mood, count]) => {
              const percentage = (count / totalEntries) * 100;
              return (
                <View key={mood} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text variant="bodyMedium" style={{ color: colors.onSurface }}>
                      {getMoodEmoji(mood)} {mood}
                    </Text>
                    <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
                      {count} ({percentage.toFixed(0)}%)
                    </Text>
                  </View>
                  <ProgressBar
                    progress={percentage / 100}
                    color={colors.primary}
                    style={{ height: 8, borderRadius: 4 }}
                  />
                </View>
              );
            })}

          {/* Latest Activity */}
          <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.outlineVariant }}>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: colors.onSurface }}>
              📅 Latest
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurface }}>
              Last entry: <Text style={{ fontWeight: 'bold' }}>{streakInfo.latestDate}</Text>
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statCard: { padding: 16, borderRadius: 12 },
});


