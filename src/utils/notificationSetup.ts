import * as Notifications from 'expo-notifications';
import { BillService } from '../services/billService';

// Setup notifications
export const setupNotifications = async () => {
  try {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status === 'granted') {
      console.log('✅ Notification permissions granted');
      // Reschedule all bills' notifications on app start
      await BillService.rescheduleAllNotifications();
    } else {
      console.warn('⚠️ Notification permissions not granted');
    }
  } catch (error) {
    console.warn('⚠️ Notification setup error (non-blocking):', error);
    // Don't throw - allow app to continue even if notifications fail
  }
};

// Handle notification response
export const handleNotificationResponse = (
  response: Notifications.NotificationResponse,
  onBillNotified?: (billId: string) => void
) => {
  const billId = response.notification.request.content.data?.billId as string | undefined;
  if (billId && onBillNotified) {
    onBillNotified(billId);
  }
};
