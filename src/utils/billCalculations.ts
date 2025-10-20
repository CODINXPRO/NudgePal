import { Bill, BillPaymentHistory, BILL_TYPES, RECURRENCE_OPTIONS, BILL_STATUS } from '../data/billTypes';

/**
 * Get the status of a bill relative to today
 */
export const getBillStatus = (dueDate: string): typeof BILL_STATUS[keyof typeof BILL_STATUS] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return BILL_STATUS.OVERDUE;
  if (diffDays === 0) return BILL_STATUS.DUE_TODAY;
  return BILL_STATUS.UPCOMING;
};

/**
 * Get days until or days overdue
 */
export const getDaysFromToday = (dueDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get status context text (e.g., "Due today", "3 days left", "Overdue 2 days")
 */
export const getStatusContextText = (dueDate: string): string => {
  const daysFromToday = getDaysFromToday(dueDate);
  
  if (daysFromToday === 0) return 'Due today';
  if (daysFromToday > 0) return `${daysFromToday} day${daysFromToday > 1 ? 's' : ''} left`;
  return `Overdue ${Math.abs(daysFromToday)} day${Math.abs(daysFromToday) > 1 ? 's' : ''}`;
};

/**
 * Get status color
 */
export const getStatusColor = (dueDate: string): string => {
  const status = getBillStatus(dueDate);
  
  switch (status) {
    case BILL_STATUS.OVERDUE:
      return '#EF4444'; // Red
    case BILL_STATUS.DUE_TODAY:
      return '#F59E0B'; // Amber/Orange
    case BILL_STATUS.UPCOMING:
      return '#6B7280'; // Gray
    case BILL_STATUS.PAID:
      return '#10B981'; // Green
    default:
      return '#6B7280';
  }
};

/**
 * Calculate next due date for recurring bills based on recurrence pattern
 */
export const calculateNextDueDate = (currentDueDate: string, recurrence: string): string => {
  const date = new Date(currentDueDate);
  
  switch (recurrence) {
    case RECURRENCE_OPTIONS.WEEKLY:
      date.setDate(date.getDate() + 7);
      break;
    case RECURRENCE_OPTIONS.MONTHLY:
      date.setMonth(date.getMonth() + 1);
      break;
    case RECURRENCE_OPTIONS.YEARLY:
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return currentDueDate;
  }
  
  return date.toISOString().split('T')[0];
};

/**
 * Process payment for a bill
 */
export const processPayment = (bill: Bill): Bill => {
  const today = new Date().toISOString().split('T')[0];
  
  if (bill.bill_type === BILL_TYPES.ONE_TIME) {
    // One-time bill: mark as paid and don't advance
    return {
      ...bill,
      is_paid: true,
      paid_date: today,
    };
  } else if (bill.bill_type === BILL_TYPES.RECURRING) {
    // Recurring bill: log payment and advance due date
    const newPaymentHistory: BillPaymentHistory[] = [
      ...(bill.payment_history || []),
      {
        date: today,
        amount: bill.amount,
      },
    ];
    
    const nextDueDate = calculateNextDueDate(
      bill.due_date,
      bill.recurrence || RECURRENCE_OPTIONS.MONTHLY
    );
    
    return {
      ...bill,
      due_date: nextDueDate,
      next_due_date: nextDueDate,
      payment_history: newPaymentHistory,
    };
  }
  
  return bill;
};

/**
 * Format a date string to readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format payment history with month/year grouping
 */
export const formatPaymentHistory = (history: BillPaymentHistory[] | undefined): Array<{
  period: string;
  date: string;
  formattedDate: string;
}> => {
  if (!history || history.length === 0) return [];
  
  return history
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(payment => {
      const date = new Date(payment.date);
      const period = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      return {
        period,
        date: payment.date,
        formattedDate: formatDate(payment.date),
      };
    });
};

/**
 * Get bills grouped by status
 */
export const groupBillsByStatus = (bills: Bill[]): Record<string, Bill[]> => {
  const grouped: Record<string, Bill[]> = {
    [BILL_STATUS.UPCOMING]: [],
    [BILL_STATUS.DUE_TODAY]: [],
    [BILL_STATUS.OVERDUE]: [],
    [BILL_STATUS.PAID]: [],
  };
  
  bills.forEach(bill => {
    if (bill.is_paid) {
      grouped[BILL_STATUS.PAID].push(bill);
    } else {
      const status = getBillStatus(bill.due_date);
      grouped[status].push(bill);
    }
  });
  
  // Sort each group by due date
  Object.keys(grouped).forEach(status => {
    grouped[status].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  });
  
  return grouped;
};
