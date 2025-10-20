import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Modal,
  Animated,
  Easing,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { SharedHeader } from '../components/SharedHeader';
import { OverspendingTrackerScreen } from './OverspendingTrackerScreen';
import { HabitJourneyScreen } from './HabitJourneyScreen';

interface Habit {
  id: string;
  name: string;
  emoji: string;
  description: string;
  enabled: boolean;
  dailyCheckIns: number;
  currentStreak: number;
  checkInsCompleted: number;
  totalResistanceDays: number;
  createdAt: string;
  isCustom: boolean;
}

const PREDEFINED_HABITS: Omit<Habit, 'id' | 'enabled' | 'currentStreak' | 'checkInsCompleted' | 'totalResistanceDays' | 'createdAt' | 'isCustom'>[] = [
  { name: 'Overspending', emoji: '💸', description: 'Control impulse buying and save money.', dailyCheckIns: 3 },
  { name: 'Unhealthy Eating', emoji: '🍔', description: 'Make better food choices.', dailyCheckIns: 3 },
  { name: 'Lack of Exercise', emoji: '🏃', description: 'Stay active and fit.', dailyCheckIns: 2 },
  { name: 'Sleep Deprivation', emoji: '😴', description: 'Get better sleep.', dailyCheckIns: 1 },
];

const EMOJI_LIST = [
  '💸', '📱', '🍔', '😡', '🛌', '🏃', '🍭', '😴', 
  '🚬', '🍷', '📺', '🎮', '💻', '🧠', '❤️', '💪',
  '🎯', '📚', '🧘', '🚀', '✨', '🔥', '💎', '⚡',
];

interface HabitsScreenProps {
  onProfilePress?: () => void;
}

export const HabitsScreen: React.FC<HabitsScreenProps> = ({ onProfilePress = () => {} }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💪');
  const [loading, setLoading] = useState(true);
  const [showOverspendingTracker, setShowOverspendingTracker] = useState(false);
  const [showJourneyScreen, setShowJourneyScreen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [cardAnimValues] = useState<{ [key: string]: Animated.Value }>({});

  useEffect(() => {
    loadHabits();
    
    // Header animation
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
  }, []);

  const loadHabits = async () => {
    try {
      const stored = await AsyncStorage.getItem('habits');
      if (stored) {
        setHabits(JSON.parse(stored));
      } else {
        // Initialize with empty array
        await AsyncStorage.setItem('habits', JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveHabits = async (newHabits: Habit[]) => {
    try {
      await AsyncStorage.setItem('habits', JSON.stringify(newHabits));
      setHabits(newHabits);
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  };

  const addHabit = (baseHabit: Omit<Habit, 'id' | 'enabled' | 'currentStreak' | 'checkInsCompleted' | 'totalResistanceDays' | 'createdAt' | 'isCustom'>, isCustom: boolean = false) => {
    const newHabit: Habit = {
      ...baseHabit,
      id: `habit_${Date.now()}`,
      enabled: true,
      currentStreak: 0,
      checkInsCompleted: 0,
      totalResistanceDays: 0,
      createdAt: new Date().toISOString(),
      isCustom,
    };
    saveHabits([...habits, newHabit]);
  };

  const addCustomHabit = () => {
    if (!customName.trim()) {
      Alert.alert('Error', t.habits_screen.pleaseEnterHabitName || "Please enter a habit name.");
      return;
    }
    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      name: customName,
      emoji: selectedEmoji,
      description: `My custom habit to break.`,
      dailyCheckIns: 1,
      enabled: true,
      currentStreak: 0,
      checkInsCompleted: 0,
      totalResistanceDays: 0,
      createdAt: new Date().toISOString(),
      isCustom: true,
    };
    
    const updatedHabits = [...habits, newHabit];
    saveHabits(updatedHabits);
    
    // Show journey screen for the new custom habit
    setSelectedHabitId(newHabit.id);
    setShowJourneyScreen(true);
    
    setCustomName('');
    setSelectedEmoji('💪');
    setShowCustomForm(false);
  };

  const toggleHabit = (id: string) => {
    const updated = habits.map(h => 
      h.id === id ? { ...h, enabled: !h.enabled } : h
    );
    saveHabits(updated);
  };

  const deleteHabit = (id: string) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to remove this habit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            saveHabits(habits.filter(h => h.id !== id));
          },
        },
      ]
    );
  };

  const addFromLibrary = (baseHabit: any) => {
    // Check if already added
    if (habits.some(h => h.name === baseHabit.name)) {
      // If already added, just open the tracker for Overspending
      if (baseHabit.name === 'Overspending') {
        const existingHabit = habits.find(h => h.name === 'Overspending');
        if (existingHabit) {
          setSelectedHabitId(existingHabit.id);
          setShowOverspendingTracker(true);
        }
      }
      return;
    }
    // Add the habit
    addHabit(baseHabit);
    
    // If it's Overspending, immediately open the tracker
    if (baseHabit.name === 'Overspending') {
      setTimeout(() => {
        const newHabit = habits.find(h => h.name === 'Overspending');
        if (newHabit) {
          setSelectedHabitId(newHabit.id);
          setShowOverspendingTracker(true);
        }
      }, 100);
    }
  };

  const customHabits = habits.filter(h => h.isCustom && h.enabled);
  const inactiveHabits = habits.filter(h => !h.enabled);
  const overspendingHabit = habits.find(h => h.name === 'Overspending' && !h.isCustom);
  const otherPredefinedHabits = habits.filter(h => !h.isCustom && h.name !== 'Overspending');

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading habits...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Shared Header */}
      <SharedHeader 
        title={t.habits_screen.headerTitle || "Habits I Want to Break"} 
        onProfilePress={onProfilePress} 
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Empty State */}
        {customHabits.length === 0 && (
          <Animated.View
            style={[
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={[styles.emptyStateContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyStateEmoji}>🌟</Text>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                {t.habits_screen.startJourney || "Start Your Journey"}
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {t.habits_screen.noActiveHabits || "No active habits yet. Add one to begin your self-improvement quest!"}
              </Text>
            </View>
          </Animated.View>
        )}
        {/* Overspending - Configured Habit (Top Section) */}
        {overspendingHabit && (
          <Animated.View
            style={[
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.premiumSection}>
              <View style={styles.premiumSectionHeader}>
                <Text style={styles.premiumSectionIcon}>💪</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.premiumSectionTitle, { color: colors.text }]}>
                    {t.habits_screen.readyToStart || "Ready to Start"}
                  </Text>
                  <Text style={[styles.premiumSectionSubtitle, { color: colors.textSecondary }]}>
                    {t.habits_screen.configuredReady || "Configured and ready to use"}
                  </Text>
                </View>
              </View>

              {/* Overspending Card */}
              <View style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.premiumCardHeader}>
                  <Text style={styles.premiumCardEmoji}>{overspendingHabit.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.premiumCardTitle, { color: colors.text }]}>
                      {overspendingHabit.name}
                    </Text>
                    <Text style={[styles.premiumCardDesc, { color: colors.textSecondary }]}>
                      {overspendingHabit.description}
                    </Text>
                  </View>
                  <Switch
                    value={overspendingHabit.enabled}
                    onValueChange={() => toggleHabit(overspendingHabit.id)}
                    trackColor={{ false: colors.border, true: '#10b981' }}
                    thumbColor={overspendingHabit.enabled ? '#10b981' : colors.textSecondary}
                  />
                </View>

                <View style={[styles.premiumProgressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.premiumProgressFill,
                      {
                        width: `${Math.min((overspendingHabit.checkInsCompleted / overspendingHabit.dailyCheckIns) * 100, 100)}%`,
                        backgroundColor: colors.primary || '#6366f1',
                      },
                    ]}
                  />
                </View>

                <View style={styles.premiumActionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.premiumActionButton,
                      { backgroundColor: colors.primary || '#6366f1' }
                    ]}
                    onPress={() => {
                      setSelectedHabitId(overspendingHabit.id);
                      setShowOverspendingTracker(true);
                    }}
                  >
                    <Text style={styles.premiumActionButtonTextPrimary}>
                      💰 Track Spending
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Your Custom Habits Section - Premium Card Design */}
        {customHabits.length > 0 && (
          <Animated.View
            style={[
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.premiumSection}>
              <View style={styles.premiumSectionHeader}>
                <Text style={styles.premiumSectionIcon}>📚</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.premiumSectionTitle, { color: colors.text }]}>
                    {t.habits_screen.customHabits || "Your Custom Habits"}
                  </Text>
                  <Text style={[styles.premiumSectionSubtitle, { color: colors.textSecondary }]}>
                    {customHabits.length} {customHabits.length === 1 ? 'challenge' : 'challenges'} in progress
                  </Text>
                </View>
              </View>

              {/* Custom Habits Cards */}
              {customHabits.map((habit, idx) => (
                <View key={habit.id} style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {/* Card Header */}
                  <View style={styles.premiumCardHeader}>
                    <Text style={styles.premiumCardEmoji}>{habit.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.premiumCardTitle, { color: colors.text }]}>
                        {habit.name}
                      </Text>
                      <Text style={[styles.premiumCardDesc, { color: colors.textSecondary }]}>
                        {habit.description}
                      </Text>
                    </View>
                    <Switch
                      value={habit.enabled}
                      onValueChange={() => toggleHabit(habit.id)}
                      trackColor={{ false: colors.border, true: '#10b981' }}
                      thumbColor={habit.enabled ? '#10b981' : colors.textSecondary}
                    />
                  </View>

                  {/* Progress Bar */}
                  <View style={[styles.premiumProgressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.premiumProgressFill,
                        {
                          width: `${Math.min((habit.checkInsCompleted / habit.dailyCheckIns) * 100, 100)}%`,
                          backgroundColor: colors.primary || '#6366f1',
                        },
                      ]}
                    />
                  </View>

                  {/* Stats Row - Only for Custom Habits */}
                  {habit.isCustom && (
                    <View style={styles.premiumStatsRow}>
                      <View style={styles.premiumStatItem}>
                        <Text style={styles.premiumStatLabel}>{t.habits_screen.streak || "Streak"}</Text>
                        <Text style={[styles.premiumStatValue, { color: colors.text }]}>
                          {habit.currentStreak} days
                        </Text>
                      </View>
                      <View style={styles.premiumStatDivider} />
                      <View style={styles.premiumStatItem}>
                        <Text style={styles.premiumStatLabel}>{t.habits_screen.resistance || "Resistance"}</Text>
                        <Text style={[styles.premiumStatValue, { color: colors.text }]}>
                          {habit.totalResistanceDays} days
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.premiumActionButtons}>
                    {habit.name === 'Overspending' ? (
                      // Overspending - Configured, show action button only
                      <TouchableOpacity
                        style={[
                          styles.premiumActionButton,
                          { backgroundColor: colors.primary || '#6366f1' }
                        ]}
                        onPress={() => {
                          setSelectedHabitId(habit.id);
                          setShowOverspendingTracker(true);
                        }}
                      >
                        <Text style={styles.premiumActionButtonTextPrimary}>
                          � Track Spending
                        </Text>
                      </TouchableOpacity>
                    ) : habit.isCustom ? (
                      // Custom habits - Show My Journey + Delete
                      <>
                        <TouchableOpacity
                          style={[
                            styles.premiumActionButton,
                            { backgroundColor: colors.primary || '#6366f1' }
                          ]}
                          onPress={() => {
                            setSelectedHabitId(habit.id);
                            setShowJourneyScreen(true);
                          }}
                        >
                          <Text style={styles.premiumActionButtonTextPrimary}>
                            {t.habits_screen.myJourney || "📖 My Journey"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.premiumActionButton,
                            { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1.5 }
                          ]}
                          onPress={() => deleteHabit(habit.id)}
                        >
                          <Text style={[styles.premiumActionButtonText, { color: '#ef4444' }]}>
                            {t.habits_screen.delete || "🗑️ Delete"}
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      // Predefined habits (except Overspending) - Show Coming Soon lock
                      <TouchableOpacity
                        style={[
                          styles.premiumActionButton,
                          { backgroundColor: `${colors.primary}15`, borderColor: colors.primary, borderWidth: 1.5 }
                        ]}
                        disabled
                      >
                        <Text style={[styles.premiumActionButtonText, { color: colors.primary }]}>
                          🔒 Coming Soon
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Coming Soon Predefined Habits Section */}
        {otherPredefinedHabits.length > 0 && (
          <Animated.View
            style={[
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.premiumSection}>
              <View style={styles.premiumSectionHeader}>
                <Text style={styles.premiumSectionIcon}>🔮</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.premiumSectionTitle, { color: colors.text }]}>
                    {t.habits_screen.moreHabits || "Explore More Habits"}
                  </Text>
                  <Text style={[styles.premiumSectionSubtitle, { color: colors.textSecondary }]}>
                    {t.habits_screen.discoverMore || "Explore other habits you can track"}
                  </Text>
                </View>
              </View>

              {/* Predefined Habits Cards */}
              {otherPredefinedHabits.map((habit, idx) => (
                <View key={habit.id} style={[styles.premiumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {/* Card Header - No Toggle */}
                  <View style={styles.premiumCardHeader}>
                    <Text style={styles.premiumCardEmoji}>{habit.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.premiumCardTitle, { color: colors.text }]}>
                        {habit.name}
                      </Text>
                      <Text style={[styles.premiumCardDesc, { color: colors.textSecondary }]}>
                        {habit.description}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={[styles.premiumProgressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.premiumProgressFill,
                        {
                          width: '0%',
                          backgroundColor: colors.primary || '#6366f1',
                        },
                      ]}
                    />
                  </View>

                  {/* Action Buttons - Coming Soon */}
                  <View style={styles.premiumActionButtons}>
                    {habit.name === 'Overspending' ? (
                      // Overspending - Configured, show action button only
                      <TouchableOpacity
                        style={[
                          styles.premiumActionButton,
                          { backgroundColor: colors.primary || '#6366f1' }
                        ]}
                        onPress={() => {
                          setSelectedHabitId(habit.id);
                          setShowOverspendingTracker(true);
                        }}
                      >
                        <Text style={styles.premiumActionButtonTextPrimary}>
                          💰 Track Spending
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      // Other predefined habits - Show Coming Soon lock
                      <TouchableOpacity
                        style={[
                          styles.premiumActionButton,
                          { backgroundColor: `${colors.primary}15`, borderColor: colors.primary, borderWidth: 1.5 }
                        ]}
                        disabled
                      >
                        <Text style={[styles.premiumActionButtonText, { color: colors.primary }]}>
                          🔒 Coming Soon
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Create Habit Section */}
        <Animated.View
          style={[
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.premiumSection}>
            <View style={styles.premiumSectionHeader}>
              <Text style={styles.premiumSectionIcon}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.premiumSectionTitle, { color: colors.text }]}>
                  {t.habits_screen.createNewChallenge || "Create Your Challenge"}
                </Text>
                <Text style={[styles.premiumSectionSubtitle, { color: colors.textSecondary }]}>
                  {t.habits_screen.designCustomHabit || "Design a custom habit to break"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.premiumCreateButton, { backgroundColor: colors.primary || '#6366f1' }]}
              onPress={() => setShowCustomForm(true)}
            >
              <Text style={styles.premiumCreateButtonText}>{t.habits_screen.createCustomHabit || "✨ Create Custom Habit"}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Inactive Habits Section */}
        {inactiveHabits.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginHorizontal: 16 }]}>
              Paused Challenges ({inactiveHabits.length})
            </Text>
            {inactiveHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                colors={colors}
                onToggle={() => toggleHabit(habit.id)}
                onDelete={() => deleteHabit(habit.id)}
                onViewInsights={() => {
                  if (habit.name === 'Overspending') {
                    setSelectedHabitId(habit.id);
                    setShowOverspendingTracker(true);
                  } else if (habit.isCustom) {
                    setSelectedHabitId(habit.id);
                    setShowJourneyScreen(true);
                  }
                }}
                isPaused
                t={t}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Custom Habit Form Modal - Modern Redesign */}
      <Modal
        visible={showCustomForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomForm(false)}
      >
        <View style={[styles.modernModalOverlay, { backgroundColor: colors.background }]}>
          {/* Header with Close */}
          <View style={[styles.modernModalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modernModalHeaderTitle, { color: colors.text }]}>
              {t.habits_screen.createNewChallenge || "Create New Challenge"}
            </Text>
            <TouchableOpacity
              style={styles.modernCloseButton}
              onPress={() => setShowCustomForm(false)}
            >
              <Text style={[styles.modernCloseIcon, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modernScrollView}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Main Content */}
            <View style={styles.modernContent}>
              {/* Step 1: Name */}
              <View style={styles.modernSection}>
                <View style={styles.modernSectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.habits_screen.whatsYourChallenge || "What's Your Challenge?"}</Text>
                </View>
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                  {t.habits_screen.nameHabitYouWantToBreak || "Name the habit you want to break or replace"}
                </Text>
                <TextInput
                  style={[
                    styles.modernInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder={t.habits_screen.habitNamePlaceholder || "e.g., Coffee Addiction, Smoking, Procrastination"}
                  placeholderTextColor={colors.textSecondary}
                  value={customName}
                  onChangeText={setCustomName}
                />
              </View>

              {/* Step 2: Emoji Selection */}
              <View style={styles.modernSection}>
                <View style={styles.modernSectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.habits_screen.pickYourIcon || "Pick Your Icon"}</Text>
                </View>
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                  {t.habits_screen.selectEmojiDescription || "Select an emoji that represents this challenge"}
                </Text>
                
                {/* Selected Emoji Display */}
                {selectedEmoji && (
                  <View style={[styles.selectedEmojiDisplay, { backgroundColor: colors.surface }]}>
                    <Text style={styles.selectedEmojiText}>{selectedEmoji}</Text>
                  </View>
                )}

                {/* Modern Emoji Grid */}
                <View style={styles.modernEmojiGrid}>
                  {EMOJI_LIST.map((emoji, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.modernEmojiButton,
                        {
                          backgroundColor: selectedEmoji === emoji 
                            ? (colors.primary || '#6366f1') 
                            : colors.surface,
                          borderColor: selectedEmoji === emoji 
                            ? (colors.primary || '#6366f1')
                            : colors.border,
                          borderWidth: selectedEmoji === emoji ? 2.5 : 1.5,
                        },
                      ]}
                      onPress={() => setSelectedEmoji(emoji)}
                    >
                      <Text style={styles.modernEmoji}>{emoji}</Text>
                      {selectedEmoji === emoji && (
                        <View style={[styles.checkmark, { backgroundColor: colors.primary || '#6366f1' }]}>
                          <Text style={styles.checkmarkIcon}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Summary Card */}
              <View style={[styles.summaryCard, { backgroundColor: (colors.primary || '#6366f1') + '10', borderColor: colors.primary || '#6366f1' }]}>
                <Text style={[styles.summaryTitle, { color: colors.text }]}>{t.habits_screen.readyToStartJourney || "Ready to start your journey?"}</Text>
                <View style={styles.summaryItems}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryItemEmoji]}>🎯</Text>
                    <Text style={[styles.summaryItemText, { color: colors.textSecondary }]}>
                      {customName || t.habits_screen.yourChallenge || 'Your challenge'}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryItemEmoji]}>{selectedEmoji}</Text>
                    <Text style={[styles.summaryItemText, { color: colors.textSecondary }]}>
                      {t.habits_screen.yourIcon || "Your icon"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons - Fixed at Bottom */}
          <View style={[styles.modernButtonContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.modernCancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowCustomForm(false)}
            >
              <Text style={[styles.modernCancelButtonText, { color: colors.text }]}>{t.habits_screen.cancel || "Cancel"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modernCreateButton, { backgroundColor: colors.primary || '#6366f1' }]}
              onPress={addCustomHabit}
            >
              <Text style={styles.modernCreateButtonText}>{t.habits_screen.startChallenge || "🚀 Start Challenge"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Overspending Tracker Modal */}
      {selectedHabitId && (
        <OverspendingTrackerScreen
          isOpen={showOverspendingTracker}
          onClose={() => setShowOverspendingTracker(false)}
          habitId={selectedHabitId}
        />
      )}

      {/* Habit Journey Screen Modal */}
      {selectedHabitId && showJourneyScreen && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <HabitJourneyScreen
            habitId={selectedHabitId}
            habitName={habits.find(h => h.id === selectedHabitId)?.name || 'Your Habit'}
            emoji={habits.find(h => h.id === selectedHabitId)?.emoji || '💪'}
            onClose={() => setShowJourneyScreen(false)}
          />
        </View>
      )}
    </View>
  );
};

// Habit Card Component
const HabitCard: React.FC<{
  habit: Habit;
  colors: any;
  onToggle: () => void;
  onDelete: () => void;
  onViewInsights?: () => void;
  isPaused?: boolean;
  t?: any;
}> = ({ habit, colors, onToggle, onDelete, onViewInsights, isPaused, t: translations }) => {
  const t = translations || {};
  const progress = Math.min(habit.checkInsCompleted / habit.dailyCheckIns, 1);
  const progressPercentage = Math.round(progress * 100);

  return (
    <TouchableOpacity
      activeOpacity={habit.name === 'Overspending' ? 0.7 : 1}
      onPress={() => {
        if (habit.name === 'Overspending') {
          onViewInsights?.();
        }
      }}
    >
      <View
        style={[
          styles.habitCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: isPaused ? 0.6 : 1,
          },
        ]}
      >
        {/* Top Row: Toggle + Name + Lock/Arrow */}
        <View style={styles.habitCardTop}>
          <Switch
            value={habit.enabled}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: '#10b981' }}
            thumbColor={habit.enabled ? '#10b981' : colors.textSecondary}
          />
          <Text style={styles.habitEmoji}>{habit.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
            <Text style={[styles.habitDescription, { color: colors.textSecondary }]}>
              {habit.description}
            </Text>
          </View>
          {habit.name === 'Overspending' && (
            <View style={[styles.lockBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          )}
        </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progressPercentage}%`,
              backgroundColor: progressPercentage === 100 ? '#10b981' : colors.primary || '#6366f1',
            },
          ]}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {habit.name === 'Overspending' ? (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.border, backgroundColor: `${colors.primary}15` }]}
            onPress={onDelete}
          >
            <Text style={[styles.actionButtonText, { color: colors.primary || '#6366f1' }]}>
              ✨ Not Yet Configured
            </Text>
          </TouchableOpacity>
        ) : habit.isCustom ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.primary || '#6366f1' }]}
              onPress={onViewInsights}
            >
              <Text style={[styles.actionButtonText, { color: colors.primary || '#6366f1' }]}>
                {t.habits_screen?.myJourney || "📖 My Journey"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: '#ef4444' }]}
              onPress={onDelete}
            >
              <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>
                {t.habits_screen?.delete || "🗑️ Delete"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]}>
              <Text style={[styles.actionButtonText, { color: colors.primary || '#6366f1' }]}>
                ✏️ Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: '#ef4444' }]}
              onPress={onDelete}
            >
              <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>
                {t.habits_screen?.delete || "🗑️ Delete"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      </View>
    </TouchableOpacity>
  );
};

// Predefined Habit Item Component
const PredefinedHabitItem: React.FC<{
  habit: any;
  colors: any;
  isAdded: boolean;
  onAdd: () => void;
}> = ({ habit, colors, isAdded, onAdd }) => (
  <View
    style={[
      styles.predefinedHabitItem,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      },
    ]}
  >
    <View style={{ flex: 1 }}>
      <Text style={styles.predefinedEmojiName}>
        <Text style={styles.predefinedEmoji}>{habit.emoji}</Text> {habit.name}
      </Text>
      <Text style={[styles.predefinedDescription, { color: colors.textSecondary }]}>
        {habit.description}
      </Text>
    </View>
    <TouchableOpacity
      style={[styles.addButton, { backgroundColor: (colors.primary || '#6366f1') + '20' }]}
      onPress={onAdd}
    >
      <Text style={[styles.addButtonText, { color: colors.primary || '#6366f1' }]}>{'>'}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  sectionIcon: {
    fontSize: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  // Habit Card Styles
  habitCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  habitCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  habitEmoji: {
    fontSize: 24,
    marginTop: 2,
  },
  habitName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  habitDescription: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 16,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  arrowIndicator: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Predefined Habit Styles
  predefinedHabitItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  predefinedEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  predefinedEmojiName: {
    fontSize: 13,
    fontWeight: '700',
  },
  predefinedDescription: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  // Custom Habit Button
  customHabitButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customHabitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  modalScrollView: {
    maxHeight: '85%',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  emojiButton: {
    width: '20%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  sliderButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  // Empty State
  emptyStateContainer: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 20,
  },
  emptyStateEmoji: {
    fontSize: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  emptyStateText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    justifyContent: 'center',
    alignItems: 'center',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  
  // Modern Modal Styles
  modernModalOverlay: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  modernModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginTop: 0,
  },
  modernModalHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    flex: 1,
  },
  modernCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  modernCloseIcon: {
    fontSize: 24,
    fontWeight: '700',
  },
  modernScrollView: {
    flex: 1,
  },
  modernContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modernSection: {
    marginBottom: 28,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  modernInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  selectedEmojiDisplay: {
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedEmojiText: {
    fontSize: 56,
  },
  modernEmojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  modernEmojiButton: {
    width: '19%',
    aspectRatio: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modernEmoji: {
    fontSize: 24,
  },
  checkmark: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    top: -8,
    right: -8,
  },
  checkmarkIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  checkinsDisplay: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  checkinsValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  checkinsLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  modernSliderContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  modernSliderButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernSliderButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginTop: 12,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  summaryItems: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryItemEmoji: {
    fontSize: 20,
  },
  summaryItemText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  modernButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  modernCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernCancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modernCreateButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernCreateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  // Animation styles
  headerAnimated: {
    overflow: 'hidden',
  },
  // Premium Habit Styles (matching Calendar popup design)
  premiumSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  premiumSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  premiumSectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  premiumSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  premiumSectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  // Premium Card Design
  premiumCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  premiumCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  premiumCardEmoji: {
    fontSize: 32,
    marginTop: 2,
  },
  premiumCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  premiumCardDesc: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 18,
  },
  // Progress bar
  premiumProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 12,
  },
  premiumProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Stats row
  premiumStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
    paddingVertical: 8,
  },
  premiumStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  premiumStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
  },
  premiumStatValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  premiumStatDivider: {
    width: 1,
    height: 30,
    opacity: 0.15,
  },
  // Action buttons
  premiumActionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  premiumActionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumActionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  premiumActionButtonTextPrimary: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  // Create button
  premiumCreateButton: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  premiumCreateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  // Lock badge for old HabitCard (kept for compatibility)
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 20,
  },
});
