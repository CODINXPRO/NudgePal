import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HydrationData {
  lastDrink: Date | null;
  dailyIntake: number; // ml
  goal: number; // ml
  timerMinutes: number;
}

const HydrationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userSettings, isRTL } = useApp();
  const { t } = useTranslation();
  const [hydrationData, setHydrationData] = useState<HydrationData>({
    lastDrink: null,
    dailyIntake: 0,
    goal: userSettings.hydrationGoal,
    timerMinutes: 0,
  });
  
  const [waveAnimation] = useState(new Animated.Value(0));
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Load hydration data
  useEffect(() => {
    loadHydrationData();
    startWaveAnimation();
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  // Update timer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      updateTimer();
    }, 60000); // Update every minute

    setTimerInterval(interval as any);
    return () => clearInterval(interval);
  }, [hydrationData.lastDrink]);

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadHydrationData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('@nudgepal_hydration');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        const today = new Date().toDateString();
        const dataDate = parsed.lastDrink ? new Date(parsed.lastDrink).toDateString() : null;
        
        // Reset daily intake if it's a new day
        const dailyIntake = dataDate === today ? parsed.dailyIntake : 0;
        
        setHydrationData({
          ...parsed,
          lastDrink: parsed.lastDrink ? new Date(parsed.lastDrink) : null,
          dailyIntake,
          goal: userSettings.hydrationGoal,
        });
        
        updateTimer();
      }
    } catch (error) {
      console.error('Error loading hydration data:', error);
    }
  };

  const saveHydrationData = async (data: HydrationData) => {
    try {
      await AsyncStorage.setItem('@nudgepal_hydration', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving hydration data:', error);
    }
  };

  const updateTimer = () => {
    if (hydrationData.lastDrink) {
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - hydrationData.lastDrink.getTime()) / (1000 * 60));
      setHydrationData(prev => ({ ...prev, timerMinutes: diffMinutes }));
    }
  };

  const recordDrink = async (amount: number = 250) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const now = new Date();
    const newData = {
      ...hydrationData,
      lastDrink: now,
      dailyIntake: hydrationData.dailyIntake + amount,
      timerMinutes: 0,
    };
    
    setHydrationData(newData);
    await saveHydrationData(newData);
  };

  const getProgressPercentage = () => {
    return Math.min((hydrationData.dailyIntake / hydrationData.goal) * 100, 100);
  };

  const getTimeUntilNextDrink = () => {
    const targetInterval = userSettings.hydrationInterval; // 75 minutes
    const elapsed = hydrationData.timerMinutes;
    const remaining = Math.max(0, targetInterval - elapsed);
    return remaining;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const WaterGlass = () => {
    const fillHeight = getProgressPercentage();
    const waveTranslateY = waveAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -10],
    });

    return (
      <View style={styles.glassContainer}>
        <View style={styles.glass}>
          {/* Water fill */}
          <View style={[styles.waterFill, { height: `${fillHeight}%` }]}>
            <Animated.View
              style={[
                styles.wave,
                {
                  transform: [{ translateY: waveTranslateY }],
                },
              ]}
            />
          </View>
          
          {/* Glass rim */}
          <View style={styles.glassRim} />
          
          {/* Volume indicator */}
          <View style={styles.volumeIndicator}>
            <Text style={styles.volumeText}>
              {hydrationData.dailyIntake}ml
            </Text>
            <Text style={styles.goalText}>
              / {hydrationData.goal}ml
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const timeRemaining = getTimeUntilNextDrink();
  const isTimeForDrink = timeRemaining === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#06b6d4', '#0891b2', '#0e7490']}
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
            {t.hydration.hydration}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Greeting */}
          <Text style={[styles.greeting, isRTL && styles.rtlText]}>
            {userSettings.name ? `${t.greetings.hi}, ${userSettings.name}!` : `${t.greetings.hi}!`}
          </Text>

          {/* Water Glass */}
          <WaterGlass />

          {/* Progress Percentage */}
          <Text style={styles.progressText}>
            {Math.round(getProgressPercentage())}% {t.hydration_screen.progressPercent}
          </Text>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            {isTimeForDrink ? (
              <View style={styles.drinkPrompt}>
                <Text style={styles.drinkPromptEmoji}>💧</Text>
                <Text style={[styles.drinkPromptText, isRTL && styles.rtlText]}>
                  {t.hydration_screen.timeToHydrate}
                </Text>
              </View>
            ) : (
              <View style={styles.timerDisplay}>
                <Text style={[styles.timerLabel, isRTL && styles.rtlText]}>
                  {t.hydration_screen.nextDrinkIn}
                </Text>
                <Text style={styles.timerTime}>
                  {formatTime(timeRemaining)}
                </Text>
              </View>
            )}
          </View>

          {/* Drink Button */}
          <TouchableOpacity
            style={[
              styles.drinkButton,
              isTimeForDrink && styles.urgentDrinkButton
            ]}
            onPress={() => recordDrink(250)}
          >
            <Text style={styles.drinkButtonIcon}>💧</Text>
            <Text style={styles.drinkButtonText}>
              {t.hydration_screen.justDrank}
            </Text>
            <Text style={styles.drinkButtonSubtext}>
              250ml
            </Text>
          </TouchableOpacity>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {[150, 250, 350, 500].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.quickAmountButton}
                onPress={() => recordDrink(amount)}
              >
                <Text style={styles.quickAmountText}>{amount}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  rtlHeader: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  rtlText: {
    textAlign: 'right',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 30,
    textAlign: 'center',
  },
  glassContainer: {
    marginBottom: 30,
  },
  glass: {
    width: 120,
    height: 200,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  waterFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
  },
  wave: {
    position: 'absolute',
    top: -5,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
  },
  glassRim: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  volumeIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  volumeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  goalText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 30,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  drinkPrompt: {
    alignItems: 'center',
  },
  drinkPromptEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  drinkPromptText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  timerDisplay: {
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  timerTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  drinkButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  urgentDrinkButton: {
    backgroundColor: '#fbbf24',
    shadowColor: '#f59e0b',
  },
  drinkButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  drinkButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0e7490',
    marginBottom: 4,
  },
  drinkButtonSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAmountButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickAmountText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
});

export default HydrationScreen;