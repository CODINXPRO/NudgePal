import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';

interface StatsScreenProps {
  onMenuPress: () => void;
  onProfilePress: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  onMenuPress,
  onProfilePress,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [weeklyStats, setWeeklyStats] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const habitsData = await AsyncStorage.getItem('habits');
      const habits = habitsData ? JSON.parse(habitsData) : [];

      // Calculate weekly stats
      const today = new Date();
      const weekStats = [0, 0, 0, 0, 0, 0, 0];
      let totalCount = 0;

      habits.forEach((habit: any) => {
        if (habit.completedDates) {
          totalCount += habit.completedDates.length;
          
          habit.completedDates.forEach((dateStr: string) => {
            const completionDate = new Date(dateStr);
            const daysDiff = Math.floor((today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff >= 0 && daysDiff < 7) {
              const dayIndex = 6 - daysDiff; // 0 = today, 6 = 7 days ago
              weekStats[dayIndex]++;
            }
          });
        }
      });

      // Calculate streak (simplified)
      let currentStreak = 0;
      for (let i = 0; i < 7; i++) {
        if (weekStats[i] > 0) {
          currentStreak++;
        } else {
          break;
        }
      }

      setWeeklyStats(weekStats);
      setTotalCompleted(totalCount);
      setStreak(currentStreak);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const maxHeight = Math.max(...weeklyStats, 1) || 1;
  const dayLabels = [t.stats_screen.monday, t.stats_screen.tuesday, t.stats_screen.wednesday, t.stats_screen.thursday, t.stats_screen.friday, t.stats_screen.saturday, t.stats_screen.sunday];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: insets.top,
          },
        ]}
      >
        <TouchableOpacity onPress={onMenuPress} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: colors.text }]}>
            ☰
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.stats_screen.title}
        </Text>
        <TouchableOpacity onPress={onProfilePress} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: colors.text }]}>
            👤
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={styles.summaryEmoji}>🔥</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: colors.warning },
              ]}
            >
              {streak}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Day Streak
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={styles.summaryEmoji}>✓</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: colors.primary },
              ]}
            >
              {totalCompleted}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Total Completed
            </Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.chartSection}>
          <Text
            style={[
              styles.chartTitle,
              { color: colors.text },
            ]}
          >
            This Week's Progress
          </Text>
          <View
            style={[
              styles.chartContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.chart}>
              {weeklyStats.map((value, index) => {
                const height = (value / maxHeight) * 150 + 30; // Min height of 30
                return (
                  <View key={index} style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.barLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {dayLabels[index]}
                    </Text>
                    {value > 0 && (
                      <Text
                        style={[
                          styles.barValue,
                          { color: colors.text },
                        ]}
                      >
                        {value}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text
            style={[
              styles.tipTitle,
              { color: colors.text },
            ]}
          >
            💡 Tips for Success
          </Text>
          <View
            style={[
              styles.tipCard,
              {
                backgroundColor: colors.surface,
                borderLeftColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.tipText, { color: colors.text }]}>
              • Start with small, achievable habits
            </Text>
          </View>
          <View
            style={[
              styles.tipCard,
              {
                backgroundColor: colors.surface,
                borderLeftColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.tipText, { color: colors.text }]}>
              • Build a streak to stay motivated
            </Text>
          </View>
          <View
            style={[
              styles.tipCard,
              {
                backgroundColor: colors.surface,
                borderLeftColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.tipText, { color: colors.text }]}>
              • Track your progress consistently
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  summaryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartSection: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: '70%',
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipCard: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
