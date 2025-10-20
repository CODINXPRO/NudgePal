import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { CurrencyService } from '../utils/currencyService';
import { AdaptiveBudgetService } from '../services/adaptiveBudgetService';

interface SpendingProfile {
  monthlyIncome: number;
  fixedExpenses: number;
  loanPayment: number;
  monthlySavingsGoal: number;
  dailyBudget: number;
  disposableIncome: number;
  setupCompleted: boolean;
  createdAt?: string;
}

interface DailySpending {
  [date: string]: {
    amount: number;
    budgetStatus: 'under' | 'within_range' | 'over';
    feeling?: 'planned' | 'impulse_regret' | 'necessary' | 'treat';
    savedAmount: number;
    timestamp: string;
  };
}

const STORAGE_KEYS = {
  SPENDING_PROFILE: 'spendingProfile_overspending',
  DAILY_SPENDING: 'dailySpending_overspending',
};

export const OverspendingTrackerScreen: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  habitId: string;
}> = ({ isOpen, onClose, habitId }) => {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<SpendingProfile | null>(null);
  const [dailySpending, setDailySpending] = useState<DailySpending>({});
  const [showSetup, setShowSetup] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [currentSpend, setCurrentSpend] = useState('');
  const [followUpType, setFollowUpType] = useState<'under' | 'over' | null>(null);
  const [loading, setLoading] = useState(true);

  // Setup form states
  const [income, setIncome] = useState('');
  const [rent, setRent] = useState('');
  const [utilities, setUtilities] = useState('');
  const [phone, setPhone] = useState('');
  const [groceries, setGroceries] = useState('');
  const [transport, setTransport] = useState('');
  const [loanPayment, setLoanPayment] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [customExpenses, setCustomExpenses] = useState<{ [key: string]: string }>({});
  const [budgetHealth, setBudgetHealth] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      loadCurrency();
    }
  }, [isOpen]);

  useEffect(() => {
    // Recalculate budget health whenever spending or profile changes
    if (profile && Object.keys(dailySpending).length >= 0) {
      const spending = Object.entries(dailySpending).map(([date, data]) => ({
        date,
        amount: data.amount,
        budgetStatus: data.budgetStatus as 'under' | 'within_range' | 'over',
        feeling: data.feeling,
        savedAmount: data.savedAmount,
      }));
      const health = AdaptiveBudgetService.calculateBudgetHealth(profile, spending);
      setBudgetHealth(health);
    }
  }, [profile, dailySpending]);

  const loadCurrency = async () => {
    try {
      const symbol = await CurrencyService.getCurrencySymbol();
      setCurrencySymbol(symbol);
    } catch (error) {
      console.error('Error loading currency:', error);
    }
  };

  const loadData = async () => {
    try {
      const profileData = await AsyncStorage.getItem(STORAGE_KEYS.SPENDING_PROFILE);
      const spendingData = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_SPENDING);
      
      if (profileData) {
        setProfile(JSON.parse(profileData));
        setShowSetup(false);
      } else {
        setShowSetup(true);
      }
      
      if (spendingData) {
        setDailySpending(JSON.parse(spendingData));
      }
    } catch (error) {
      console.error('Error loading spending data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Safe number formatting helper
  const formatCurrencyValue = (value: any): string => {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0;
    return isNaN(num) ? '0' : Math.round(num).toString();
  };

  const calculateBudget = () => {
    const incomeNum = parseFloat(income) || 0;
    const loanPaymentNum = parseFloat(loanPayment) || 0;
    const savingsAmount = parseFloat(savingsGoal) || 0;
    
    const expenses = [
      parseFloat(rent) || 0,
      parseFloat(utilities) || 0,
      parseFloat(phone) || 0,
      parseFloat(groceries) || 0,
      parseFloat(transport) || 0,
      loanPaymentNum,
      Object.values(customExpenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0),
    ].reduce((a, b) => a + b, 0);

    const disposable = incomeNum - expenses;
    const spendableIncome = Math.max(0, disposable - savingsAmount);
    
    // Calculate daily budget based on days LEFT in month, not fixed 30 days
    // Formula: (Disposable Income - Savings Goal) ÷ Days Left in Month
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = today.getDate();
    const daysLeft = Math.max(1, lastDayOfMonth - currentDay + 1);
    const dailyBudget = spendableIncome > 0 ? Math.floor(spendableIncome / daysLeft) : 10;

    return {
      monthlyIncome: Math.max(0, incomeNum),
      fixedExpenses: Math.max(0, expenses),
      loanPayment: Math.max(0, loanPaymentNum),
      monthlySavingsGoal: Math.max(0, savingsAmount),
      disposableIncome: disposable,
      dailyBudget: Math.max(10, dailyBudget),
      setupCompleted: true,
    };
  };

  const handleSetupComplete = async () => {
    if (!income.trim()) {
      Alert.alert('Error', 'Please enter your monthly income.');
      return;
    }

    const newProfile = calculateBudget();
    setProfile(newProfile as SpendingProfile);
    await AsyncStorage.setItem(STORAGE_KEYS.SPENDING_PROFILE, JSON.stringify(newProfile));
    setShowSetup(false);
  };

  const getTodayKey = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getTodaySpending = () => {
    return dailySpending[getTodayKey()] || null;
  };

  const handleCheckInSubmit = async () => {
    if (!currentSpend.trim() || !profile) {
      Alert.alert('Error', 'Please enter a spending amount.');
      return;
    }

    const amount = parseFloat(currentSpend);
    const budgetStatus =
      amount <= profile.dailyBudget * 0.75
        ? 'under'
        : amount <= profile.dailyBudget * 1.125
          ? 'within_range'
          : 'over';

    const savedAmount = profile.dailyBudget - amount;

    const todayKey = getTodayKey();
    const newSpendingEntry: DailySpending[string] = {
      amount,
      budgetStatus: budgetStatus as 'under' | 'within_range' | 'over',
      savedAmount,
      timestamp: new Date().toISOString(),
    };

    const updatedSpending: DailySpending = {
      ...dailySpending,
      [todayKey]: newSpendingEntry,
    };

    setDailySpending(updatedSpending);
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_SPENDING, JSON.stringify(updatedSpending));

    // Show follow-up
    setFollowUpType(budgetStatus === 'under' ? 'under' : 'over');
    setShowCheckIn(false);
    setShowFollowUp(true);
    setCurrentSpend('');
  };

  const handleFollowUpSubmit = async (feeling: string) => {
    const todayKey = getTodayKey();
    const existingEntry = dailySpending[todayKey];
    if (!existingEntry) return;

    const updatedEntry: DailySpending[string] = {
      ...existingEntry,
      feeling: feeling as 'planned' | 'impulse_regret' | 'necessary' | 'treat',
    };

    const updatedSpending: DailySpending = {
      ...dailySpending,
      [todayKey]: updatedEntry,
    };

    setDailySpending(updatedSpending);
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_SPENDING, JSON.stringify(updatedSpending));

    setShowFollowUp(false);
    setFollowUpType(null);
    Alert.alert('Great!', '✅ Your check-in has been saved.');
  };

  const getWeeklyStats = () => {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    
    let daysOnBudget = 0;
    let totalOverspent = 0;
    let totalSaved = 0;
    let bestDay = null;
    let bestSavings = -Infinity;

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const spending = dailySpending[dateStr];
      if (spending) {
        if (spending.budgetStatus !== 'over') {
          daysOnBudget++;
        } else {
          totalOverspent += Math.max(0, spending.amount - (profile?.dailyBudget || 40));
        }
        totalSaved += Math.max(0, spending.savedAmount);
        
        if (spending.savedAmount > bestSavings) {
          bestSavings = spending.savedAmount;
          bestDay = { date: dateStr, saved: spending.savedAmount };
        }
      }
    }

    return { daysOnBudget, totalOverspent, totalSaved, bestDay };
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>💸 Spending Tracker</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Setup Modal */}
          {showSetup && (
            <SetupForm
              colors={colors}
              income={income}
              setIncome={setIncome}
              rent={rent}
              setRent={setRent}
              utilities={utilities}
              setUtilities={setUtilities}
              phone={phone}
              setPhone={setPhone}
              groceries={groceries}
              setGroceries={setGroceries}
              transport={transport}
              setTransport={setTransport}
              loanPayment={loanPayment}
              setLoanPayment={setLoanPayment}
              savingsGoal={savingsGoal}
              setSavingsGoal={setSavingsGoal}
              onComplete={handleSetupComplete}
            />
          )}

          {/* Check-in Button & Status */}
          {!showSetup && profile && (
            <>
              {getTodaySpending() ? (
                <View style={[styles.todayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Check-in</Text>
                  <View style={styles.spendingDisplay}>
                    <Text style={[styles.spendingAmount, { color: colors.text }]}>
                      {currencySymbol}{getTodaySpending()?.amount.toFixed(2)}
                    </Text>
                    <Text
                      style={[
                        styles.budgetStatus,
                        {
                          color:
                            getTodaySpending()?.budgetStatus === 'under'
                              ? '#10b981'
                              : getTodaySpending()?.budgetStatus === 'within_range'
                                ? '#f59e0b'
                                : '#ef4444',
                        },
                      ]}
                    >
                      {getTodaySpending()?.budgetStatus === 'under' && '✅ Under budget!'}
                      {getTodaySpending()?.budgetStatus === 'within_range' && '😐 Close to budget'}
                      {getTodaySpending()?.budgetStatus === 'over' && '⚠️ Over budget'}
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.checkInButton, { backgroundColor: colors.primary || '#6366f1' }]}
                  onPress={() => setShowCheckIn(true)}
                >
                  <Text style={styles.checkInButtonText}>📝 Today's Check-in</Text>
                </TouchableOpacity>
              )}

              {/* Health Status Card */}
              {budgetHealth && (
                <View style={[styles.healthCard, { 
                  backgroundColor: colors.surface, 
                  borderColor: AdaptiveBudgetService.getHealthColor(budgetHealth.status),
                  borderWidth: 2,
                }]}>
                  <View style={styles.healthHeader}>
                    <Text style={styles.healthEmoji}>{AdaptiveBudgetService.getHealthEmoji(budgetHealth.status)}</Text>
                    <View style={styles.healthInfo}>
                      <Text style={[styles.healthStatus, { color: AdaptiveBudgetService.getHealthColor(budgetHealth.status) }]}>
                        {budgetHealth.status.charAt(0).toUpperCase() + budgetHealth.status.slice(1)}
                      </Text>
                      <Text style={[styles.healthScore, { color: colors.text }]}>
                        Score: {budgetHealth.healthScore}/100
                      </Text>
                    </View>
                  </View>

                  {/* Health Meter */}
                  <View style={styles.healthMeterContainer}>
                    <View style={[styles.healthMeterBackground, { backgroundColor: colors.border }]}>
                      <View 
                        style={[
                          styles.healthMeterFill,
                          {
                            width: `${budgetHealth.percentageUsed}%`,
                            backgroundColor: AdaptiveBudgetService.getHealthColor(budgetHealth.status),
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.healthPercentage, { color: colors.text }]}>
                      {Math.round(budgetHealth.percentageUsed)}% spent
                    </Text>
                  </View>

                  {/* Adaptive Daily Budget */}
                  <View style={[styles.adaptiveBudgetBox, { backgroundColor: (colors.primary || '#6366f1') + '10' }]}>
                    <Text style={[styles.adaptiveLabel, { color: colors.text }]}>📊 Adjusted Daily Budget</Text>
                    <Text style={[styles.adaptiveValue, { color: colors.primary || '#6366f1' }]}>
                      {currencySymbol}{formatCurrencyValue(budgetHealth.adaptiveDailyBudget)}
                    </Text>
                    <Text style={[styles.adaptiveSubtext, { color: colors.textSecondary }]}>
                      {budgetHealth.daysLeft} days left • {currencySymbol}{formatCurrencyValue(budgetHealth.remainingBalance)} remaining
                    </Text>
                  </View>

                  {/* Recovery Message */}
                  {budgetHealth.recoveryMessage && (
                    <View style={[styles.recoveryMessage, { backgroundColor: (AdaptiveBudgetService.getHealthColor(budgetHealth.status)) + '15' }]}>
                      <Text style={[styles.recoveryText, { color: AdaptiveBudgetService.getHealthColor(budgetHealth.status) }]}>
                        💡 {budgetHealth.recoveryMessage}
                      </Text>
                    </View>
                  )}

                  {/* Saving Opportunities */}
                  {budgetHealth.savingOpportunities.length > 0 && (
                    <View style={styles.opportunitiesContainer}>
                      <Text style={[styles.opportunitiesTitle, { color: colors.text }]}>💰 Saving Opportunities:</Text>
                      {budgetHealth.savingOpportunities.map((opportunity, index) => (
                        <Text key={index} style={[styles.opportunityItem, { color: colors.textSecondary }]}>
                          • {opportunity}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Trend Indicator */}
                  <View style={styles.trendContainer}>
                    <Text style={[styles.trendLabel, { color: colors.text }]}>Trend</Text>
                    <Text style={[
                      styles.trendIndicator,
                      { 
                        color: budgetHealth.trend === 'improving' ? '#10b981' : 
                               budgetHealth.trend === 'stable' ? '#6b7280' : '#ef4444'
                      }
                    ]}>
                      {budgetHealth.trend === 'improving' ? '📈 Improving' :
                       budgetHealth.trend === 'stable' ? '➡️ Stable' : '📉 Declining'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Current Budget Info */}
              <View style={[styles.budgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Your Budget</Text>
                <View style={styles.budgetStats}>
                  <BudgetStat label="Monthly Income" value={`${currencySymbol}${formatCurrencyValue(profile.monthlyIncome)}`} emoji="💰" />
                  <BudgetStat label="Fixed Expenses" value={`${currencySymbol}${formatCurrencyValue(profile.fixedExpenses)}`} emoji="📍" />
                  <BudgetStat label="Savings" value={`${currencySymbol}${formatCurrencyValue(profile.monthlySavingsGoal)}`} emoji="🏦" />
                  <BudgetStat label="How Much Left to Spend" value={`${currencySymbol}${formatCurrencyValue(budgetHealth?.remainingBalance || (profile.disposableIncome - profile.monthlySavingsGoal))}`} emoji="💸" />
                </View>
              </View>

              {/* Weekly Stats */}
              <WeeklyStatsCard stats={getWeeklyStats()} colors={colors} currencySymbol={currencySymbol} />

              {/* Spending History */}
              <SpendingHistoryCard dailySpending={dailySpending} colors={colors} currencySymbol={currencySymbol} />

              {/* Edit Budget Button */}
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: (colors.primary || '#6366f1') + '20', borderColor: colors.primary || '#6366f1' }]}
                onPress={() => setShowSetup(true)}
              >
                <Text style={[styles.editButtonText, { color: colors.primary || '#6366f1' }]}>
                  ⚙️ Edit Budget
                </Text>
              </TouchableOpacity>

              {/* Delete Tracker Button */}
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: '#ef444420', borderColor: '#ef4444' }]}
                onPress={() => {
                  Alert.alert(
                    'Delete Spending Tracker',
                    'Are you sure you want to delete all spending data? This cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          await AsyncStorage.removeItem(STORAGE_KEYS.SPENDING_PROFILE);
                          await AsyncStorage.removeItem(STORAGE_KEYS.DAILY_SPENDING);
                          setProfile(null);
                          setDailySpending({});
                          setShowSetup(true);
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={[styles.deleteButtonText, { color: '#ef4444' }]}>
                  🗑️ Delete Tracker
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {/* Check-in Modal */}
        <Modal visible={showCheckIn} transparent animationType="fade" onRequestClose={() => setShowCheckIn(false)}>
          <CheckInModal
            colors={colors}
            dailyBudget={profile?.dailyBudget || 40}
            currentSpend={currentSpend}
            setCurrentSpend={setCurrentSpend}
            onSubmit={handleCheckInSubmit}
            onCancel={() => setShowCheckIn(false)}
            currencySymbol={currencySymbol}
          />
        </Modal>

        {/* Follow-up Modal */}
        <Modal visible={showFollowUp} transparent animationType="fade" onRequestClose={() => setShowFollowUp(false)}>
          <FollowUpModal
            colors={colors}
            followUpType={followUpType}
            spending={getTodaySpending()}
            dailyBudget={profile?.dailyBudget || 40}
            onSubmit={handleFollowUpSubmit}
            onCancel={() => setShowFollowUp(false)}
          />
        </Modal>
      </View>
    </Modal>
  );
};

// Setup Form Component
const SetupForm: React.FC<any> = ({
  colors,
  income,
  setIncome,
  rent,
  setRent,
  utilities,
  setUtilities,
  phone,
  setPhone,
  groceries,
  setGroceries,
  transport,
  setTransport,
  loanPayment,
  setLoanPayment,
  savingsGoal,
  setSavingsGoal,
  onComplete,
}) => (
  <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
    <View style={[styles.setupForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.setupTitle, { color: colors.text }]}>Let's understand your finances 💰</Text>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Monthly income after tax:</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          placeholder="$3000"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          value={income}
          onChangeText={setIncome}
        />
      </View>

      <Text style={[styles.expenseLabel, { color: colors.text, marginTop: 16 }]}>Essential monthly expenses:</Text>

      <ExpenseInput label="🏠 Rent/Mortgage" value={rent} onChange={setRent} colors={colors} />
      <ExpenseInput label="💡 Utilities" value={utilities} onChange={setUtilities} colors={colors} />
      <ExpenseInput label="📱 Phone/Internet" value={phone} onChange={setPhone} colors={colors} />
      <ExpenseInput label="🛒 Groceries" value={groceries} onChange={setGroceries} colors={colors} />
      <ExpenseInput label="🚗 Transportation" value={transport} onChange={setTransport} colors={colors} />
      <ExpenseInput label="🏦 Monthly Loan Payment (if any)" value={loanPayment} onChange={setLoanPayment} colors={colors} />

      <Text style={[styles.expenseLabel, { color: colors.text, marginTop: 16 }]}>Monthly savings goal:</Text>
      <ExpenseInput label="💎 How much do you want to save?" value={savingsGoal} onChange={setSavingsGoal} colors={colors} />

      <TouchableOpacity style={[styles.calculateButton, { backgroundColor: colors.primary || '#6366f1' }]} onPress={onComplete}>
        <Text style={styles.calculateButtonText}>Calculate My Budget</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);

const ExpenseInput: React.FC<{ label: string; value: string; onChange: (val: string) => void; colors: any }> = ({
  label,
  value,
  onChange,
  colors,
}) => (
  <View style={styles.formGroup}>
    <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    <TextInput
      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
      placeholder="$0"
      placeholderTextColor={colors.textSecondary}
      keyboardType="decimal-pad"
      value={value}
      onChangeText={onChange}
    />
  </View>
);

// Check-in Modal Component
const CheckInModal: React.FC<any> = ({
  colors,
  dailyBudget,
  currentSpend,
  setCurrentSpend,
  onSubmit,
  onCancel,
  currencySymbol = '$',
}) => (
  <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
      <Text style={[styles.modalTitle, { color: colors.text }]}>Evening Spending Review 💰</Text>
      <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>How much did you spend today?</Text>

      <TextInput
        style={[
          styles.largeInput,
          { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
        ]}
        placeholder={`${currencySymbol}0`}
        placeholderTextColor={colors.textSecondary}
        keyboardType="decimal-pad"
        value={currentSpend}
        onChangeText={setCurrentSpend}
      />

      <View style={styles.budgetGuide}>
        <Text style={[styles.budgetGuideText, { color: colors.text }]}>Your daily budget: {currencySymbol}{dailyBudget}</Text>
        <View style={styles.budgetRanges}>
          <Text style={[styles.rangeText, { color: '#10b981' }]}>• {currencySymbol}0-{Math.floor(dailyBudget * 0.75)}: 😊 Great control!</Text>
          <Text style={[styles.rangeText, { color: '#f59e0b' }]}>• {currencySymbol}{Math.floor(dailyBudget * 0.75)}-{Math.floor(dailyBudget * 1.125)}: 😐 Close to budget</Text>
          <Text style={[styles.rangeText, { color: '#ef4444' }]}>• {currencySymbol}{Math.floor(dailyBudget * 1.125)}+: 😔 Over budget</Text>
        </View>
      </View>

      <View style={styles.modalButtonGroup}>
        <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onCancel}>
          <Text style={[styles.cancelBtnText, { color: colors.text }]}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary || '#6366f1' }]} onPress={onSubmit}>
          <Text style={styles.submitBtnText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// Follow-up Modal Component
const FollowUpModal: React.FC<any> = ({
  colors,
  followUpType,
  spending,
  dailyBudget,
  onSubmit,
  onCancel,
}) => {
  const underBudgetReasons = ['Stayed home', 'Cooked meals', 'Avoided shopping', 'Other'];
  const overBudgetReasons = ['Planned & necessary', 'Impulse buy - regret it', 'Unexpected but needed', 'Treat myself - no regrets'];

  const reasons = followUpType === 'under' ? underBudgetReasons : overBudgetReasons;
  const title = followUpType === 'under' ? '🎉 Amazing!' : '⚠️ Over Budget';
  const message =
    followUpType === 'under'
      ? `You saved $${(dailyBudget - spending.amount).toFixed(2)} today!`
      : `You went $${(spending.amount - dailyBudget).toFixed(2)} over budget.`;
  const question = followUpType === 'under' ? 'What helped you stay under budget?' : 'Was this spending:';

  return (
    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
      <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{message}</Text>
        <Text style={[styles.questionText, { color: colors.text, marginVertical: 16 }]}>{question}</Text>

        <View style={styles.reasonsGrid}>
          {reasons.map((reason, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.reasonButton, { backgroundColor: (colors.primary || '#6366f1') + '20', borderColor: colors.primary || '#6366f1' }]}
              onPress={() => onSubmit(reason.toLowerCase().replace(/\s+/g, '_'))}
            >
              <Text style={[styles.reasonButtonText, { color: colors.primary || '#6366f1' }]}>{reason}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.skipBtn, { borderColor: colors.border }]} onPress={onCancel}>
          <Text style={[styles.skipBtnText, { color: colors.textSecondary }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Budget Stat Component
const BudgetStat: React.FC<{ label: string; value: string; emoji: string }> = ({ label, value, emoji }) => (
  <View style={styles.budgetStatItem}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

// Weekly Stats Card Component
const WeeklyStatsCard: React.FC<{ stats: any; colors: any; currencySymbol?: string }> = ({ stats, colors, currencySymbol = '$' }) => (
  <View style={[styles.weeklyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <Text style={[styles.cardTitle, { color: colors.text }]}>📊 Your Spending Week</Text>
    <View style={styles.statsGrid}>
      <StatBox label="On Budget" value={`${stats.daysOnBudget}/7`} color="#10b981" />
      <StatBox label="Over Spent" value={`${currencySymbol}${stats.totalOverspent.toFixed(2)}`} color="#ef4444" />
      <StatBox label="Total Saved" value={`${currencySymbol}${stats.totalSaved.toFixed(2)}`} color="#6366f1" />
      {stats.bestDay && <StatBox label="Best Day" value={`${currencySymbol}${stats.bestDay.saved.toFixed(2)}`} color="#f59e0b" />}
    </View>
  </View>
);

const StatBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <View style={[styles.statBox, { backgroundColor: color + '15', borderColor: color }]}>
    <Text style={[styles.statBoxValue, { color }]}>{value}</Text>
    <Text style={[styles.statBoxLabel, { color }]}>{label}</Text>
  </View>
);

// Spending History Component
const SpendingHistoryCard: React.FC<{ dailySpending: DailySpending; colors: any; currencySymbol?: string }> = ({ dailySpending, colors, currencySymbol = '$' }) => {
  const recentDays = Object.entries(dailySpending)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .slice(0, 7);

  return (
    <View style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>📈 Recent Spending</Text>
      {recentDays.length === 0 ? (
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No spending records yet</Text>
      ) : (
        recentDays.map(([date, data]) => (
          <View key={date} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.historyDate, { color: colors.text }]}>{new Date(date).toLocaleDateString()}</Text>
              <Text style={[styles.historyFeeling, { color: colors.textSecondary }]}>
                {data.feeling ? `(${data.feeling.replace(/_/g, ' ')})` : ''}
              </Text>
            </View>
            <Text style={[styles.historyAmount, { color: data.budgetStatus === 'under' ? '#10b981' : data.budgetStatus === 'over' ? '#ef4444' : '#f59e0b' }]}>
              {currencySymbol}{data.amount.toFixed(2)}
            </Text>
          </View>
        ))
      )}
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
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Setup Form
  setupForm: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  expenseLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  calculateButton: {
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButtonSetup: {
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    alignItems: 'center',
  },
  cancelButtonSetupText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  // Cards
  checkInButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Health Card Styles
  healthCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    gap: 16,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthEmoji: {
    fontSize: 32,
  },
  healthInfo: {
    flex: 1,
    gap: 4,
  },
  healthStatus: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  healthScore: {
    fontSize: 13,
    fontWeight: '600',
  },
  healthMeterContainer: {
    gap: 8,
  },
  healthMeterBackground: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  healthMeterFill: {
    height: '100%',
    borderRadius: 5,
  },
  healthPercentage: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  adaptiveBudgetBox: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  adaptiveLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  adaptiveValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  adaptiveSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  recoveryMessage: {
    borderRadius: 10,
    padding: 12,
  },
  recoveryText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  opportunitiesContainer: {
    gap: 6,
  },
  opportunitiesTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  opportunityItem: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendIndicator: {
    fontSize: 14,
    fontWeight: '700',
  },
  todayCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  budgetCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  spendingDisplay: {
    alignItems: 'center',
    gap: 8,
  },
  spendingAmount: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  budgetStatus: {
    fontSize: 14,
    fontWeight: '700',
  },
  budgetStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  budgetStatItem: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  statEmoji: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  // Weekly Stats
  weeklyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  // History
  historyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyFeeling: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  editButton: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  largeInput: {
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  budgetGuide: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  budgetGuideText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  budgetRanges: {
    gap: 6,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  reasonButton: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  reasonButtonText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  skipBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
