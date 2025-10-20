import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Animated,
  Easing,
  Dimensions,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { SharedHeader } from '../components/SharedHeader';

interface DiaryEntry {
  date: string;
  title: string;
  content: string;
  createdAt: string;
}

interface Reminder {
  id: string;
  date: string;
  title: string;
  time: string;
  repeat: 'never' | 'daily' | 'weekly' | 'monthly';
  createdAt: string;
}

interface CalendarScreenProps {
  onMenuPress?: () => void;
  onProfilePress: () => void;
  showRemindersTutorial?: boolean;
  onTutorialClose?: () => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  onMenuPress,
  onProfilePress,
  showRemindersTutorial = false,
  onTutorialClose,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [diaries, setDiaries] = useState<{ [key: string]: DiaryEntry }>({});
  const [reminders, setReminders] = useState<{ [key: string]: Reminder[] }>({});
  
  // Modal states
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showViewDiaryModal, setShowViewDiaryModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  
  // Form states for diary
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryContent, setDiaryContent] = useState('');
  const [isEditingDiary, setIsEditingDiary] = useState(false);
  
  // Form states for reminder
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderTime, setReminderTime] = useState('10:00 AM');
  const [reminderRepeat, setReminderRepeat] = useState<'never' | 'daily' | 'weekly' | 'monthly'>('never');
  
  // Tutorial popup states
  const [showTutorialPopup, setShowTutorialPopup] = useState(showRemindersTutorial);
  const [popupScaleAnim] = useState(new Animated.Value(0));
  const [popupFadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(0));

  // Animation values
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const modalScaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const monthFadeAnim = React.useRef(new Animated.Value(1)).current;
  const legendSlideAnim = React.useRef(new Animated.Value(30)).current;
  const legendFadeAnim = React.useRef(new Animated.Value(0)).current;
  const statsSlideAnim = React.useRef(new Animated.Value(30)).current;
  const statsFadeAnim = React.useRef(new Animated.Value(0)).current;

  // Pulse animation for indicator dots
  const pulseDot1 = React.useRef(new Animated.Value(1)).current;
  const pulseDot2 = React.useRef(new Animated.Value(1)).current;

  // Day card tap animation
  const dayCardScaleAnim = React.useRef(new Animated.Value(1)).current;

  // Day card stagger animations
  const dayCardAnims = React.useRef<Animated.Value[]>([]).current;
  if (dayCardAnims.length === 0) {
    for (let i = 0; i < 42; i++) {
      dayCardAnims.push(new Animated.Value(0));
    }
  }

  // Backdrop animation
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    // Page entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger legend and stats cards
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(legendFadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(legendSlideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(statsFadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(statsSlideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);

    // Start pulse animation loop for indicator dots
    const startPulseAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseDot1, {
            toValue: 1.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseDot1, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseDot2, {
              toValue: 1.3,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseDot2, {
              toValue: 1,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, 150);
    };

    setTimeout(startPulseAnimation, 600);

    // Stagger animation for day cards
    const animateDayCardStagger = () => {
      const animations = dayCardAnims.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          delay: index * 25,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      );
      Animated.parallel(animations).start();
    };

    setTimeout(animateDayCardStagger, 500);
  }, []);

  // Tutorial popup animation
  useEffect(() => {
    if (showRemindersTutorial) {
      setShowTutorialPopup(true);
      
      // Smooth entrance animation
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
    }
  }, [showRemindersTutorial]);

  const loadData = async () => {
    try {
      const diariesData = await AsyncStorage.getItem('diaries');
      const remindersData = await AsyncStorage.getItem('reminders');
      
      if (diariesData) {
        setDiaries(JSON.parse(diariesData));
      }
      if (remindersData) {
        setReminders(JSON.parse(remindersData));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async (newDiaries?: any, newReminders?: any) => {
    try {
      if (newDiaries) {
        await AsyncStorage.setItem('diaries', JSON.stringify(newDiaries));
        setDiaries(newDiaries);
      }
      if (newReminders) {
        await AsyncStorage.setItem('reminders', JSON.stringify(newReminders));
        setReminders(newReminders);
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const isToday = (dateStr: string): boolean => {
    return dateStr === new Date().toISOString().split('T')[0];
  };

  const isPastDate = (dateStr: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  };

  const hasDiary = (dateStr: string): boolean => {
    return !!diaries[dateStr];
  };

  const hasReminders = (dateStr: string): boolean => {
    return !!(reminders[dateStr] && reminders[dateStr].length > 0);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDayPress = (day: number) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    )
      .toISOString()
      .split('T')[0];
    
    setSelectedDate(dateStr);
    
    // Day card tap animation
    dayCardScaleAnim.setValue(0.95);
    Animated.sequence([
      Animated.timing(dayCardScaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(dayCardScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    animateZoom();
    setShowDateOptions(true);
  };

  const animateZoom = () => {
    scaleAnim.setValue(0.8);
    backdropOpacity.setValue(0);
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    backdropOpacity.setValue(1);
    Animated.timing(backdropOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowDateOptions(false);
    });
  };

  const handleSaveDiary = async () => {
    if (!selectedDate) return;
    
    if (!diaryTitle.trim() || !diaryContent.trim()) {
      Alert.alert(t.calendar_screen.required, t.calendar_screen.fillBothFields);
      return;
    }

    const newDiaries = {
      ...diaries,
      [selectedDate]: {
        date: selectedDate,
        title: diaryTitle,
        content: diaryContent,
        createdAt: new Date().toISOString(),
      },
    };

    await saveData(newDiaries);
    setShowDiaryModal(false);
    setDiaryTitle('');
    setDiaryContent('');
    setIsEditingDiary(false);
  };

  const handleSaveReminder = async () => {
    if (!selectedDate) return;
    
    if (!reminderTitle.trim()) {
      Alert.alert(t.calendar_screen.required, t.calendar_screen.enterReminderTitle);
      return;
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      date: selectedDate,
      title: reminderTitle,
      time: reminderTime,
      repeat: reminderRepeat,
      createdAt: new Date().toISOString(),
    };

    const newReminders = {
      ...reminders,
      [selectedDate]: [...(reminders[selectedDate] || []), newReminder],
    };

    await saveData(undefined, newReminders);
    setShowReminderModal(false);
    setReminderTitle('');
    setReminderTime('10:00 AM');
    setReminderRepeat('never');
    Alert.alert(t.calendar_screen.success, t.calendar_screen.reminderSaved);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!selectedDate) return;

    Alert.alert(t.calendar_screen.deleteReminder, t.calendar_screen.areYouSure, [
      { text: t.calendar_screen.cancel, style: 'cancel' },
      {
        text: t.calendar_screen.delete,
        style: 'destructive',
        onPress: async () => {
          const newReminders = {
            ...reminders,
            [selectedDate]: reminders[selectedDate].filter((r) => r.id !== reminderId),
          };

          if (newReminders[selectedDate].length === 0) {
            delete newReminders[selectedDate];
          }

          await saveData(undefined, newReminders);
        },
      },
    ]);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const weeks: any[] = [];
    let currentWeek: any[] = [];
    let dayCardIndex = 0;

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(
        <View key={`empty-${i}`} style={[styles.dayCardEmpty, { flex: 1 }]} />
      );
      dayCardIndex++;
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      )
        .toISOString()
        .split('T')[0];
      
      const _isToday = isToday(dateStr);
      const _hasDiary = hasDiary(dateStr);
      const _hasReminders = hasReminders(dateStr);
      const _isPast = isPastDate(dateStr);

      currentWeek.push(
        <Animated.View
          key={day}
          style={{
            flex: 1,
            opacity: dayCardAnims[dayCardIndex],
            transform: [{ scale: dayCardAnims[dayCardIndex].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
          }}
        >
          <TouchableOpacity
            onPress={() => handleDayPress(day)}
            style={[
              styles.simpleDayCard,
              {
                backgroundColor: _isToday 
                  ? 'transparent' 
                  : colors.surface,
                borderWidth: _isToday ? 2 : 0,
                borderColor: _isToday ? colors.primary : 'transparent',
                opacity: _isPast ? 0.6 : 1,
              },
            ]}
            activeOpacity={0.7}
          >
            {/* Day number */}
            <Text
              style={[
                styles.simpleDayNumber,
                {
                  color: _isToday ? colors.primary : colors.text,
                  fontWeight: _isToday ? '800' : '600',
                },
              ]}
            >
              {day}
            </Text>

            {/* Activity indicator dots below number */}
            <View style={styles.activityIndicators}>
              {_hasDiary && (
                <Animated.View style={[styles.indicatorDot, { backgroundColor: colors.primary, transform: [{ scale: pulseDot1 }] }]} />
              )}
              {_hasReminders && (
                <Animated.View style={[styles.indicatorDot, { backgroundColor: colors.warning || '#ff9800', transform: [{ scale: pulseDot2 }] }]} />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
      dayCardIndex++;

      // End of week (Saturday) or end of month
      if ((day + firstDay) % 7 === 0 || day === daysInMonth) {
        // Fill remaining days with empty cells if month ends before Saturday
        if (day === daysInMonth && (day + firstDay) % 7 !== 0) {
          const remainingCells = 7 - (currentWeek.length % 7);
          for (let i = 0; i < remainingCells && remainingCells !== 7; i++) {
            currentWeek.push(
              <View key={`empty-end-${i}`} style={[styles.dayCardEmpty, { flex: 1 }]} />
            );
          }
        }
        
        weeks.push(
          <View key={`week-${weeks.length}`} style={styles.simpleWeekRow}>
            {currentWeek}
          </View>
        );
        currentWeek = [];
      }
    }

    return weeks;
  };

  const monthNames = t.calendar_screen.monthNames;

  const goToPreviousMonth = () => {
    monthFadeAnim.setValue(1);
    Animated.sequence([
      Animated.timing(monthFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(monthFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    monthFadeAnim.setValue(1);
    Animated.sequence([
      Animated.timing(monthFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(monthFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const formatDateDisplay = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      {/* Header */}
      <SharedHeader 
        title={t.calendar_screen.title} 
        onProfilePress={onProfilePress} 
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Today Badge */}
        <View style={[styles.todayBadgeContainer, { paddingHorizontal: 16, paddingTop: 16 }]}>
          <View style={[styles.todayBadge]}>
            <Text style={[styles.todayBadgeText, { color: colors.primary }]}>
              {t.calendar_screen.todayBadge}: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Month Navigation Card */}
        <View style={[styles.monthNavigationCard]}>
          <TouchableOpacity 
            onPress={goToPreviousMonth}
            style={[styles.navIconButton]}
          >
            <Text style={[styles.navIconText, { color: colors.primary }]}>
              {t.calendar_screen.prevMonth}
            </Text>
          </TouchableOpacity>
          <View style={styles.monthDisplayContainer}>
            <Text style={[styles.monthText, { color: colors.text }]}>
              {monthNames[currentDate.getMonth()]}
            </Text>
            <Text style={[styles.yearText, { color: colors.textSecondary }]}>
              {currentDate.getFullYear()}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={goToNextMonth}
            style={[styles.navIconButton]}
          >
            <Text style={[styles.navIconText, { color: colors.primary }]}>
              {t.calendar_screen.nextMonth}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View
          style={[
            styles.dayHeaders,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          {t.calendar_screen.dayHeaders.map((day) => (
            <View key={day} style={styles.dayHeaderCell}>
              <Text
                style={[
                  styles.dayHeaderText,
                  { color: colors.textSecondary },
                ]}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View
          style={[
            styles.calendarGridContainer,
            {
              backgroundColor: colors.background,
            },
          ]}
        >
          <View style={styles.modernCalendarGrid}>
            {renderCalendar()}
          </View>
        </View>

        {/* Legend Card */}
        <Animated.View style={[styles.legendCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: legendFadeAnim, transform: [{ translateY: legendSlideAnim }] }]}>
          <Text style={[styles.legendCardTitle, { color: colors.text }]}>📊 {t.calendar_screen.legend}</Text>
          
          <View style={styles.legendItemsRow}>
            <View style={styles.legendItemSmall}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendItemText, { color: colors.text }]}>{t.calendar_screen.diary}</Text>
            </View>
            
            <View style={styles.legendItemSmall}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning || '#ff9800' }]} />
              <Text style={[styles.legendItemText, { color: colors.text }]}>{t.calendar_screen.reminders}</Text>
            </View>
            
            <View style={styles.legendItemSmall}>
              <View 
                style={[
                  styles.legendDot, 
                  { 
                    backgroundColor: 'transparent', 
                    borderWidth: 2, 
                    borderColor: colors.primary 
                  }
                ]} 
              />
              <Text style={[styles.legendItemText, { color: colors.text }]}>{t.calendar_screen.today}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats Card */}
        <Animated.View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: statsFadeAnim, transform: [{ translateY: statsSlideAnim }] }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>📈 {t.calendar_screen.activity}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {Object.keys(diaries).filter(date => {
                  const dateObj = new Date(date);
                  return dateObj.getMonth() === currentDate.getMonth() && 
                         dateObj.getFullYear() === currentDate.getFullYear();
                }).length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.calendar_screen.diaries}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {Object.keys(reminders).reduce((sum, key) => {
                  const dateObj = new Date(key);
                  if (dateObj.getMonth() === currentDate.getMonth() && 
                      dateObj.getFullYear() === currentDate.getFullYear()) {
                    return sum + (reminders[key]?.length || 0);
                  }
                  return sum;
                }, 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.calendar_screen.reminders}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Empty State Hint */}
        <View style={[styles.emptyHintCard, { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }]}>
          <Text style={[styles.emptyHintText, { color: colors.primary }]}>
            {t.calendar_screen.tapDateHint}
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Date Options Modal */}
      <Modal
        visible={showDateOptions}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Animated.View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)', opacity: backdropOpacity }]}>
          <Animated.View
            style={[
              styles.dateOptionsModal,
              {
                backgroundColor: colors.surface,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {selectedDate && formatDateDisplay(selectedDate)}
            </Text>

            <View style={styles.optionsContainer}>
              {selectedDate && !isPastDate(selectedDate) && (
                <>
                  <TouchableOpacity
                    style={[styles.optionButton, { borderColor: colors.primary, backgroundColor: `${colors.primary}10` }]}
                    onPress={() => {
                      setShowDateOptions(false);
                      if (hasDiary(selectedDate)) {
                        setDiaryTitle(diaries[selectedDate].title);
                        setDiaryContent(diaries[selectedDate].content);
                        setIsEditingDiary(true);
                      } else {
                        setDiaryTitle('');
                        setDiaryContent('');
                        setIsEditingDiary(false);
                      }
                      setShowDiaryModal(true);
                    }}
                  >
                    <Text style={[styles.optionButtonText, { color: colors.primary }]}>
                      ✏️ {hasDiary(selectedDate) ? t.calendar_screen.editDiary : t.calendar_screen.newDiary}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionButton, { borderColor: colors.primary, backgroundColor: `${colors.primary}10` }]}
                    onPress={() => {
                      setShowDateOptions(false);
                      setReminderTitle('');
                      setReminderTime('10:00 AM');
                      setReminderRepeat('never');
                      setShowReminderModal(true);
                    }}
                  >
                    <Text style={[styles.optionButtonText, { color: colors.primary }]}>
                      ⏰ {t.calendar_screen.addReminder}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {selectedDate && hasDiary(selectedDate) && (
                <TouchableOpacity
                  style={[styles.optionButton, { borderColor: colors.primary, backgroundColor: `${colors.primary}10` }]}
                  onPress={() => {
                    setShowDateOptions(false);
                    setDiaryTitle(diaries[selectedDate].title);
                    setDiaryContent(diaries[selectedDate].content);
                    setShowViewDiaryModal(true);
                  }}
                >
                  <Text style={[styles.optionButtonText, { color: colors.primary }]}>
                    📖 {t.calendar_screen.diary}
                  </Text>
                </TouchableOpacity>
              )}

              {selectedDate && hasReminders(selectedDate) && (
                <TouchableOpacity
                  style={[styles.optionButton, { borderColor: colors.primary, backgroundColor: `${colors.primary}10` }]}
                  onPress={() => {
                    setShowDateOptions(false);
                    setShowReminderModal(true);
                  }}
                >
                  <Text style={[styles.optionButtonText, { color: colors.primary }]}>
                    📋 {t.calendar_screen.reminders} ({reminders[selectedDate]?.length || 0})
                  </Text>
                </TouchableOpacity>
              )}

              {selectedDate && isPastDate(selectedDate) && !hasDiary(selectedDate) && (
                <Text style={[styles.pastDateText, { color: colors.textSecondary }]}>
                  ⚠️ {t.calendar_screen.areYouSure}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.border }]}
              onPress={closeModal}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>{t.calendar_screen.close}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* View Diary Modal (Read-Only) */}
      <Modal
        visible={showViewDiaryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowViewDiaryModal(false)}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View
            style={[
              styles.header,
              { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top },
            ]}
          >
            <TouchableOpacity onPress={() => setShowViewDiaryModal(false)}>
              <Text style={[styles.backButtonText, { color: colors.primary }]}>← {t.calendar_screen.back}</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>📖 {t.calendar_screen.diary}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.viewDiaryContainer} showsVerticalScrollIndicator={false}>
            {/* Decorative Header */}
            <View style={[styles.diaryHeaderSection, { backgroundColor: colors.surface }]}>
              <View style={[styles.diaryIconCircle, { backgroundColor: `${colors.primary}15` }]}>
                <Text style={styles.diaryIconLarge}>📖</Text>
              </View>
              <Text style={[styles.diaryHeaderDate, { color: colors.textSecondary }]}>
                {selectedDate && formatDateDisplay(selectedDate)}
              </Text>
            </View>

            {/* Main Content Card */}
            <View style={[styles.diaryMainCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Title Section */}
              <View style={styles.diaryTitleSection}>
                <Text style={[styles.diaryTitleText, { color: colors.text }]}>
                  {diaryTitle}
                </Text>
              </View>

              {/* Divider */}
              <View style={[styles.diaryDivider, { backgroundColor: colors.border }]} />

              {/* Content Section */}
              <View style={styles.diaryContentSection}>
                <Text style={[styles.diaryContentText, { color: colors.text }]}>
                  {diaryContent}
                </Text>
              </View>

              {/* Action Buttons - Only for current/future dates */}
              {selectedDate && !isPastDate(selectedDate) && (
                <View style={styles.diaryActionButtons}>
                  <TouchableOpacity
                    style={[styles.diaryEditButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      setShowViewDiaryModal(false);
                      setIsEditingDiary(true);
                      setShowDiaryModal(true);
                    }}
                  >
                    <Text style={styles.diaryActionButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.diaryDeleteButton, { backgroundColor: '#ef4444' }]}
                    onPress={() => {
                      Alert.alert(
                        t.calendar_screen.deleteDiary,
                        t.calendar_screen.deleteEntry,
                        [
                          { text: t.calendar_screen.cancel, style: 'cancel' },
                          {
                            text: t.calendar_screen.delete,
                            style: 'destructive',
                            onPress: async () => {
                              const newDiaries = { ...diaries };
                              delete newDiaries[selectedDate || ''];
                              await saveData(newDiaries);
                              setShowViewDiaryModal(false);
                              setDiaryTitle('');
                              setDiaryContent('');
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.diaryActionButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Write Diary Modal */}
      <Modal
        visible={showDiaryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDiaryModal(false)}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.header,
              { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top },
            ]}
          >
            <TouchableOpacity onPress={() => setShowDiaryModal(false)}>
              <Text style={[styles.backButtonText, { color: colors.primary }]}>← {t.calendar_screen.back}</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              ✏️ {isEditingDiary ? t.calendar_screen.edit : t.calendar_screen.new} {t.calendar_screen.diary}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.diaryForm} showsVerticalScrollIndicator={false}>
            <View style={styles.formSection}>
              <Text style={[styles.diaryLabel, { color: colors.text }]}>
                {selectedDate && formatDateDisplay(selectedDate)}
              </Text>

              <Text style={[styles.formLabel, { color: colors.text, marginTop: 20 }]}>{t.calendar_screen.diaryTitle}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder={t.calendar_screen.enterDiaryTitle}
                placeholderTextColor={colors.textSecondary}
                value={diaryTitle}
                onChangeText={setDiaryTitle}
              />

              <Text style={[styles.formLabel, { color: colors.text, marginTop: 16 }]}>{t.calendar_screen.diaryContent}</Text>
              <TextInput
                style={[styles.textAreaInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder={t.calendar_screen.shareThoughts}
                placeholderTextColor={colors.textSecondary}
                value={diaryContent}
                onChangeText={setDiaryContent}
                multiline
                numberOfLines={10}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary, flex: 1 }]}
                  onPress={handleSaveDiary}
                >
                  <Text style={styles.buttonText}>💾 {t.calendar_screen.saveDiary}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.textSecondary, flex: 1, marginLeft: 12 }]}
                  onPress={() => setShowDiaryModal(false)}
                >
                  <Text style={styles.buttonText}>{t.calendar_screen.cancel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Reminder Modal */}
      <Modal
        visible={showReminderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReminderModal(false)}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.header,
              { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top },
            ]}
          >
            <TouchableOpacity onPress={() => setShowReminderModal(false)}>
              <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              ⏰ Reminders
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.reminderForm} showsVerticalScrollIndicator={false}>
            {selectedDate && !isPastDate(selectedDate) && (
              <View style={styles.formSection}>
                <Text style={[styles.diaryLabel, { color: colors.text, marginBottom: 16 }]}>
                  Add New Reminder
                </Text>

                <Text style={[styles.formLabel, { color: colors.text }]}>Reminder</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder={t.calendar_screen.enterReminderText}
                  placeholderTextColor={colors.textSecondary}
                  value={reminderTitle}
                  onChangeText={setReminderTitle}
                />

                <Text style={[styles.formLabel, { color: colors.text, marginTop: 16 }]}>{t.calendar_screen.reminderTime}</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder={t.calendar_screen.timeExample}
                  placeholderTextColor={colors.textSecondary}
                  value={reminderTime}
                  onChangeText={setReminderTime}
                />

                <Text style={[styles.formLabel, { color: colors.text, marginTop: 16 }]}>{t.calendar_screen.repeatOption}</Text>
                <View style={styles.repeatRow}>
                  {(['never', 'daily', 'weekly', 'monthly'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.repeatButton,
                        {
                          backgroundColor: reminderRepeat === option ? colors.primary : colors.surface,
                          borderColor: reminderRepeat === option ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setReminderRepeat(option)}
                    >
                      <Text
                        style={[
                          styles.repeatButtonText,
                          { color: reminderRepeat === option ? '#fff' : colors.text },
                        ]}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary, marginTop: 24 }]}
                  onPress={handleSaveReminder}
                >
                  <Text style={styles.buttonText}>💾 {t.calendar_screen.saveReminder}</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedDate && hasReminders(selectedDate) && (
              <View style={styles.formSection}>
                <Text style={[styles.remindersListTitle, { color: colors.text }]}>
                  {t.calendar_screen.yourReminders}
                </Text>
                {reminders[selectedDate]?.map((reminder) => (
                  <View key={reminder.id} style={[styles.reminderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.reminderInfo}>
                      <Text style={[styles.reminderTitle, { color: colors.text }]}>
                        {reminder.title}
                      </Text>
                      <Text style={[styles.reminderMeta, { color: colors.textSecondary }]}>
                        ⏰ {reminder.time} • {reminder.repeat}
                      </Text>
                    </View>
                    {!isPastDate(selectedDate) && (
                      <TouchableOpacity
                        onPress={() => handleDeleteReminder(reminder.id)}
                        style={styles.deleteReminderButton}
                      >
                        <Text style={styles.deleteReminder}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {selectedDate && isPastDate(selectedDate) && (
              <View style={styles.formSection}>
                <Text style={[styles.pastDateText, { color: colors.textSecondary }]}>
                  ⚠️ {t.calendar_screen.cannotAddReminders}
                </Text>
              </View>
            )}

            {!selectedDate && (
              <View style={styles.formSection}>
                <Text style={[styles.pastDateText, { color: colors.textSecondary }]}>
                  {t.calendar_screen.noRemindersYet}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Tutorial Popup for Reminders */}
      <Modal visible={showTutorialPopup} transparent={true} animationType="none">
        <Animated.View style={[styles.popupOverlay, { opacity: popupFadeAnim }]}>
          <Animated.View style={[
            styles.popupContainer,
            {
              transform: [
                { scale: popupScaleAnim },
                { translateY: popupScaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  })
                },
              ],
            },
          ]}>
            {/* Header Section */}
            <View style={[styles.popupHeaderGradient, { backgroundColor: colors.primary }]}>
              <View style={styles.popupHeaderContent}>
                <View style={styles.popupIconContainer}>
                  <Text style={styles.popupIconBig}>📅</Text>
                </View>
                <Text style={styles.popupMainTitle}>{t.calendar_tutorial.title}</Text>
                <TouchableOpacity
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
                      onTutorialClose?.();
                    });
                  }}
                  style={styles.popupCloseBtn}
                >
                  <Text style={styles.popupCloseBtnText}>✕</Text>
                </TouchableOpacity>
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
                  <Text style={[styles.popupStepTitle, { color: colors.text }]}>{t.calendar_tutorial.step1Title}</Text>
                  <Text style={[styles.popupStepDesc, { color: colors.textSecondary }]}>
                    {t.calendar_tutorial.step1Desc}
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
                  <Text style={[styles.popupStepTitle, { color: colors.text }]}>{t.calendar_tutorial.step2Title}</Text>
                  <Text style={[styles.popupStepDesc, { color: colors.textSecondary }]}>
                    {t.calendar_tutorial.step2Desc}
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
                  <Text style={[styles.popupStepTitle, { color: colors.text }]}>{t.calendar_tutorial.step3Title}</Text>
                  <Text style={[styles.popupStepDesc, { color: colors.textSecondary }]}>
                    {t.calendar_tutorial.step3Desc}
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
                  {t.calendar_tutorial.tip}
                </Text>
              </Animated.View>

              {/* Action Button */}
              <TouchableOpacity
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
                    onTutorialClose?.();
                  });
                }}
                style={[styles.popupButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.popupButtonText}>{t.calendar_tutorial.ctaButton}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </Animated.View>
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
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  navButton: {
    fontSize: 20,
    fontWeight: '600',
    padding: 8,
  },
  dayHeaders: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Modern Calendar Grid Styles
  modernCalendarGrid: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  simpleWeekRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  simpleDayCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 50,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  modernDayCard: {
    flex: 1,
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCardEmpty: {
    flex: 1,
    aspectRatio: 1,
  },
  simpleDayNumber: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  activityIndicators: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayCardIndicators: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    gap: 2.5,
  },
  indicatorBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  indicatorEmoji: {
    fontSize: 11,
    fontWeight: '700',
  },
  modernDayNumber: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  todayAccentBar: {
    position: 'absolute',
    bottom: 6,
    width: 28,
    height: 3.5,
    borderRadius: 2,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  calendarGridContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 4,
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  indicatorRow: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  // Badge styles
  todayBadgeContainer: {
    width: '100%',
  },
  todayBadge: {
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  todayBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Month Navigation Card
  monthNavigationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 0,
    borderWidth: 0,
  },
  navIconButton: {
    width: 44,
    height: 44,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  navIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  monthDisplayContainer: {
    alignItems: 'center',
    flex: 1,
  },
  monthText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  yearText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  // Legend Card
  legendCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  legendCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  legendItemsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItemSmall: {
    alignItems: 'center',
  },
  legendDot: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    marginBottom: 8,
  },
  legendItemText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Stats Card
  statsCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  statDivider: {
    width: 1.5,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  // Empty Hint Card
  emptyHintCard: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyHintText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateOptionsModal: {
    borderRadius: 20,
    padding: 24,
    maxWidth: '88%',
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  optionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  closeButton: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pastDateText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // View Diary styles
  viewDiaryContainer: {
    flex: 1,
    padding: 0,
  },
  diaryHeaderSection: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  diaryIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  diaryIconLarge: {
    fontSize: 48,
  },
  diaryHeaderDate: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  diaryMainCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  diaryTitleSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  diaryTitleText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  diaryDivider: {
    height: 2,
    marginHorizontal: 24,
    marginVertical: 16,
  },
  diaryContentSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  diaryContentText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  diaryActionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  diaryEditButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  diaryDeleteButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  diaryActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Diary Form styles
  diaryForm: {
    flex: 1,
  },
  formSection: {
    padding: 16,
  },
  diaryLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    marginTop: 8,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    marginTop: 8,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Reminder Form styles
  reminderForm: {
    flex: 1,
  },
  repeatRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  repeatButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: '22%',
  },
  repeatButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  remindersListTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  reminderCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  reminderMeta: {
    fontSize: 12,
  },
  deleteReminderButton: {
    padding: 8,
  },
  deleteReminder: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ef4444',
  },
  // ===== Tutorial Popup Styles =====
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
