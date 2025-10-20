import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Easing, Pressable, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { useBills } from '../contexts/BillsContext';
import { useTranslation } from '../hooks/useTranslation';
import { SharedHeader } from '../components/SharedHeader';

interface DashboardScreenProps {
  onMenuPress?: () => void;
  onProfilePress: () => void;
  onNavigateToReminders?: () => void;
}

interface Stats {
  habitsCompleted: number;
  totalHabits: number;
  billsDue: number;
  billsTotal: number;
  unpaidBills: number;
  streak: number;
  focusTime: number;
}

// Animated progress circle with smooth animation and scale effect
const ProgressCircle = ({ percentage, label, color, shouldAnimate }: any) => {
  const [animValue] = useState(new Animated.Value(0));
  const [scaleValue] = useState(new Animated.Value(0.8));
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (shouldAnimate) {
      // Scale animation - grows in
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Progress animation sequence:
      // 0% → 100% → back to user's actual percentage
      Animated.sequence([
        // Phase 1: Animate up to 100%
        Animated.timing(animValue, {
          toValue: 100,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        // Phase 2: Animate back down to user's actual percentage
        Animated.timing(animValue, {
          toValue: percentage * 100,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start();

      // Listener for updating display value
      const listener = animValue.addListener(({ value }) => {
        setDisplayValue(Math.round(value).toString());
      });

      return () => {
        animValue.removeListener(listener);
      };
    }
  }, [shouldAnimate, percentage]);

  // Calculate circle fill rotation (0-360deg)
  const rotation = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.circleColumn,
        {
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <View style={[styles.circleWrapper, { borderColor: `${color}30` }]}>
        {/* Background circle */}
        <View
          style={[
            styles.circleBackground,
            {
              borderColor: `${color}15`,
            },
          ]}
        />

        {/* Animated progress ring */}
        <Animated.View
          style={[
            styles.circleProgress,
            {
              borderTopColor: color,
              borderRightColor: color,
              borderBottomColor: `${color}20`,
              borderLeftColor: `${color}20`,
              transform: [{ rotate: rotation }],
            },
          ]}
        />

        {/* Center content */}
        <View style={styles.circleContent}>
          <Text
            style={[
              styles.percentText,
              {
                color,
              },
            ]}
          >
            {displayValue}%
          </Text>
          <Text style={[styles.circleSmallLabel, { color: `${color}80` }]}>
            {label}
          </Text>
        </View>
      </View>
      <Text style={[styles.circleLabel, { color }]}>{label}</Text>
    </Animated.View>
  );
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onMenuPress, onProfilePress, onNavigateToReminders }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { userSettings, isRTL } = useApp();
  const { t } = useTranslation();
  const { bills, refreshBills } = useBills();
  const [stats, setStats] = useState<Stats>({
    habitsCompleted: 0,
    totalHabits: 0,
    billsDue: 0,
    billsTotal: 0,
    unpaidBills: 0,
    streak: 0,
    focusTime: 150,
  });
  const [loading, setLoading] = useState(true);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  
  // Fade-in animations for sections
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [remindersAnim] = useState(new Animated.Value(0));
  const [remindersSlideAnim] = useState(new Animated.Value(30));
  
  // Tutorial popup animations
  const [showTutorialPopup, setShowTutorialPopup] = useState(false);
  const [popupScaleAnim] = useState(new Animated.Value(0));
  const [popupFadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(0));

  const loadDashboardData = async () => {
    try {
      const habitsData = await AsyncStorage.getItem('habits');
      const spendingData = await AsyncStorage.getItem('dailySpending_overspending');
      
      const habits = habitsData ? JSON.parse(habitsData) : [];
      const dailySpending = spendingData ? JSON.parse(spendingData) : {};
      
      // Calculate habits completion percentage
      // For each habit: checkInsCompleted / dailyCheckIns = percentage
      // Average all habit percentages
      let totalHabitPercentage = 0;
      let activeHabitsCount = 0;
      
      habits.forEach((habit: any) => {
        if (habit.enabled) {
          const habitPercentage = habit.dailyCheckIns > 0 
            ? (habit.checkInsCompleted / habit.dailyCheckIns) 
            : 0;
          totalHabitPercentage += Math.min(habitPercentage, 1); // Cap at 100%
          activeHabitsCount++;
        }
      });
      
      const avgHabitsPercentage = activeHabitsCount > 0 
        ? totalHabitPercentage / activeHabitsCount 
        : 0;
      
      // Calculate spending tracker percentage (last 7 days on budget)
      let daysOnBudget = 0;
      let totalDaysTracked = 0;
      const today = new Date();
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const spending = dailySpending[dateStr];
        
        if (spending) {
          totalDaysTracked++;
          // Count days that are "under" or "within_range" (not "over")
          if (spending.budgetStatus === 'under' || spending.budgetStatus === 'within_range') {
            daysOnBudget++;
          }
        }
      }
      
      const spendingPercentage = totalDaysTracked > 0 
        ? daysOnBudget / totalDaysTracked 
        : 0;
      
      // Combine habits and spending percentages (50/50 split)
      const combinedPercentage = (avgHabitsPercentage + spendingPercentage) / 2;
      
      // Calculate bills percentage (unpaid bills vs total bills)
      // A bill is considered paid if it has payment history entries
      const paidBills = bills.filter((b: any) => b.paymentHistory && b.paymentHistory.length > 0).length;
      const unpaidBillsCount = bills.length - paidBills;
      // Show percentage of UNPAID bills (100% = all unpaid/work to do, 0% = all paid/nothing to do)
      const billsPercentage = bills.length > 0 ? unpaidBillsCount / bills.length : 0;

      // Only log when bills change
      if (bills.length !== stats.billsTotal) {
        console.log(`📊 Bills updated: ${bills.length} total, ${unpaidBillsCount} unpaid`);
      }

      setStats({
        habitsCompleted: Math.round(combinedPercentage * 100),
        totalHabits: activeHabitsCount,
        billsDue: unpaidBillsCount,
        billsTotal: bills.length,
        unpaidBills: unpaidBillsCount,
        streak: 0,
        focusTime: 150,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Trigger animation only on first load
    setShouldAnimate(true);
    
    // Staggered fade-in animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    
    // Reminders section fades in slightly delayed
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(remindersAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(remindersSlideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);
  }, [bills]);

  const getDayName = () => {
    const dayNames = [t.dashboard_screen.sunday, t.dashboard_screen.monday, t.dashboard_screen.tuesday, t.dashboard_screen.wednesday, t.dashboard_screen.thursday, t.dashboard_screen.friday, t.dashboard_screen.saturday];
    return dayNames[new Date().getDay()];
  };

  const handleAddReminderPress = () => {
    // Navigate to calendar immediately
    onNavigateToReminders?.();

    // Show tutorial popup after navigation (delayed)
    setTimeout(() => {
      setShowTutorialPopup(true);
      
      // Smooth entrance animation - fade then scale
      Animated.sequence([
        Animated.timing(popupFadeAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(popupScaleAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.back(1.3)),
          useNativeDriver: true,
        }),
      ]).start();

      // Pulsing animation for tip box
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 300);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>{t.common.loading}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SharedHeader 
        title={t.dashboard_screen.title || 'Dashboard'} 
        onProfilePress={onProfilePress} 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <Text style={[styles.weatherLine, { color: colors.textSecondary }]}>
            ☀️ 24°C • {getDayName()}, Oct {new Date().getDate()}
          </Text>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {t.dashboard_screen.greeting2.replace('{name}', userSettings?.name || 'Friend')}
          </Text>
          <Text style={[styles.subtext, { color: colors.textSecondary }]}>
            {t.dashboard_screen.keepMomentum}
          </Text>

          <Animated.View
            style={[
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={[styles.circlesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 8 }]}>{t.dashboard_screen.yourProgress}</Text>
              <View style={styles.circlesContainer}>
                <ProgressCircle
                  percentage={stats.totalHabits > 0 ? stats.habitsCompleted / 100 : 0}
                  label={t.dashboard_screen.habits}
                  color="#10b981"
                  shouldAnimate={shouldAnimate}
                />
                <ProgressCircle
                  percentage={stats.billsTotal > 0 ? stats.billsDue / stats.billsTotal : 0}
                  label={t.dashboard_screen.bills}
                  color="#f59e0b"
                  shouldAnimate={shouldAnimate}
                />
              </View>
            </View>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            {
              opacity: remindersAnim,
              transform: [{ translateY: remindersSlideAnim }],
            },
          ]}
        >
          <View style={styles.remindersSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.dashboard_screen.reminders}</Text>
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={styles.emptyStateIcon}>✨</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {t.dashboard_screen.noEventsOrReminders}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.addReminderButton,
                  {
                    backgroundColor: colors.primary || '#6366f1',
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
                onPress={handleAddReminderPress}
              >
                <Text style={styles.addReminderButtonText}>{t.dashboard_screen.addReminder}</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <View
          style={[
            styles.motivationCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.motivationText, { color: colors.textSecondary }]}>
            {t.dashboard_screen.focus}
          </Text>
        </View>
      </ScrollView>

      {/* Tutorial Popup Modal */}
      <Modal
        visible={showTutorialPopup}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowTutorialPopup(false)}
      >
        <Animated.View style={[styles.popupOverlay, { opacity: popupFadeAnim }]}>
          <Animated.View
            style={[
              styles.popupContainer,
              {
                transform: [
                  { scale: popupScaleAnim },
                  {
                    translateY: popupScaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Header Section */}
            <View style={[styles.popupHeaderGradient, { backgroundColor: colors.primary }]}>
              <View style={styles.popupHeaderContent}>
                <View style={styles.popupIconContainer}>
                  <Text style={styles.popupIconBig}>📅</Text>
                </View>
                <Text style={styles.popupMainTitle}>{t.dashboard.quickReminderGuide}</Text>
                <Pressable
                  onPress={() => {
                    Animated.parallel([
                      Animated.timing(popupScaleAnim, {
                        toValue: 0,
                        duration: 250,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                      }),
                      Animated.timing(popupFadeAnim, {
                        toValue: 0,
                        duration: 250,
                        useNativeDriver: true,
                      }),
                    ]).start(() => {
                      setShowTutorialPopup(false);
                      popupScaleAnim.setValue(0);
                      popupFadeAnim.setValue(0);
                      pulseAnim.setValue(1);
                    });
                  }}
                  style={styles.popupCloseBtn}
                >
                  <Text style={styles.popupCloseBtnText}>✕</Text>
                </Pressable>
              </View>
            </View>

            {/* Content Section */}
            <View style={[styles.popupContentWrapper, { backgroundColor: colors.surface }]}>
              {/* Step 1 */}
              <View style={styles.popupStep}>
                <View style={[styles.popupStepBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.popupStepNumber}>1</Text>
                </View>
                <View style={styles.popupStepContent}>
                  <Text style={[styles.popupStepTitle, { color: colors.text }]}>{t.dashboard.selectDate}</Text>
                  <Text style={[styles.popupStepDesc, { color: colors.textSecondary }]}>
                    {t.dashboard.selectDateDescription}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={[styles.popupDivider, { backgroundColor: colors.border }]} />

              {/* Step 2 */}
              <View style={styles.popupStep}>
                <View style={[styles.popupStepBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.popupStepNumber}>2</Text>
                </View>
                <View style={styles.popupStepContent}>
                  <Text style={[styles.popupStepTitle, { color: colors.text }]}>{t.dashboard.fillDetails}</Text>
                  <Text style={[styles.popupStepDesc, { color: colors.textSecondary }]}>
                    {t.dashboard.fillDetailsDescription}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={[styles.popupDivider, { backgroundColor: colors.border }]} />

              {/* Step 3 */}
              <View style={styles.popupStep}>
                <View style={[styles.popupStepBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.popupStepNumber}>3</Text>
                </View>
                <View style={styles.popupStepContent}>
                  <Text style={[styles.popupStepTitle, { color: colors.text }]}>{t.dashboard.saveReminder}</Text>
                  <Text style={[styles.popupStepDesc, { color: colors.textSecondary }]}>
                    {t.dashboard.saveReminderDescription}
                  </Text>
                </View>
              </View>

              {/* Animated Tip */}
              <Animated.View style={[
                styles.popupTipBox,
                {
                  backgroundColor: `${colors.primary}15`,
                  borderColor: colors.primary,
                  transform: [{ scale: pulseAnim }],
                },
              ]}>
                <Text style={[styles.popupTipIcon]}>💡</Text>
                <Text style={[styles.popupTipText, { color: colors.primary }]}>
                  {t.dashboard.onlyFutureReminders}
                </Text>
              </Animated.View>

              {/* Action Button */}
              <Pressable
                onPress={() => {
                  Animated.parallel([
                    Animated.timing(popupScaleAnim, {
                      toValue: 0,
                      duration: 300,
                      easing: Easing.in(Easing.ease),
                      useNativeDriver: true,
                    }),
                    Animated.timing(popupFadeAnim, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: true,
                    }),
                  ]).start(() => {
                    setShowTutorialPopup(false);
                    popupScaleAnim.setValue(0);
                    popupFadeAnim.setValue(0);
                    pulseAnim.setValue(1);
                  });
                }}
                style={[styles.popupButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.popupButtonText}>{t.dashboard.letsGetStarted}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    justifyContent: 'center',
    alignItems: 'center',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerButton: {
    padding: 8,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
  },
  topSection: {
    marginBottom: 8,
    display: 'flex',
    gap: 10,
  },
  weatherLine: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtext: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 2,
  },
  // Progress circles card styles
  circlesCard: {
    borderRadius: 28,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginVertical: 20,
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  circlesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginVertical: 8,
    width: '100%',
  },
  circleColumn: {
    alignItems: 'center',
    gap: 14,
  },
  circleWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  circleBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 1,
  },
  circleProgress: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 5,
  },
  circleContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  percentText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  circleSmallLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 3,
  },
  circleLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dateDisplay: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 8,
    opacity: 0.8,
  },
  remindersSection: {
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginLeft: 2,
  },
  emptyState: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyStateIcon: {
    fontSize: 44,
    marginBottom: 2,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
  },
  addReminderButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  addReminderButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  motivationCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  motivationText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
  },
  // ===== Popup Tutorial Styles =====
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    width: '88%',
    maxWidth: 360,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 15,
  },
  // Header with gradient-like appearance
  popupHeaderGradient: {
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
  },
  popupHeaderContent: {
    width: '100%',
    alignItems: 'center',
  },
  popupIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  popupIconBig: {
    fontSize: 40,
  },
  popupMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  popupCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCloseBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  // Content wrapper
  popupContentWrapper: {
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  // Step items
  popupStep: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  popupStepBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  popupStepNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  popupStepContent: {
    flex: 1,
    paddingTop: 4,
  },
  popupStepTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  popupStepDesc: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  // Divider
  popupDivider: {
    height: 1,
    marginVertical: 4,
    marginHorizontal: 0,
    opacity: 0.5,
  },
  // Tip box
  popupTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 20,
    borderWidth: 1.5,
    gap: 12,
  },
  popupTipIcon: {
    fontSize: 22,
  },
  popupTipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  // Button
  popupButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  popupButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
