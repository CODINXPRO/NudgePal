import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from '../utils/useTranslation';
import { SharedHeader } from '../components/SharedHeader';
import translations from '../utils/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle as SvgCircle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

interface HydrationReminder {
  id: string;
  name: string;
  time: string;
  volume: number;
  completed: boolean;
  missed: boolean;
  locked?: boolean;
}

interface HydrationData {
  dailyIntake: number;
  goal: number;
  reminders: HydrationReminder[];
  lastUpdated: string;
}

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const getCurrentTimeInMinutes = (): number => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const getReminderStatus = (reminder: HydrationReminder): 'available' | 'upcoming' | 'missed' => {
  if (reminder.completed || reminder.locked) return 'available';
  if (reminder.missed) return 'missed';
  const reminderTime = timeToMinutes(reminder.time);
  const currentTime = getCurrentTimeInMinutes();
  return currentTime >= reminderTime ? 'available' : 'upcoming';
};

// Map reminder IDs to translation keys
const reminderIdToTranslationKey: { [key: string]: string } = {
  '1': 'morningGlass',
  '2': 'afterBreakfast',
  '3': 'midMorningBoost',
  '4': 'beforeLunch',
  '5': 'afternoonRefresh',
  '6': 'afterDinner',
  '7': 'beforeBed',
};

interface HydrationReminderScreenProps {
  navigation: any;
  onProfilePress?: () => void;
}

const HydrationReminderScreen: React.FC<HydrationReminderScreenProps> = ({ navigation, onProfilePress = () => {} }) => {
  const { userSettings, isRTL } = useApp();
  const { t } = useTranslation();

  const [hydrationData, setHydrationData] = useState<HydrationData>({
    dailyIntake: 0,
    goal: 2500,
    reminders: [],
    lastUpdated: new Date().toDateString(),
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<HydrationReminder | null>(null);
  const [showNotTimeYetModal, setShowNotTimeYetModal] = useState(false);
  const [notTimeYetReminder, setNotTimeYetReminder] = useState<HydrationReminder | null>(null);
  const [rippleAnim] = useState(new Animated.Value(0));
  const [waveAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadHydrationData();
    startWaveAnimation();
    initializeReminders();
  }, []);

  const initializeReminders = async () => {
    try {
      const storedReminders = await AsyncStorage.getItem('@nudgepal_hydration_reminders');
      if (storedReminders) {
        const reminders = JSON.parse(storedReminders);
        setHydrationData((prev) => ({ ...prev, reminders }));
      } else {
        const defaultReminders: HydrationReminder[] = [
          { id: '1', name: t.morningGlass, time: '08:00', volume: 250, completed: false, missed: false },
          { id: '2', name: t.afterBreakfast, time: '09:30', volume: 250, completed: false, missed: false },
          { id: '3', name: t.midMorningBoost, time: '11:00', volume: 250, completed: false, missed: false },
          { id: '4', name: t.beforeLunch, time: '12:30', volume: 250, completed: false, missed: false },
          { id: '5', name: t.afternoonRefresh, time: '15:00', volume: 250, completed: false, missed: false },
          { id: '6', name: t.afterDinner, time: '19:30', volume: 250, completed: false, missed: false },
          { id: '7', name: t.beforeBed, time: '21:00', volume: 200, completed: false, missed: false },
        ];
        await AsyncStorage.setItem('@nudgepal_hydration_reminders', JSON.stringify(defaultReminders));
        setHydrationData((prev) => ({ ...prev, reminders: defaultReminders }));
      }
    } catch (error) {
      console.error('Error initializing reminders:', error);
    }
  };

  const loadHydrationData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('@nudgepal_hydration_data');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        const today = new Date().toDateString();
        if (parsed.lastUpdated !== today) {
          parsed.dailyIntake = 0;
          parsed.lastUpdated = today;
          await AsyncStorage.setItem('@nudgepal_hydration_data', JSON.stringify(parsed));
        }
        setHydrationData(parsed);
        animateProgressBar(parsed.dailyIntake, parsed.goal);
      }
    } catch (error) {
      console.error('Error loading hydration data:', error);
    }
  };

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  };

  const animateProgressBar = (current: number, goal: number) => {
    const percentage = Math.min((current / goal) * 100, 100);
    Animated.timing(progressAnim, { toValue: percentage, duration: 800, useNativeDriver: false }).start();
  };

  const animateRipple = () => {
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  };

  const toggleReminderComplete = async (id: string) => {
    const reminder = hydrationData.reminders.find((r) => r.id === id);
    if (!reminder) return;
    const status = getReminderStatus(reminder);
    if (status === 'upcoming') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setNotTimeYetReminder(reminder);
      setShowNotTimeYetModal(true);
      return;
    }
    setSelectedReminder(reminder);
    setShowConfirmModal(true);
  };

  const confirmReminderDrink = async () => {
    if (!selectedReminder) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateRipple();
    const newIntake = hydrationData.dailyIntake + selectedReminder.volume;
    const updatedReminders = hydrationData.reminders.map((r) =>
      r.id === selectedReminder.id ? { ...r, completed: true, locked: true } : r
    );
    const updatedData = {
      ...hydrationData,
      dailyIntake: newIntake,
      reminders: updatedReminders,
      lastUpdated: new Date().toDateString(),
    };
    setHydrationData(updatedData);
    animateProgressBar(newIntake, hydrationData.goal);
    try {
      await AsyncStorage.setItem('@nudgepal_hydration_data', JSON.stringify(updatedData));
      await AsyncStorage.setItem('@nudgepal_hydration_reminders', JSON.stringify(updatedReminders));
      const today = new Date().toISOString().split('T')[0];
      const historyKey = '@nudgepal_hydration_history';
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : {};
      history[today] = newIntake;
      await AsyncStorage.setItem(historyKey, JSON.stringify(history));
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
    setShowConfirmModal(false);
    setSelectedReminder(null);
  };

  const cancelReminderDrink = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowConfirmModal(false);
    setSelectedReminder(null);
  };

  const closeNotTimeYetModal = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowNotTimeYetModal(false);
    setNotTimeYetReminder(null);
  };

  const getProgressPercentage = () => Math.min((hydrationData.dailyIntake / hydrationData.goal) * 100, 100);

  const getMotivationalMessage = () => {
    const progress = getProgressPercentage();
    if (progress < 30) return 'Stay fresh 💧';
    if (progress < 70) return "You're doing great 💪";
    return 'Goal achieved ✨';
  };

  const completedCount = hydrationData.reminders.filter((r) => r.completed).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SharedHeader 
        title={`💧 ${t.hydration || 'Hydration'}`}
        onProfilePress={onProfilePress}
      />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.trackerCard}>
          <LinearGradient 
            colors={["rgba(255,255,255,0.9)", "rgba(200,235,255,0.7)"]} 
            style={styles.trackerGradient}
          >
            <View style={styles.circleContainer}>
              <CircularProgress progress={getProgressPercentage()} size={200} strokeWidth={12} />
              <Animated.View
                style={[
                  styles.ripple,
                  {
                    opacity: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
                    transform: [{ scale: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] }) }],
                  },
                ]}
              />
              <View style={[styles.circleContent, isRTL && styles.rtlCircleContent]}>
                <Text style={[styles.intakeAmount, isRTL && styles.rtlText]}>
                  {(hydrationData.dailyIntake / 1000).toFixed(1)}L
                </Text>
                <Text style={[styles.goalAmount, isRTL && styles.rtlText]}>
                  / {(hydrationData.goal / 1000).toFixed(1)}L
                </Text>
                <Text style={[styles.motivationalText, isRTL && styles.rtlText]}>
                  {getMotivationalMessage()}
                </Text>
              </View>
            </View>
            <Text style={[styles.trackerHint, isRTL && styles.rtlText]}>
              {t.clickRemindersHint}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.remindersSection}>
          <View style={[styles.remindersHeader, isRTL && styles.rtlHeader]}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
              📋 {t.todayOverview}
            </Text>
            <Text style={styles.progressIndicator}>
              {completedCount}/{hydrationData.reminders.length}
            </Text>
          </View>
          {hydrationData.reminders.map((reminder) => (
            <ReminderCard 
              key={reminder.id} 
              reminder={reminder} 
              onPress={() => toggleReminderComplete(reminder.id)} 
              isRTL={isRTL} 
              t={t} 
            />
          ))}
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>

      <Modal 
        visible={showConfirmModal} 
        transparent 
        animationType="fade" 
        onRequestClose={() => { 
          setShowConfirmModal(false); 
          setSelectedReminder(null); 
        }}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={[styles.confirmModalCard, isRTL && styles.rtlConfirmCard]}>
            <Text style={styles.confirmModalEmoji}>💧</Text>
            <Text style={[styles.confirmModalTitle, isRTL && styles.rtlText]}>
              {t.confirmDidYouDrinkPrefix}
              {'\n'}
              <Text style={styles.confirmModalReminder}>{selectedReminder?.name}?</Text>
            </Text>
            <Text style={[styles.confirmModalVolume, isRTL && styles.rtlText]}>
              {selectedReminder?.volume}ml of pure hydration magic! ✨
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonYes]} 
                onPress={confirmReminderDrink}
              >
                <Text style={styles.confirmButtonTextYes}>{t.confirmYesText}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmButtonNo]} 
                onPress={cancelReminderDrink}
              >
                <Text style={styles.confirmButtonTextNo}>{t.confirmNoText}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.confirmModalNote, isRTL && styles.rtlText]}>
              (Once confirmed, you can't undo it for today!)
            </Text>
          </View>
        </View>
      </Modal>

      <Modal 
        visible={showNotTimeYetModal} 
        transparent 
        animationType="fade" 
        onRequestClose={closeNotTimeYetModal}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={[styles.confirmModalCard, isRTL && styles.rtlConfirmCard]}>
            <Text style={styles.confirmModalEmoji}>⏳</Text>
            <Text style={[styles.confirmModalTitle, isRTL && styles.rtlText]}>
              {t.notTimeYetTitle}
              {'\n'}
              <Text style={styles.confirmModalReminder}>
                {t.notTimeYetNextSipText} {notTimeYetReminder?.time}
              </Text>
            </Text>
            <Text style={[styles.confirmModalVolume, isRTL && styles.rtlText]}>
              {t.notTimeYetBody}
            </Text>
            <TouchableOpacity 
              style={[styles.confirmButton, styles.confirmButtonOk]} 
              onPress={closeNotTimeYetModal}
            >
              <Text style={styles.confirmButtonTextOk}>{t.gotIt}</Text>
            </TouchableOpacity>
            <Text style={[styles.confirmModalNote, isRTL && styles.rtlText]}>
              {t.onlyLogWhenTime}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

interface ReminderCardProps {
  reminder: HydrationReminder;
  onPress: () => void;
  isRTL?: boolean;
  t?: any;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onPress, isRTL = false, t }) => {
  const slideAnim = new Animated.Value(0);
  const status = getReminderStatus(reminder);

  // Get translated name based on reminder ID
  const getTranslatedName = () => {
    if (!t) return reminder.name;
    const translationKey = reminderIdToTranslationKey[reminder.id];
    return translationKey ? t[translationKey] : reminder.name;
  };

  const handlePress = async () => {
    if (reminder.locked) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getCardStyle = () => {
    if (reminder.completed || reminder.locked) return styles.reminderCompleted;
    if (reminder.missed) return styles.reminderMissed;
    if (status === 'available') return styles.reminderAvailable;
    return styles.reminderUpcoming;
  };

  return (
    <Animated.View style={[styles.reminderCard, { transform: [{ translateX: slideAnim }] }]}>
      <TouchableOpacity
        style={[styles.reminderContent, getCardStyle(), isRTL && styles.rtlReminderContent]}
        onPress={handlePress}
        disabled={reminder.locked}
      >
        <View style={[styles.reminderLeft, isRTL && styles.rtlReminderLeft]}>
          <Text style={[styles.reminderEmoji, isRTL && styles.rtlEmoji]}>💧</Text>
          <View style={styles.reminderInfo}>
            <Text
              style={[
                styles.reminderName,
                reminder.completed && styles.reminderNameCompleted,
                reminder.locked && styles.reminderNameLocked,
              ]}
            >
              {getTranslatedName()}
            </Text>
            <Text
              style={[
                styles.reminderTime,
                reminder.completed && styles.reminderTimeCompleted,
                reminder.locked && styles.reminderTimeLocked,
              ]}
            >
              {reminder.time}
            </Text>
          </View>
        </View>
        <View style={[styles.reminderRight, isRTL && styles.rtlReminderRight]}>
          <Text style={styles.reminderVolume}>{reminder.volume}ml</Text>
          <View
            style={[
              styles.reminderStatus,
              reminder.completed && styles.statusDone,
              reminder.missed && styles.statusMissed,
              reminder.locked && styles.statusLocked,
            ]}
          >
            <Text style={styles.statusIcon}>
              {reminder.locked ? '🔒' : reminder.completed ? '✅' : reminder.missed ? '❌' : status === 'available' ? '🔵' : '⏳'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface CircularProgressProps {
  progress: number;
  size: number;
  strokeWidth: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ progress, size, strokeWidth }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  let progressColor = '#6AC3FF';
  if (progress >= 70) progressColor = '#4CAF50';
  else if (progress >= 30) progressColor = '#06b6d4';

  return (
    <Svg width={size} height={size} style={styles.circleCanvas}>
      <Defs>
        <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#6AC3FF" stopOpacity="1" />
          <Stop offset="100%" stopColor={progressColor} stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <SvgCircle cx={size / 2} cy={size / 2} r={radius} stroke="#C4EBFF" strokeWidth={strokeWidth} fill="none" opacity={0.3} />
      <SvgCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={`url(#progressGradient)`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="0"
        originX={size / 2}
        originY={size / 2}
      />
      {progress >= 100 && (
        <SvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4CAF50"
          strokeWidth={strokeWidth + 2}
          fill="none"
          opacity={0.3}
        />
      )}
    </Svg>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  rtlText: {
    textAlign: 'right',
  },
  rtlHeader: {
    flexDirection: 'row-reverse',
  },
  trackerCard: {
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  trackerGradient: {
    padding: 24,
    alignItems: 'center',
  },
  circleContainer: {
    position: 'relative',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  circleCanvas: {
    position: 'absolute',
    width: 220,
    height: 220,
  },
  ripple: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#6AC3FF',
    shadowColor: '#6AC3FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  circleContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  rtlCircleContent: {
    alignItems: 'center',
  },
  intakeAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0A2C49',
    letterSpacing: 0.5,
  },
  goalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A517D',
    marginTop: 4,
    opacity: 0.8,
  },
  motivationalText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A517D',
    marginTop: 12,
    letterSpacing: 0.3,
  },
  trackerHint: {
    fontSize: 12,
    color: '#1A517D',
    marginTop: 16,
    fontWeight: '500',
    opacity: 0.7,
  },
  remindersSection: {
    marginBottom: 24,
  },
  remindersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#006b7a',
  },
  progressIndicator: {
    fontSize: 14,
    color: '#6aa9e9',
    backgroundColor: 'rgba(106,169,233,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reminderCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  reminderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#06b6d4',
  },
  rtlReminderContent: {
    flexDirection: 'row-reverse',
  },
  reminderCompleted: {
    backgroundColor: 'rgba(200,235,255,0.3)',
    borderLeftColor: '#4caf50',
  },
  reminderMissed: {
    backgroundColor: 'rgba(200,200,200,0.2)',
    borderLeftColor: '#999',
  },
  reminderAvailable: {
    backgroundColor: 'rgba(106,195,255,0.15)',
    borderLeftColor: '#2196F3',
  },
  reminderUpcoming: {
    backgroundColor: 'rgba(150,150,150,0.1)',
    borderLeftColor: '#BDBDBD',
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rtlReminderLeft: {
    flexDirection: 'row-reverse',
  },
  reminderEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  rtlEmoji: {
    marginRight: 0,
    marginLeft: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006b7a',
  },
  reminderNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  reminderNameLocked: {
    textDecorationLine: 'line-through',
    color: '#4caf50',
  },
  reminderTime: {
    fontSize: 12,
    color: '#6aa9e9',
    marginTop: 2,
  },
  reminderTimeCompleted: {
    color: '#999',
  },
  reminderTimeLocked: {
    color: '#4caf50',
  },
  reminderRight: {
    alignItems: 'flex-end',
  },
  rtlReminderRight: {
    alignItems: 'flex-start',
  },
  reminderVolume: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006b7a',
  },
  reminderStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,193,7,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  statusDone: {
    backgroundColor: 'rgba(76,175,80,0.2)',
  },
  statusMissed: {
    backgroundColor: 'rgba(200,200,200,0.2)',
  },
  statusLocked: {
    backgroundColor: 'rgba(76,175,80,0.3)',
  },
  statusIcon: {
    fontSize: 16,
  },
  footerSpace: {
    height: 40,
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    width: '85%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  rtlConfirmCard: {
    alignItems: 'center',
  },
  confirmModalEmoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#006b7a',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  confirmModalReminder: {
    color: '#06b6d4',
    fontWeight: '800',
  },
  confirmModalVolume: {
    fontSize: 14,
    color: '#6aa9e9',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  confirmModalButtons: {
    gap: 12,
    marginBottom: 16,
  },
  confirmButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  confirmButtonYes: {
    backgroundColor: '#06b6d4',
    borderColor: '#06b6d4',
  },
  confirmButtonNo: {
    backgroundColor: 'white',
    borderColor: '#e0e0e0',
  },
  confirmButtonOk: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  confirmButtonTextYes: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  confirmButtonTextNo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6aa9e9',
  },
  confirmButtonTextOk: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  confirmModalNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default HydrationReminderScreen;
