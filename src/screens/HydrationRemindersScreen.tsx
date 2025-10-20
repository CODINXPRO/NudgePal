import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  Switch,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useApp } from '../contexts/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

interface HydrationReminder {
  id: string;
  name: string;
  time: string;
  volume: number;
  enabled: boolean;
}

const HydrationRemindersScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { userSettings, isRTL } = useApp();
  const [reminders, setReminders] = useState<HydrationReminder[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTimePickerFor, setShowTimePickerFor] = useState<string | null>(null);
  const [newReminder, setNewReminder] = useState<Partial<HydrationReminder>>({
    name: '',
    time: '08:00',
    volume: 250,
    enabled: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const storedReminders = await AsyncStorage.getItem(
        '@nudgepal_hydration_reminders'
      );
      if (storedReminders) {
        setReminders(JSON.parse(storedReminders));
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const saveReminders = async (updatedReminders: HydrationReminder[]) => {
    try {
      await AsyncStorage.setItem(
        '@nudgepal_hydration_reminders',
        JSON.stringify(updatedReminders)
      );
      setReminders(updatedReminders);
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.name || !newReminder.time) {
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const reminder: HydrationReminder = {
      id: editingId || Date.now().toString(),
      name: newReminder.name || '',
      time: newReminder.time || '08:00',
      volume: newReminder.volume || 250,
      enabled: newReminder.enabled !== undefined ? newReminder.enabled : true,
    };

    let updatedReminders: HydrationReminder[];

    if (editingId) {
      updatedReminders = reminders.map((r) =>
        r.id === editingId ? reminder : r
      );
      setEditingId(null);
    } else {
      updatedReminders = [...reminders, reminder];
    }

    await saveReminders(updatedReminders);
    setShowAddModal(false);
    setNewReminder({
      name: '',
      time: '08:00',
      volume: 250,
      enabled: true,
    });
  };

  const handleDeleteReminder = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedReminders = reminders.filter((r) => r.id !== id);
    await saveReminders(updatedReminders);
  };

  const handleEditReminder = (reminder: HydrationReminder) => {
    setNewReminder(reminder);
    setEditingId(reminder.id);
    setShowAddModal(true);
  };

  const toggleReminderEnabled = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedReminders = reminders.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    await saveReminders(updatedReminders);
  };

  const enabledCount = reminders.filter((r) => r.enabled).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#e0f7ff', '#b3e5fc', '#81d4ff']}
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
            ⏰ Reminder Schedule
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>�</Text>
            <Text style={styles.infoText}>
              Create reminders throughout your day to maintain consistent hydration. Currently <Text style={styles.infoBold}>{enabledCount} active</Text>.
            </Text>
          </View>

          {/* Reminders List */}
          <View style={styles.remindersContainer}>
            <View style={styles.remindersHeader}>
              <Text style={styles.remindersTitle}>📅 All Reminders</Text>
              <Text style={styles.reminderCount}>{reminders.length}</Text>
            </View>

            {reminders.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔔</Text>
                <Text style={styles.emptyText}>No reminders scheduled</Text>
                <Text style={styles.emptySubtext}>
                  Add your first reminder to get started
                </Text>
              </View>
            ) : (
              reminders.map((reminder) => (
                <ReminderItem
                  key={reminder.id}
                  reminder={reminder}
                  onToggle={() => toggleReminderEnabled(reminder.id)}
                  onEdit={() => handleEditReminder(reminder)}
                  onDelete={() => handleDeleteReminder(reminder.id)}
                />
              ))
            )}
          </View>

          {/* Default Reminders Help */}
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>💧 Suggested Reminders</Text>

            <View style={styles.suggestion}>
              <View style={styles.suggestionTime}>
                <Text style={styles.suggestionTimeText}>08:00</Text>
              </View>
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionName}>Morning glass</Text>
                <Text style={styles.suggestionDesc}>250ml</Text>
              </View>
            </View>

            <View style={styles.suggestion}>
              <View style={styles.suggestionTime}>
                <Text style={styles.suggestionTimeText}>12:30</Text>
              </View>
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionName}>Before lunch</Text>
                <Text style={styles.suggestionDesc}>250ml</Text>
              </View>
            </View>

            <View style={styles.suggestion}>
              <View style={styles.suggestionTime}>
                <Text style={styles.suggestionTimeText}>15:00</Text>
              </View>
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionName}>Afternoon refresh</Text>
                <Text style={styles.suggestionDesc}>250ml</Text>
              </View>
            </View>

            <View style={styles.suggestion}>
              <View style={styles.suggestionTime}>
                <Text style={styles.suggestionTimeText}>19:30</Text>
              </View>
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionName}>After dinner</Text>
                <Text style={styles.suggestionDesc}>250ml</Text>
              </View>
            </View>
          </View>

          {/* Settings */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>🎯 Preferences</Text>

            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Daily Goal</Text>
                <Text style={styles.settingValue}>2.5L</Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingValue}>Enabled</Text>
              </View>
              <Switch
                value={enabledCount > 0}
                onValueChange={async () => {
                  if (enabledCount > 0) {
                    const disabledAll = reminders.map((r) => ({
                      ...r,
                      enabled: false,
                    }));
                    await saveReminders(disabledAll);
                  } else {
                    const enabledAll = reminders.map((r) => ({
                      ...r,
                      enabled: true,
                    }));
                    await saveReminders(enabledAll);
                  }
                }}
              />
            </View>
          </View>

          <View style={styles.footerSpace} />
        </ScrollView>

        {/* Add Reminder Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingId(null);
              setNewReminder({
                name: '',
                time: '08:00',
                volume: 250,
                enabled: true,
              });
              setShowAddModal(true);
            }}
          >
            <Text style={styles.addButtonIcon}>➕</Text>
            <Text style={styles.addButtonText}>New Reminder</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Add/Edit Reminder Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                }}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingId ? '✏️ Edit Schedule' : '➕ Create Reminder'}
              </Text>
              <View style={styles.modalPlaceholder} />
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Reminder Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Reminder Name</Text>
                <View style={styles.formInput}>
                  <Text style={styles.formInputText}>
                    {newReminder.name || 'e.g., Morning glass'}
                  </Text>
                </View>
              </View>

              {/* Quick Name Suggestions */}
              <View style={styles.quickSuggestions}>
                {[
                  'Morning glass',
                  'After breakfast',
                  'Mid-morning boost',
                  'Before lunch',
                  'Afternoon refresh',
                  'After dinner',
                  'Before bed',
                ].map((name) => (
                  <TouchableOpacity
                    key={name}
                    style={styles.quickSuggestion}
                    onPress={() =>
                      setNewReminder({ ...newReminder, name })
                    }
                  >
                    <Text style={styles.quickSuggestionText}>{name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Time</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowTimePickerFor('reminder')}
                >
                  <Text style={styles.timeButtonText}>{newReminder.time}</Text>
                </TouchableOpacity>
              </View>

              {/* Volume */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Volume</Text>
                <View style={styles.volumeButtons}>
                  {[150, 250, 350, 500].map((vol) => (
                    <TouchableOpacity
                      key={vol}
                      style={[
                        styles.volumeButton,
                        newReminder.volume === vol &&
                          styles.volumeButtonActive,
                      ]}
                      onPress={() =>
                        setNewReminder({ ...newReminder, volume: vol })
                      }
                    >
                      <Text
                        style={[
                          styles.volumeButtonText,
                          newReminder.volume === vol &&
                            styles.volumeButtonTextActive,
                        ]}
                      >
                        {vol}ml
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddReminder}
              >
                <Text style={styles.saveButtonText}>
                  {editingId ? 'Update' : 'Add'} Reminder
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      {showTimePickerFor && (
        <DateTimePicker
          value={new Date(`2000-01-01 ${newReminder.time}`)}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={(event, selectedTime) => {
            if (selectedTime) {
              const hours = String(selectedTime.getHours()).padStart(2, '0');
              const minutes = String(selectedTime.getMinutes()).padStart(
                2,
                '0'
              );
              setNewReminder({
                ...newReminder,
                time: `${hours}:${minutes}`,
              });
            }
            setShowTimePickerFor(null);
          }}
        />
      )}
    </SafeAreaView>
  );
};

interface ReminderItemProps {
  reminder: HydrationReminder;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ReminderItem: React.FC<ReminderItemProps> = ({
  reminder,
  onToggle,
  onEdit,
  onDelete,
}) => {
  return (
    <View
      style={[
        styles.reminderItem,
        !reminder.enabled && styles.reminderItemDisabled,
      ]}
    >
      <TouchableOpacity
        style={styles.reminderToggle}
        onPress={onToggle}
      >
        <View
          style={[
            styles.toggleCircle,
            reminder.enabled && styles.toggleCircleActive,
          ]}
        >
          {reminder.enabled && (
            <Text style={styles.toggleCheck}>✓</Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.reminderInfo}>
        <Text
          style={[
            styles.reminderName,
            !reminder.enabled && styles.reminderNameDisabled,
          ]}
        >
          {reminder.name}
        </Text>
        <Text
          style={[
            styles.reminderDetails,
            !reminder.enabled && styles.reminderDetailsDisabled,
          ]}
        >
          {reminder.time} • {reminder.volume}ml
        </Text>
      </View>

      <View style={styles.reminderActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onEdit}
        >
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onDelete}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(129, 212, 255, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(129, 212, 255, 0.2)',
  },
  rtlHeader: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#006b7a',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#006b7a',
  },
  rtlText: {
    textAlign: 'right',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: 'rgba(106, 169, 233, 0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#06b6d4',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoEmoji: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#006b7a',
    lineHeight: 18,
  },
  infoBold: {
    fontWeight: 'bold',
  },
  remindersContainer: {
    marginBottom: 24,
  },
  remindersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  remindersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#006b7a',
  },
  reminderCount: {
    fontSize: 14,
    color: '#6aa9e9',
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#006b7a',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6aa9e9',
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderItemDisabled: {
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
  },
  reminderToggle: {
    marginRight: 12,
  },
  toggleCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#6aa9e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCircleActive: {
    backgroundColor: '#06b6d4',
    borderColor: '#06b6d4',
  },
  toggleCheck: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006b7a',
    marginBottom: 2,
  },
  reminderNameDisabled: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  reminderDetails: {
    fontSize: 12,
    color: '#6aa9e9',
  },
  reminderDetailsDisabled: {
    color: '#999',
  },
  reminderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(106, 169, 233, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 14,
  },
  suggestionsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006b7a',
    marginBottom: 12,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionTime: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  suggestionTimeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#06b6d4',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#006b7a',
  },
  suggestionDesc: {
    fontSize: 12,
    color: '#6aa9e9',
    marginTop: 2,
  },
  settingsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006b7a',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 13,
    color: '#6aa9e9',
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 14,
    color: '#006b7a',
    fontWeight: '600',
    marginTop: 2,
  },
  editButton: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    color: '#06b6d4',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(129, 212, 255, 0.3)',
  },
  addButton: {
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonIcon: {
    fontSize: 18,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  footerSpace: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseIcon: {
    fontSize: 24,
    color: '#999',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#006b7a',
  },
  modalPlaceholder: {
    width: 24,
  },
  modalScroll: {
    paddingTop: 16,
  },
  formGroup: {
    marginBottom: 18,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6aa9e9',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  formInputText: {
    fontSize: 14,
    color: '#999',
  },
  quickSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  quickSuggestion: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickSuggestionText: {
    fontSize: 12,
    color: '#06b6d4',
    fontWeight: '600',
  },
  timeButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#006b7a',
  },
  volumeButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  volumeButton: {
    flex: 0.45,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  volumeButtonActive: {
    backgroundColor: '#06b6d4',
    borderColor: '#06b6d4',
  },
  volumeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  volumeButtonTextActive: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#06b6d4',
    borderRadius: 10,
    paddingVertical: 14,
    marginVertical: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default HydrationRemindersScreen;
