import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useApp } from '../contexts/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Line as SvgLine, Circle as SvgCircle, G } from 'react-native-svg';

interface DailyHydration {
  date: string;
  intake: number;
  goal: number;
}

const HydrationStatsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { userSettings, isRTL } = useApp();
  const [weeklyData, setWeeklyData] = useState<DailyHydration[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadWeeklyData();
  }, [selectedPeriod]);

  const loadWeeklyData = async () => {
    try {
      // Load historical data from AsyncStorage
      const dailyHistoryKey = '@nudgepal_hydration_history';
      const storedData = await AsyncStorage.getItem('@nudgepal_hydration_data');
      const storedHistory = await AsyncStorage.getItem(dailyHistoryKey);
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        let historyData: { [key: string]: number } = {};
        
        if (storedHistory) {
          try {
            historyData = JSON.parse(storedHistory);
          } catch (e) {
            console.log('History data not available yet');
          }
        }
        
        // Generate data for the selected period
        const data: DailyHydration[] = [];
        const daysToShow = selectedPeriod === 'week' ? 7 : 30;
        
        for (let i = daysToShow - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          // Get actual intake from history or 0 if not logged
          const actualIntake = historyData[dateKey] || 0;
          
          data.push({
            date: date.toLocaleDateString('en-US', { 
              weekday: 'short' as const,
            }),
            intake: actualIntake,
            goal: parsed.goal,
          });
        }
        
        setWeeklyData(data);
      }
    } catch (error) {
      console.error('Error loading weekly data:', error);
    }
  };

  const maxIntake = Math.max(...weeklyData.map((d) => d.intake), 3000);
  
  // Calculate statistics with proper formulas
  const totalIntake = weeklyData.reduce((sum, d) => sum + d.intake, 0);
  const avgIntakePerDay = weeklyData.length > 0 ? totalIntake / weeklyData.length : 0;
  const completedDays = weeklyData.filter((d) => d.intake >= d.goal).length;
  const goalMetPercentage = weeklyData.length > 0 ? (completedDays / weeklyData.length) * 100 : 0;
  
  // Consistency score: average progress for the period
  const progressScores = weeklyData.map((d) => Math.min((d.intake / d.goal) * 100, 100));
  const consistencyScore = progressScores.length > 0 
    ? progressScores.reduce((a, b) => a + b, 0) / progressScores.length 
    : 0;

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40;
  const chartHeight = 250;

  const getChartPoint = (index: number, value: number) => {
    const x = (index / (weeklyData.length - 1 || 1)) * chartWidth;
    const y = chartHeight - (value / maxIntake) * chartHeight;
    return { x, y };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#e0f7ff', '#b3e5fc', '#81d4ff']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={[styles.header, isRTL && styles.rtlHeader]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, isRTL && styles.rtlText]}>
            📈 Weekly Insights
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>💧</Text>
              <Text style={styles.statValue}>
                {(avgIntakePerDay / 1000).toFixed(2)}L
              </Text>
              <Text style={styles.statLabel}>Average</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={styles.statValue}>{completedDays}/{weeklyData.length}</Text>
              <Text style={styles.statLabel}>Goals Met</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🎯</Text>
              <Text style={styles.statValue}>
                {Math.round(consistencyScore)}%
              </Text>
              <Text style={styles.statLabel}>Consistency</Text>
            </View>
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'week' && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'week' && styles.periodButtonTextActive,
                ]}
              >
                This Week
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'month' && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'month' && styles.periodButtonTextActive,
                ]}
              >
                This Month
              </Text>
            </TouchableOpacity>
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Daily Intake</Text>
            
            <View style={styles.chartWrapper}>
              <Svg width={chartWidth} height={chartHeight}>
                {/* Grid lines */}
                <SvgLine
                  x1="0"
                  y1={chartHeight * 0.25}
                  x2={chartWidth}
                  y2={chartHeight * 0.25}
                  stroke="rgba(106, 169, 233, 0.1)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <SvgLine
                  x1="0"
                  y1={chartHeight * 0.5}
                  x2={chartWidth}
                  y2={chartHeight * 0.5}
                  stroke="rgba(106, 169, 233, 0.1)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <SvgLine
                  x1="0"
                  y1={chartHeight * 0.75}
                  x2={chartWidth}
                  y2={chartHeight * 0.75}
                  stroke="rgba(106, 169, 233, 0.1)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />

                {/* Data points */}
                {weeklyData.map((d, i) => {
                  const point = getChartPoint(i, d.intake);
                  const isMetGoal = d.intake >= d.goal;
                  return (
                    <SvgCircle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r={isMetGoal ? 6 : 4}
                      fill={isMetGoal ? '#4caf50' : '#06b6d4'}
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* Connect points with lines */}
                {weeklyData.length > 1 && (
                  <G>
                    {weeklyData.map((d, i) => {
                      if (i === 0) return null;
                      const p1 = getChartPoint(i - 1, weeklyData[i - 1].intake);
                      const p2 = getChartPoint(i, d.intake);
                      return (
                        <SvgLine
                          key={`line-${i}`}
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke="#06b6d4"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </G>
                )}
              </Svg>

              {/* X-axis labels */}
              <View style={styles.chartLabels}>
                {weeklyData.map((d, i) => (
                  <View key={i} style={styles.chartLabel}>
                    <Text style={styles.chartLabelText}>{d.date}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Daily Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.detailsTitle}>Daily Breakdown</Text>

            {weeklyData.map((d, i) => {
              const percentage = Math.min((d.intake / d.goal) * 100, 100);
              const isMetGoal = d.intake >= d.goal;
              return (
                <View key={i} style={styles.detailRow}>
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailDate}>{d.date}</Text>
                    <View style={styles.detailBar}>
                      <View
                        style={[
                          styles.detailBarFill,
                          {
                            width: `${percentage}%`,
                            backgroundColor: isMetGoal ? '#4caf50' : '#06b6d4',
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.detailAmount}>
                    {Math.round(d.intake)}ml
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Weekly Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📊 This Week</Text>
            <Text style={styles.summaryText}>
              You averaged {(avgIntakePerDay / 1000).toFixed(2)}L per day — {
                avgIntakePerDay >= (weeklyData[0]?.goal || 2500)
                  ? 'nice flow 🌊'
                  : 'keep it up 💪'
              }
            </Text>
            <Text style={styles.summarySubtext}>
              Goal met {completedDays} out of {weeklyData.length} days
            </Text>
          </View>

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Hydration Tips</Text>

            <View style={styles.tip}>
              <Text style={styles.tipEmoji}>🌅</Text>
              <Text style={styles.tipText}>
                Start your day with a glass of water to kickstart your hydration.
              </Text>
            </View>

            <View style={styles.tip}>
              <Text style={styles.tipEmoji}>⏰</Text>
              <Text style={styles.tipText}>
                Set reminders every 2 hours to maintain consistent hydration.
              </Text>
            </View>

            <View style={styles.tip}>
              <Text style={styles.tipEmoji}>🍵</Text>
              <Text style={styles.tipText}>
                Herbal tea and fresh fruits also contribute to your daily intake.
              </Text>
            </View>
          </View>

          <View style={styles.footerSpace} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(129, 212, 255, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(129, 212, 255, 0.2)',
  },
  rtlHeader: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#006b7a',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#006b7a',
  },
  rtlText: {
    textAlign: 'right',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006b7a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6aa9e9',
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: '#6aa9e9',
  },
  periodButtonActive: {
    backgroundColor: '#06b6d4',
    borderColor: '#06b6d4',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6aa9e9',
    textAlign: 'center',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#006b7a',
    marginBottom: 16,
  },
  chartWrapper: {
    alignItems: 'center',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: Dimensions.get('window').width - 40,
    marginTop: 8,
    paddingHorizontal: 0,
  },
  chartLabel: {
    alignItems: 'center',
  },
  chartLabelText: {
    fontSize: 11,
    color: '#6aa9e9',
    fontWeight: '500',
  },
  detailsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#006b7a',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailInfo: {
    flex: 1,
    marginRight: 12,
  },
  detailDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006b7a',
    marginBottom: 6,
  },
  detailBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  detailBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  detailAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006b7a',
    minWidth: 50,
    textAlign: 'right',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#006b7a',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#006b7a',
    lineHeight: 20,
    marginBottom: 8,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#6aa9e9',
  },
  tipsSection: {
    backgroundColor: 'rgba(106, 169, 233, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#06b6d4',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#006b7a',
    marginBottom: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipEmoji: {
    fontSize: 18,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#006b7a',
    lineHeight: 18,
  },
  footerSpace: {
    height: 20,
  },
});

export default HydrationStatsScreen;
