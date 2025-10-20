import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { useBills } from '../contexts/BillsContext';
import { useTranslation } from '../hooks/useTranslation';
import { SharedHeader } from '../components/SharedHeader';
import { BillCard } from '../components/BillCard/BillCard';
import { BillService } from '../services/billService';
import * as Haptics from 'expo-haptics';

interface MyBillsScreenProps {
  onProfilePress?: () => void;
}

const MyBillsScreen: React.FC<MyBillsScreenProps> = ({ onProfilePress = () => {} }) => {
  const { colors, isDark } = useTheme();
  const { isRTL } = useApp();
  const { t } = useTranslation();
  const { bills, refreshBills, deleteBill, addBill, markAsPaid } = useBills();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'overdue' | 'paid'>('upcoming');

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [reminderDays, setReminderDays] = useState('3');

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.name.toLowerCase().includes(searchQuery.toLowerCase());
    const daysUntil = BillService.getDaysUntilDue(bill);
    const isPaid = bill.paymentHistory.length > 0;

    switch (activeTab) {
      case 'upcoming':
        return matchesSearch && daysUntil > 0 && !isPaid;
      case 'overdue':
        return matchesSearch && daysUntil <= 0 && !isPaid;
      case 'paid':
        return matchesSearch && isPaid;
      default:
        return matchesSearch;
    }
  });

  const handleAddBill = async () => {
    if (!name || !amount) {
      Alert.alert(t.alerts.error, t.alerts.billNameRequired);
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const dueDateString = dueDate.toISOString().split('T')[0];
      
      await addBill({
        name,
        amount: parseFloat(amount),
        dueDate: dueDateString,
        frequency,
        reminderDays: parseInt(reminderDays),
        notes: '',
        isActive: true,
      });

      // Reset form
      setName('');
      setAmount('');
      setDueDate(new Date());
      setFrequency('monthly');
      setReminderDays('3');
      setShowAddForm(false);
      Alert.alert(t.alerts.success, t.alerts.billAddedSuccess);
    } catch (error) {
      Alert.alert(t.alerts.error, t.alerts.billFailedToAdd);
      console.error(error);
    }
  };

  const handleDateChange = (event: any, selectedDate: any) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await deleteBill(billId);
      Alert.alert(t.alerts.success, t.alerts.billDeletedSuccess);
    } catch (error) {
      Alert.alert(t.alerts.error, t.alerts.billFailedToDelete);
    }
  };

  const handleMarkAsPaid = async (billId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await markAsPaid(billId);
      Alert.alert(t.alerts.success, t.alerts.billMarkedPaidSuccess);
    } catch (error) {
      Alert.alert(t.alerts.error, t.alerts.billFailedToMarkPaid);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* ===== HEADER WITH TITLE & ADD BUTTON ===== */}
      <SharedHeader 
        title={t.bills_screen.title}
        onProfilePress={onProfilePress}
      />

      {/* ===== ADD BUTTON ===== */}
      <View style={[styles.addButtonContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={styles.addBtnText}>{showAddForm ? '✕' : `+ ${t.bills_screen.add}`}</Text>
        </TouchableOpacity>
      </View>

      {/* ===== ADD BILL FORM (Collapsible) ===== */}
      {showAddForm && (
        <View style={[styles.formContainer, { backgroundColor: isDark ? '#2a2a2a' : '#f8f8f8', borderBottomColor: colors.border }]}>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
            placeholder={t.bills_screen.billNamePlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
            placeholder={t.bills_screen.amountPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          
          {/* Date Picker Button */}
          <TouchableOpacity
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center' }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[{ color: dueDate ? colors.text : colors.textSecondary }]}>
              📅 {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </TouchableOpacity>

          {/* Date Picker Modal */}
          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {Platform.OS === 'ios' && showDatePicker && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={[{ color: colors.primary, fontSize: 14, fontWeight: '600' }]}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleAddBill}
          >
            <Text style={styles.submitBtnText}>{t.bills_screen.addButton}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ===== SEARCH BAR ===== */}
      <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
          placeholder={t.bills_screen.search}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* ===== TAB NAVIGATION ===== */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        {(['upcoming', 'overdue', 'paid'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: colors.primary },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
              {tab === 'upcoming' ? t.bills_screen.upcoming : tab === 'overdue' ? t.bills_screen.overdue : t.bills_screen.paid}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ===== BILLS LIST ===== */}
      <ScrollView 
        style={styles.listContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {filteredBills.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>
              {activeTab === 'upcoming' ? '📭' : activeTab === 'overdue' ? '⏰' : '✅'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {activeTab === 'upcoming' ? t.bills_screen.noBillsUpcoming : activeTab === 'overdue' ? t.bills_screen.noBillsOverdue : t.bills_screen.noBillsPaid}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {searchQuery ? t.bills_screen.tryAdjustingSearch : activeTab === 'upcoming' ? t.bills_screen.addFirstBill : activeTab === 'overdue' ? t.bills_screen.youreAllCaughtUp : t.bills_screen.noPaymentsRecorded}
            </Text>
          </View>
        ) : (
          <View style={styles.billsList}>
            {filteredBills.map(bill => (
              <BillCard
                key={bill.id}
                bill={bill}
                onDelete={handleDeleteBill}
                onMarkAsPaid={handleMarkAsPaid}
                isPaidTab={activeTab === 'paid'}
              />
            ))}
          </View>
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ===== HEADER SECTION =====
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },

  // ===== ADD FORM SECTION =====
  formContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  submitBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },

  // ===== SEARCH SECTION =====
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
  },

  // ===== TAB SECTION =====
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ===== BILLS LIST SECTION =====
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  billsList: {
    gap: 10,
  },

  // ===== EMPTY STATE SECTION =====
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  // ===== SPACING =====
  bottomSpacing: {
    height: 24,
  },
});

export default MyBillsScreen;
