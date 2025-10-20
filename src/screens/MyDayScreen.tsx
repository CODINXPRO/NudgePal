import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation, useGreeting } from '../utils/useTranslation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileScreen from './ProfileScreen';

const { width } = Dimensions.get('window');

interface Habit {
  id: string;
  name: string;
  emoji: string;
  completed: boolean;
  completedAt?: string;
  type: 'hydration' | 'eye-break' | 'movement' | 'checkin' | 'custom';
  time?: string;
  timeCategory?: 'morning' | 'day' | 'evening';
}

const defaultHabits: Habit[] = [
  { id: '1', name: 'Morning Intentions', emoji: '�', completed: false, type: 'checkin', time: '06:00', timeCategory: 'morning' },
  { id: '2', name: 'Take Vitamins', emoji: '�', completed: false, type: 'custom', time: '07:00', timeCategory: 'morning' },
  { id: '3', name: 'Hydrate', emoji: '💧', completed: false, type: 'hydration', time: '12:00', timeCategory: 'day' },
  { id: '4', name: 'Move Your Body', emoji: '🚶', completed: false, type: 'movement', time: '15:00', timeCategory: 'day' },
  { id: '5', name: 'Eye Break', emoji: '👀', completed: false, type: 'eye-break', time: '18:00', timeCategory: 'day' },
  { id: '6', name: 'Gratitude Log', emoji: '�', completed: false, type: 'checkin', time: '21:00', timeCategory: 'evening' },
];

type Tab = 'day' | 'bills';
type ScreenView = 'main' | 'profile';

const MyDayScreen: React.FC = () => {
  const { userSettings, isRTL } = useApp();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { getPersonalizedGreeting } = useGreeting();
  const [habits, setHabits] = useState<Habit[]>(defaultHabits);
  const [activeTab, setActiveTab] = useState<Tab>('day');
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ScreenView>('main');
  const menuAnimation = new Animated.Value(0);

  // Animate menu opening/closing
  useEffect(() => {
    Animated.timing(menuAnimation, {
      toValue: menuOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [menuOpen]);

  // Load habits from storage
  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem('@nudgepal_habits');
      if (storedHabits) {
        const parsed = JSON.parse(storedHabits);
        // Check if it's a new day and reset completed status
        const today = new Date().toDateString();
        const resetHabits = parsed.map((habit: Habit) => {
          const completedDate = habit.completedAt ? new Date(habit.completedAt).toDateString() : null;
          return {
            ...habit,
            completed: completedDate === today ? habit.completed : false,
            completedAt: completedDate === today ? habit.completedAt : undefined,
          };
        });
        setHabits(resetHabits);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const saveHabits = async (newHabits: Habit[]) => {
    try {
      await AsyncStorage.setItem('@nudgepal_habits', JSON.stringify(newHabits));
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  };

  const toggleHabit = async (habitId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const isCompleting = !habit.completed;
        return {
          ...habit,
          completed: isCompleting,
          completedAt: isCompleting ? new Date().toISOString() : undefined,
        };
      }
      return habit;
    });

    setHabits(updatedHabits);
    await saveHabits(updatedHabits);
  };

  const getCompletedCount = () => habits.filter(h => h.completed).length;
  const getTotalCount = () => habits.length;
  const getCompletionPercentage = () => Math.round((getCompletedCount() / getTotalCount()) * 100);

  const groupHabitsByTime = () => {
    const morning = habits.filter(h => h.timeCategory === 'morning');
    const day = habits.filter(h => h.timeCategory === 'day');
    const evening = habits.filter(h => h.timeCategory === 'evening');
    return { morning, day, evening };
  };

  const timeGroups = groupHabitsByTime();

  const ProgressRing = ({ percentage, label }: { percentage: number; label: string }) => (
    <View style={styles.ringContainer}>
      <View style={styles.ringWrapper}>
        <View style={styles.ring}>
          <View style={styles.ringInner}>
            <Text style={styles.ringPercentage}>{percentage}%</Text>
            <Text style={styles.ringLabel}>{label}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const HabitCard = ({ habit }: { habit: Habit }) => (
    <TouchableOpacity
      style={[
        styles.habitCardItem,
        habit.completed && styles.habitCardItemCompleted,
        isRTL && styles.habitCardItemRTL,
      ]}
      onPress={() => toggleHabit(habit.id)}
    >
      <View style={styles.habitCardLeft}>
        <Text style={styles.habitEmoji}>{habit.emoji}</Text>
        <View style={styles.habitInfo}>
          <Text style={[styles.habitCardName, { color: colors.text }, isRTL && styles.rtlText]}>
            {habit.name}
          </Text>
          {habit.time && (
            <Text style={[styles.habitTime, { color: colors.textSecondary }, isRTL && styles.rtlText]}>
              {habit.time}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.habitButton,
          habit.completed && styles.habitButtonCompleted,
        ]}
        onPress={() => toggleHabit(habit.id)}
      >
        <Text style={[styles.habitButtonText, habit.completed && styles.habitButtonTextCompleted]}>
          {habit.completed ? '✓' : '○'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const TimeGroup = ({ title, emoji, habits: groupHabits }: { title: string; emoji: string; habits: Habit[] }) => {
    if (groupHabits.length === 0) return null;
    return (
      <View style={styles.timeGroup}>
        <View style={[styles.timeGroupHeader, isRTL && styles.timeGroupHeaderRTL]}>
          <Text style={styles.timeGroupEmoji}>{emoji}</Text>
          <Text style={[styles.timeGroupTitle, { color: colors.text }, isRTL && styles.rtlText]}>{title}</Text>
        </View>
        {groupHabits.map(habit => (
          <HabitCard key={habit.id} habit={habit} />
        ))}
      </View>
    );
  };

  const SlidingMenu = () => {
    const menuItems = [
      { icon: '📊', label: "Today's Overview", id: 'overview' },
      { icon: '💧', label: 'Hydration Tracker', id: 'hydration' },
      { icon: '📝', label: 'My Habits', id: 'habits' },
      { icon: '💰', label: 'My Bills', id: 'bills' },
      { icon: '📈', label: 'Weekly Report', id: 'report' },
      { icon: '⚙️', label: 'Settings', id: 'settings' },
      { icon: '🎨', label: 'Themes', id: 'themes' },
      { icon: '📤', label: 'Backup & Export', id: 'backup' },
    ];

    const menuTranslate = menuAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: isRTL ? [width * 0.85, 0] : [-width * 0.85, 0],
    });

    const backdropOpacity = menuAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.5],
    });

    return (
      <>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.menuBackdrop,
            {
              opacity: backdropOpacity,
              pointerEvents: menuOpen ? 'auto' : 'none',
            },
          ]}
          onTouchEnd={() => setMenuOpen(false)}
        />

        {/* Menu Card */}
        <Animated.View
          style={[
            styles.menuCard,
            isRTL && styles.menuCardRTL,
            {
              transform: [{ translateX: menuTranslate }],
            },
          ]}
        >
          {/* Header with Search and Close */}
          <View style={[styles.menuHeader, isRTL && styles.menuHeaderRTL]}>
            <View style={[styles.searchBar, isRTL && styles.searchBarRTL]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <Text style={styles.searchPlaceholder}>Search...</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMenuOpen(false)}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, isRTL && styles.menuItemRTL]}
                onPress={() => {
                  setMenuOpen(false);
                  // Handle navigation based on item.id
                }}
              >
                <Text style={styles.menuItemIcon}>{item.icon}</Text>
                <Text style={[styles.menuItemLabel, isRTL && styles.rtlText]}>
                  {item.label}
                </Text>
                <Text style={styles.menuItemArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.menuFooter, isRTL && styles.menuFooterRTL]}>
            <Text style={[styles.menuFooterName, isRTL && styles.rtlText]}>
              {userSettings.name}
            </Text>
            <Text style={[styles.menuFooterVersion, isRTL && styles.rtlText]}>
              v1.0.0
            </Text>
          </View>
        </Animated.View>
      </>
    );
  };

  const renderMyDay = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={[styles.greetingSection, isRTL && styles.greetingSectionRTL]}>
        <Text style={[styles.greeting, { color: colors.text }, isRTL && styles.rtlText]}>
          {getPersonalizedGreeting()}
        </Text>
        <Text style={[styles.todayDate, { color: colors.textSecondary }, isRTL && styles.rtlText]}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>
      </View>
      <View style={styles.progressRingsContainer}>
        <ProgressRing percentage={getCompletionPercentage()} label="Habits" />
        <ProgressRing percentage={75} label="Bills" />
      </View>
      <View style={styles.habitsContainer}>
        <TimeGroup title="Morning" emoji="🌅" habits={timeGroups.morning} />
        <TimeGroup title="Throughout the Day" emoji="🌞" habits={timeGroups.day} />
        <TimeGroup title="Evening" emoji="🌙" habits={timeGroups.evening} />
      </View>
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  const renderMyBills = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>📋</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }, isRTL && styles.rtlText]}>No Bills Added Yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }, isRTL && styles.rtlText]}>
          Track your recurring expenses and never miss a payment
        </Text>
        <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.emptyButtonText, { color: '#ffffff' }]}>Add Your First Bill</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  if (currentView === 'profile') {
    return <ProfileScreen onBack={() => setCurrentView('main')} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      <LinearGradient 
        colors={isDark ? [colors.surface, colors.background] : ['#f8fafc', '#f1f5f9']} 
        style={styles.gradient}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }, isRTL && styles.headerRTL]}>
          <View style={[styles.headerIcons, isRTL && styles.headerIconsRTL]}>
            <TouchableOpacity style={styles.headerIcon} onPress={() => setMenuOpen(!menuOpen)}>
              <Text style={[styles.headerIconText, { color: colors.text }]}>☰</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => setCurrentView('profile')}
            >
              <Text style={[styles.headerIconText, { color: colors.text }]}>👤</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerSpacer} />
          <View style={styles.headerRight}>
            <Text style={[styles.logo, { color: colors.text }]}>NudgePal</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabContainer, isRTL && styles.tabContainerRTL]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'day' && styles.tabActive]}
            onPress={() => setActiveTab('day')}
          >
            <Text style={[styles.tabText, activeTab === 'day' && styles.tabTextActive, { color: activeTab === 'day' ? colors.text : colors.textSecondary }]}>
              My Day
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bills' && styles.tabActive, { borderBottomColor: activeTab === 'bills' ? colors.primary : 'transparent' }]}
            onPress={() => setActiveTab('bills')}
          >
            <Text style={[styles.tabText, activeTab === 'bills' && styles.tabTextActive, { color: activeTab === 'bills' ? colors.text : colors.textSecondary }]}>
              My Bills
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {activeTab === 'day' ? renderMyDay() : renderMyBills()}
        </View>

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* Bottom Navigation */}
        <View style={[styles.bottomNav, isRTL && styles.bottomNavRTL]}>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navItemText}>🏠</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navItemText}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navItemText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navItemText}>⋯</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Sliding Menu - Overlay on Top */}
      <SlidingMenu />
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerSpacer: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeftRTL: {
    flexDirection: 'row-reverse',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  headerIconsRTL: {
    flexDirection: 'row-reverse',
  },
  headerIcon: {
    padding: 8,
  },
  headerIconText: {
    fontSize: 20,
    color: '#1e293b',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: 'white',
    paddingHorizontal: 20,
  },
  tabContainerRTL: {
    flexDirection: 'row-reverse',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  greetingSection: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  greetingSectionRTL: {
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  todayDate: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  rtlText: {
    textAlign: 'right',
  },
  progressRingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8fafc',
    borderWidth: 8,
    borderColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    alignItems: 'center',
  },
  ringPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  ringLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  habitsContainer: {
    marginBottom: 30,
  },
  timeGroup: {
    marginBottom: 25,
  },
  timeGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeGroupHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  timeGroupEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  timeGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  habitCardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#e2e8f0',
  },
  habitCardItemRTL: {
    flexDirection: 'row-reverse',
    borderLeftWidth: 0,
    borderRightWidth: 4,
    borderRightColor: '#e2e8f0',
  },
  habitCardItemCompleted: {
    backgroundColor: '#f0f9ff',
    borderLeftColor: '#06b6d4',
  },
  habitCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  habitTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  habitButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  habitButtonCompleted: {
    backgroundColor: '#06b6d4',
    borderColor: '#06b6d4',
  },
  habitButtonText: {
    fontSize: 16,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  habitButtonTextCompleted: {
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 12,
  },
  bottomNavRTL: {
    flexDirection: 'row-reverse',
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  navItemText: {
    fontSize: 24,
  },
  bottomSpacing: {
    height: 40,
  },
  // Menu Styles
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
  menuCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '85%',
    backgroundColor: 'white',
    zIndex: 101,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    transform: [
      {
        translateX: 0,
      },
    ],
  },
  menuCardRTL: {
    left: 'auto',
    right: 0,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    shadowOffset: { width: -4, height: 0 },
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
  },
  menuHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 12,
  },
  searchBarRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  menuItems: {
    flex: 1,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemRTL: {
    flexDirection: 'row-reverse',
  },
  menuItemIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  menuItemArrow: {
    fontSize: 18,
    color: '#cbd5e1',
    marginLeft: 8,
  },
  menuFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  menuFooterRTL: {
    alignItems: 'flex-end',
  },
  menuFooterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  menuFooterVersion: {
    fontSize: 12,
    color: '#94a3b8',
  },
});

export default MyDayScreen;