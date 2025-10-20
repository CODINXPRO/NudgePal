import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BillService, Bill } from '../services/billService';

interface BillsContextType {
  bills: Bill[];
  upcomingBills: Bill[];
  urgentBills: Bill[];
  isLoading: boolean;
  addBill: (billData: Omit<Bill, 'id' | 'createdAt' | 'paymentHistory'>) => Promise<Bill>;
  deleteBill: (billId: string) => Promise<void>;
  refreshBills: () => Promise<void>;
  getBillsForDate: (date: Date) => Promise<Bill[]>;
  updateBill: (billId: string, updates: Partial<Bill>) => Promise<Bill>;
  markAsPaid: (billId: string) => Promise<void>;
}

const BillsContext = createContext<BillsContextType | undefined>(undefined);

export const BillsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<Bill[]>([]);
  const [urgentBills, setUrgentBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Refresh bills function
  const refreshBills = useCallback(async () => {
    try {
      setIsLoading(true);
      const allBills = await BillService.loadBills();
      setBills(allBills);

      // Get urgent bills
      const urgent = await BillService.getBillsByStatus('urgent');
      setUrgentBills(urgent);

      // Get upcoming bills
      const upcoming = await BillService.getUpcomingBills(30);
      setUpcomingBills(upcoming);
    } catch (error) {
      console.error('Error refreshing bills:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    console.log('🚀 BillsContext: Initializing bills');
    refreshBills();
  }, [refreshBills]);

  // Add bill function
  const addBill = useCallback(
    async (billData: Omit<Bill, 'id' | 'createdAt' | 'paymentHistory'>) => {
      try {
        const newBill = await BillService.addBill(billData);
        await refreshBills();
        return newBill;
      } catch (error) {
        console.error('Error adding bill:', error);
        throw error;
      }
    },
    [refreshBills]
  );

  // Delete bill function
  const deleteBill = useCallback(
    async (billId: string) => {
      try {
        await BillService.deleteBill(billId);
        await refreshBills();
      } catch (error) {
        console.error('Error deleting bill:', error);
        throw error;
      }
    },
    [refreshBills]
  );

  // Get bills for specific date
  const getBillsForDate = useCallback(async (date: Date) => {
    try {
      return await BillService.getBillsForDate(date);
    } catch (error) {
      console.error('Error getting bills for date:', error);
      return [];
    }
  }, []);

  // Update bill function
  const updateBill = useCallback(
    async (billId: string, updates: Partial<Bill>) => {
      try {
        const updated = await BillService.updateBill(billId, updates);
        await refreshBills();
        return updated;
      } catch (error) {
        console.error('Error updating bill:', error);
        throw error;
      }
    },
    [refreshBills]
  );

  // Mark bill as paid
  const markAsPaid = useCallback(
    async (billId: string) => {
      try {
        await BillService.markAsPaid(billId);
        await refreshBills();
      } catch (error) {
        console.error('Error marking bill as paid:', error);
        throw error;
      }
    },
    [refreshBills]
  );

  return (
    <BillsContext.Provider
      value={{
        bills,
        upcomingBills,
        urgentBills,
        isLoading,
        addBill,
        deleteBill,
        refreshBills,
        getBillsForDate,
        updateBill,
        markAsPaid,
      }}
    >
      {children}
    </BillsContext.Provider>
  );
};

export const useBills = () => {
  const context = useContext(BillsContext);
  if (!context) {
    throw new Error('useBills must be used within a BillsProvider');
  }
  return context;
};
