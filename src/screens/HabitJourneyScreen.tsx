import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Animated,
  Easing,
  Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';

interface StreakEntry {
  startDate: string;
  endDate: string;
  durationMs: number;
}

interface HabitJourneyState {
  habitId: string;
  habitName: string;
  emoji: string;
  currentStreakStartTime: number;
  streakHistory: StreakEntry[];
  lastSavedTime: number;
}

const STORAGE_KEY_PREFIX = 'habitJourney_';

export const HabitJourneyScreen: React.FC<{
  habitId: string;
  habitName: string;
  emoji: string;
  onClose: () => void;
}> = ({ habitId, habitName, emoji, onClose }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [journeyState, setJourneyState] = useState<HabitJourneyState | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showRelapseModal, setShowRelapseModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMilestoneRef = useRef(0);

  const STORAGE_KEY = `${STORAGE_KEY_PREFIX}${habitId}`;

  useEffect(() => {
    loadJourneyData();
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!journeyState) return;

    // Start the pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Timer interval
    timerIntervalRef.current = setInterval(() => {
      setElapsedMs(prev => {
        const newElapsed = prev + 1000;
        checkMilestones(newElapsed);
        saveJourneyDataThrottled(newElapsed);
        return newElapsed;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [journeyState]);

  const checkMilestones = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    if (hours > lastMilestoneRef.current && hours > 0) {
      lastMilestoneRef.current = hours;
      Vibration.vibrate([50, 50, 50]);
    }
  };

  const loadJourneyData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: HabitJourneyState = JSON.parse(stored);
        setJourneyState(state);
        
        // Calculate elapsed time from last saved time
        const now = Date.now();
        const elapsed = now - state.currentStreakStartTime;
        setElapsedMs(elapsed);
        lastMilestoneRef.current = Math.floor(elapsed / 3600000);
      } else {
        // Create new journey
        const newState: HabitJourneyState = {
          habitId,
          habitName,
          emoji,
          currentStreakStartTime: Date.now(),
          streakHistory: [],
          lastSavedTime: Date.now(),
        };
        setJourneyState(newState);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      }
    } catch (error) {
      console.error('Error loading journey data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveJourneyDataThrottled = async (elapsed: number) => {
    if (!journeyState) return;
    
    // Save every 10 seconds to avoid excessive writes
    if (elapsed % 10000 === 0) {
      const updated = {
        ...journeyState,
        lastSavedTime: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const handleRelapse = async () => {
    if (!journeyState) return;

    const now = Date.now();
    const streakDuration = now - journeyState.currentStreakStartTime;
    const startDate = new Date(journeyState.currentStreakStartTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const endDate = new Date(now).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const newEntry: StreakEntry = {
      startDate,
      endDate,
      durationMs: streakDuration,
    };

    const updated: HabitJourneyState = {
      ...journeyState,
      streakHistory: [newEntry, ...journeyState.streakHistory],
      currentStreakStartTime: now,
    };

    setJourneyState(updated);
    setElapsedMs(0);
    lastMilestoneRef.current = 0;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setShowRelapseModal(false);

    Vibration.vibrate([100, 50, 100]);
  };

  if (loading || !journeyState) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading your journey...</Text>
      </View>
    );
  }

  const formatDuration = (ms: number): { days: number; hours: number; minutes: number; seconds: number } => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
  };

  const getStreakColor = () => {
    const hours = Math.floor(elapsedMs / 3600000);
    if (hours >= 24) return '#10b981'; // Green for 1+ days
    if (hours >= 6) return '#f59e0b'; // Orange for 6+ hours
    return '#6366f1'; // Blue for < 6 hours
  };

  const getBestStreak = (): { durationMs: number; display: string } | null => {
    if (journeyState.streakHistory.length === 0) return null;
    const best = journeyState.streakHistory.reduce((prev, current) =>
      current.durationMs > prev.durationMs ? current : prev
    );
    const duration = formatDuration(best.durationMs);
    const display = `${duration.days}d ${duration.hours}h ${duration.minutes}m`;
    return { durationMs: best.durationMs, display };
  };

  const duration = formatDuration(elapsedMs);
  const bestStreak = getBestStreak();
  const timerString = `${String(duration.days).padStart(2, '0')}:${String(duration.hours).padStart(2, '0')}:${String(
    duration.minutes
  ).padStart(2, '0')}:${String(duration.seconds).padStart(2, '0')}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.backButton}>{t.habit_journey_screen.backButton || "← Back"}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.habit_journey_screen.myJourney || "🏆 My Journey"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
        {/* Habit Name */}
  <Text style={[styles.habitName, { color: colors.textSecondary }]}>{t.habit_journey_screen.conquering}</Text>
  <Text style={[styles.habitTitle, { color: colors.text }]}>{habitName}</Text>

        {/* Flip Card Timer */}
        <View style={styles.timerContainer}>
          {/* Emoji and Habit Name at Top */}
          <Text style={styles.emojiDisplay}>{emoji}</Text>
          
          {/* Flip Card Grid - One Line */}
          <View style={styles.flipCardGrid}>
            {/* Days Card */}
            <Animated.View style={[styles.flipCard, { backgroundColor: getStreakColor(), transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.flipCardNumber}>{String(duration.days).padStart(2, '0')}</Text>
              <Text style={styles.flipCardLabel}>{t.habit_journey_screen.days}</Text>
            </Animated.View>

            {/* Hours Card */}
            <Animated.View style={[styles.flipCard, { backgroundColor: getStreakColor(), transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.flipCardNumber}>{String(duration.hours).padStart(2, '0')}</Text>
              <Text style={styles.flipCardLabel}>{t.habit_journey_screen.hours}</Text>
            </Animated.View>

            {/* Minutes Card */}
            <Animated.View style={[styles.flipCard, { backgroundColor: getStreakColor(), transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.flipCardNumber}>{String(duration.minutes).padStart(2, '0')}</Text>
              <Text style={styles.flipCardLabel}>{t.habit_journey_screen.minutes}</Text>
            </Animated.View>

            {/* Seconds Card */}
            <Animated.View style={[styles.flipCard, { backgroundColor: getStreakColor(), transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.flipCardNumber}>{String(duration.seconds).padStart(2, '0')}</Text>
              <Text style={styles.flipCardLabel}>{t.habit_journey_screen.seconds}</Text>
            </Animated.View>
          </View>

          {/* Milestone Message with Animation */}
          {duration.days > 0 && (
            <Text style={[styles.milestoneText, { color: '#10b981' }]}>
              {t.habit_journey_screen.strongMessage
                ? t.habit_journey_screen.strongMessage.replace('{days}', String(duration.days)).replace('{s}', duration.days > 1 ? 's' : '')
                : `🎉 ${duration.days} Day${duration.days > 1 ? 's' : ''} Strong!`}
            </Text>
          )}
          {duration.hours >= 6 && duration.days === 0 && (
            <Text style={[styles.milestoneText, { color: '#f59e0b' }]}>
              {t.habit_journey_screen.hoursMessage
                ? t.habit_journey_screen.hoursMessage.replace('{hours}', String(duration.hours))
                : `💪 ${duration.hours}+ Hours!`}
            </Text>
          )}
        </View>

        {/* Relapse Button */}
        <TouchableOpacity
          style={[styles.relapseButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowRelapseModal(true)}
        >
          <Text style={[styles.relapseButtonText, { color: '#ef4444' }]}>{t.habit_journey_screen.relapseButton || "😔 I Relapsed"}</Text>
        </TouchableOpacity>

        {/* Journey History - Best & Worst Only */}
        <View style={styles.historySection}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>{t.habit_journey_screen.historyTitle}</Text>

          {journeyState.streakHistory.length === 0 ? (
            <View style={[styles.emptyHistory, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyHistoryText, { color: colors.textSecondary }]}>
                {t.habit_journey_screen.emptyHistory || "Your journey just started! ✨"}
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {(() => {
                // Get best and worst streaks
                let best: StreakEntry | null = null;
                let worst: StreakEntry | null = null;
                
                journeyState.streakHistory.forEach(entry => {
                  if (!best || entry.durationMs > best.durationMs) best = entry;
                  if (!worst || entry.durationMs < worst.durationMs) worst = entry;
                });

                const streaks = [];
                if (best) streaks.push({ entry: best, type: 'best' });
                if (worst && worst !== best) streaks.push({ entry: worst, type: 'worst' });

                return streaks.map(({ entry, type }, idx) => {
                  const duration = formatDuration(entry.durationMs);
                  const isBest = type === 'best';
                  
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.historyItem,
                        {
                          backgroundColor: colors.surface,
                          borderColor: isBest ? '#10b981' : '#ef4444',
                        },
                      ]}
                    >
                      <View style={styles.historyItemLeft}>
                        <Text style={[styles.historyDate, { color: colors.text }]}>
                          {isBest ? t.habit_journey_screen.bestStreak : t.habit_journey_screen.worstRelapse}
                        </Text>
                        <Text style={[styles.historyDuration, { color: colors.textSecondary }]}>
                          {entry.startDate} → {entry.endDate}
                        </Text>
                        <Text style={[styles.historyTime, { color: isBest ? '#10b981' : '#ef4444', fontWeight: '700' }]}>
                          {duration.days}d {duration.hours}h {duration.minutes}m {duration.seconds}s
                        </Text>
                      </View>
                      <Text style={isBest ? styles.bestBadge : styles.worstBadge}>
                        {isBest ? '🏆' : '⚠️'}
                      </Text>
                    </View>
                  );
                });
              })()}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Relapse Modal */}
      <Modal visible={showRelapseModal} transparent animationType="fade" onRequestClose={() => setShowRelapseModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.habit_journey_screen.resetYourJourney || "Reset Your Journey?"}</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {t.habit_journey_screen.resetDescription || "This will end your current streak and start a new one. Your previous streak will be saved to your history."}
            </Text>

            <View style={styles.modalButtonGroup}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowRelapseModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>{t.habit_journey_screen.keepGoing || "No, Keep Going 💪"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ef4444' }]}
                onPress={handleRelapse}
              >
                <Text style={styles.modalButtonTextDanger}>{t.habit_journey_screen.yesReset || "Yes, Reset"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const StatCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <View style={[styles.statCard, { backgroundColor: color + '15', borderColor: color }]}>
    <Text style={[styles.statLabel, { color }]}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
  habitName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.7,
  },
  habitTitle: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: -0.8,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  flipCardGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 20,
  },
  flipCard: {
    width: '20%',
    minWidth: 68,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  flipCardNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  flipCardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  circleBackground: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  emojiDisplay: {
    fontSize: 60,
    marginBottom: 12,
  },
  timerText: {
    fontSize: 36,
    fontWeight: '900',
    fontFamily: 'Courier New',
    letterSpacing: 2,
    textAlign: 'center',
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  milestoneText: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  relapseButton: {
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2.5,
    alignItems: 'center',
    marginBottom: 36,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  relapseButtonText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  historySection: {
    marginTop: 12,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 18,
    letterSpacing: -0.4,
  },
  emptyHistory: {
    paddingVertical: 36,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyHistoryText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  historyList: {
    gap: 14,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  historyDuration: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyTime: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  bestBadge: {
    fontSize: 22,
    marginLeft: 8,
  },
  worstBadge: {
    fontSize: 22,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 28,
    width: '85%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 14,
    letterSpacing: -0.4,
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
    fontWeight: '500',
  },
  modalButtonGroup: {
    gap: 12,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalButtonTextDanger: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
