import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../contexts/AppContext';

interface HydrationSetupScreenProps {
  navigation: any;
  onComplete?: () => void;
}

const HydrationSetupScreen: React.FC<HydrationSetupScreenProps> = ({
  navigation,
  onComplete,
}) => {
  const { isRTL } = useApp();
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateDailyGoal = (weightKg: number): number => {
    return Math.round(weightKg * 0.033 * 1000); // Convert to ml and round
  };

  const handleContinue = async () => {
    setError('');

    // Validate input
    if (!weight.trim()) {
      setError('Please enter your weight');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setError('Please enter a valid weight');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    if (weightNum < 20 || weightNum > 250) {
      setError('Weight should be between 20 kg and 250 kg');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Calculate daily goal
      const dailyGoalMl = calculateDailyGoal(weightNum);

      // Initialize hydration data with calculated goal
      const hydrationData = {
        dailyIntake: 0,
        goal: dailyGoalMl,
        reminders: [],
        lastUpdated: new Date().toDateString(),
        userWeight: weightNum,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        '@nudgepal_hydration_data',
        JSON.stringify(hydrationData)
      );

      // Mark setup as complete
      await AsyncStorage.setItem(
        '@nudgepal_hydration_setup_complete',
        'true'
      );

      // Calculate reminders that add up EXACTLY to the goal
      // Distribute daily goal across reminders to reach target
      // Base: 7 reminders at different times throughout the day
      
      // Calculate how many reminders we need and their volume
      let numberOfReminders = 7;
      let baseVolume = Math.round(dailyGoalMl / 7);
      let totalWithBase = baseVolume * 6;
      let lastVolume = dailyGoalMl - totalWithBase; // Adjust last one to hit exact target
      
      // If last volume is too small or too large, use 8 reminders instead
      if (lastVolume < 100 || lastVolume > baseVolume + 100) {
        numberOfReminders = 8;
        baseVolume = Math.round(dailyGoalMl / 8);
        totalWithBase = baseVolume * 7;
        lastVolume = dailyGoalMl - totalWithBase; // Adjust last one to hit exact target
      }

      // Reminder definitions (names and times for 7-8 reminders)
      const reminderDefs = [
        { name: 'Morning glass', time: '08:00' },
        { name: 'After breakfast', time: '09:30' },
        { name: 'Mid-morning boost', time: '11:00' },
        { name: 'Before lunch', time: '12:30' },
        { name: 'Afternoon refresh', time: '15:00' },
        { name: 'After work', time: '17:00' },
        { name: 'After dinner', time: '19:30' },
        { name: 'Before bed', time: '21:00' },
      ];

      // Create reminders array
      const defaultReminders = reminderDefs.slice(0, numberOfReminders).map((def, index) => ({
        id: (index + 1).toString(),
        name: def.name,
        time: def.time,
        volume: index === numberOfReminders - 1 ? lastVolume : baseVolume, // Last reminder gets adjusted volume
        completed: false,
        missed: false,
        locked: false,
      }));

      await AsyncStorage.setItem(
        '@nudgepal_hydration_reminders',
        JSON.stringify(defaultReminders)
      );

      setLoading(false);

      // Navigate to hydration reminder screen
      if (onComplete) {
        onComplete();
      } else {
        navigation.replace('HydrationReminder');
      }
    } catch (err) {
      console.error('Error setting up hydration:', err);
      setError('Failed to save your preferences. Please try again.');
      setLoading(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const handleUseDefault = async () => {
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Use default 2.5L goal
      const hydrationData = {
        dailyIntake: 0,
        goal: 2500, // 2.5L in ml
        reminders: [],
        lastUpdated: new Date().toDateString(),
        userWeight: null,
      };

      await AsyncStorage.setItem(
        '@nudgepal_hydration_data',
        JSON.stringify(hydrationData)
      );

      await AsyncStorage.setItem(
        '@nudgepal_hydration_setup_complete',
        'true'
      );

      // Calculate reminders that add up EXACTLY to the default goal (2500ml)
      const defaultGoal = 2500;
      let numberOfReminders = 7;
      let baseVolume = Math.round(defaultGoal / 7);
      let totalWithBase = baseVolume * 6;
      let lastVolume = defaultGoal - totalWithBase;
      
      // If last volume is too small or too large, use 8 reminders instead
      if (lastVolume < 100 || lastVolume > baseVolume + 100) {
        numberOfReminders = 8;
        baseVolume = Math.round(defaultGoal / 8);
        totalWithBase = baseVolume * 7;
        lastVolume = defaultGoal - totalWithBase;
      }

      // Reminder definitions
      const reminderDefs = [
        { name: 'Morning glass', time: '08:00' },
        { name: 'After breakfast', time: '09:30' },
        { name: 'Mid-morning boost', time: '11:00' },
        { name: 'Before lunch', time: '12:30' },
        { name: 'Afternoon refresh', time: '15:00' },
        { name: 'After work', time: '17:00' },
        { name: 'After dinner', time: '19:30' },
        { name: 'Before bed', time: '21:00' },
      ];

      // Create reminders array
      const defaultReminders = reminderDefs.slice(0, numberOfReminders).map((def, index) => ({
        id: (index + 1).toString(),
        name: def.name,
        time: def.time,
        volume: index === numberOfReminders - 1 ? lastVolume : baseVolume,
        completed: false,
        missed: false,
        locked: false,
      }));

      await AsyncStorage.setItem(
        '@nudgepal_hydration_reminders',
        JSON.stringify(defaultReminders)
      );

      setLoading(false);

      if (onComplete) {
        onComplete();
      } else {
        navigation.replace('HydrationReminder');
      }
    } catch (err) {
      console.error('Error setting default hydration:', err);
      setError('Failed to save preferences. Please try again.');
      setLoading(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#e0f7ff', '#b3e5fc', '#81d4ff']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView behavior="padding" style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerEmoji}>💧</Text>
              <Text style={styles.headerTitle}>Hydration Setup</Text>
              <Text style={styles.headerSubtitle}>
                Let's personalize your daily water goal
              </Text>
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardEmoji}>🧮</Text>
                <Text style={styles.infoCardTitle}>How It Works</Text>
                <Text style={styles.infoCardText}>
                  We calculate your personalized daily water goal based on your
                  weight using the formula:
                </Text>
                <View style={styles.formulaBox}>
                  <Text style={styles.formulaLabel}>Daily Goal (liters) =</Text>
                  <Text style={styles.formulaValue}>Weight (kg) × 0.033</Text>
                </View>
                <Text style={styles.exampleText}>
                  📌 <Text style={styles.exampleBold}>Example:</Text> 70 kg ×
                  0.033 = 2.31 L/day
                </Text>
              </View>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Your Weight (kg)</Text>
              <View
                style={[
                  styles.inputWrapper,
                  error ? styles.inputWrapperError : null,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your weight"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={(text) => {
                    setWeight(text);
                    setError('');
                  }}
                  editable={!loading}
                />
                <Text style={styles.inputUnit}>kg</Text>
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              )}

              {weight ? (
                <View style={styles.goalPreview}>
                  <Text style={styles.goalPreviewLabel}>Your Daily Goal:</Text>
                  <Text style={styles.goalPreviewValue}>
                    {(calculateDailyGoal(parseFloat(weight)) / 1000).toFixed(2)}{' '}
                    L
                  </Text>
                  <Text style={styles.goalPreviewSubtext}>
                    ({calculateDailyGoal(parseFloat(weight))} ml)
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Buttons Section */}
            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  loading ? styles.buttonDisabled : null,
                ]}
                onPress={handleContinue}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? '⏳ Setting up...' : '✨ Personalize My Goal'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  loading ? styles.buttonDisabled : null,
                ]}
                onPress={handleUseDefault}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>
                  Use Default (2.5L)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer Info */}
            <View style={styles.footerInfo}>
              <Text style={styles.footerText}>
                💡 You can change your goal anytime in your hydration settings
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#006b7a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6aa9e9',
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoCardEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#006b7a',
    marginBottom: 12,
  },
  infoCardText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  formulaBox: {
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#06b6d4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  formulaLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  formulaValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#06b6d4',
    fontFamily: 'Courier New',
  },
  exampleText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  exampleBold: {
    fontWeight: '700',
    color: '#006b7a',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006b7a',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#81d4ff',
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12,
  },
  inputWrapperError: {
    borderColor: '#ff6b6b',
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    color: '#006b7a',
    fontWeight: '600',
    padding: 0,
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6aa9e9',
    marginLeft: 12,
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#d63031',
    fontWeight: '600',
  },
  goalPreview: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#06b6d4',
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  goalPreviewLabel: {
    fontSize: 12,
    color: '#6aa9e9',
    fontWeight: '600',
    marginBottom: 4,
  },
  goalPreviewValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#06b6d4',
    marginBottom: 4,
  },
  goalPreviewSubtext: {
    fontSize: 12,
    color: '#999',
  },
  buttonSection: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#81d4ff',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#06b6d4',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footerInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default HydrationSetupScreen;
