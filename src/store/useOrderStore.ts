import { create } from 'zustand';
import type { Order, DamageRecord, RewashRecord, Receipt } from '@/types';
import { mockOrders, mockDamageRecords, mockRewashRecords, mockReceipts } from '@/data/mockData';

interface OrderState {
  orders: Order[];
  damageRecords: DamageRecord[];
  rewashRecords: RewashRecord[];
  receipts: Receipt[];
  overdueCount: number;
  setOrders: (orders: Order[]) => void;
  updateOrderStatus: (orderId: string, status: Order['status'], assignedTo?: Order['assignedTo']) => void;
  addDamageRecord: (record: Omit<DamageRecord, 'id' | 'recordedAt'>) => void;
  addRewashRecord: (record: Omit<RewashRecord, 'id' | 'createdAt' | 'rewashCompletedAt'>) => void;
  updateRewashStatus: (rewashId: string, status: RewashRecord['status']) => void;
  updateReceipt: (orderId: string, updates: Partial<Receipt>) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: mockOrders,
  damageRecords: mockDamageRecords,
  rewashRecords: mockRewashRecords,
  receipts: mockReceipts,
  overdueCount: mockOrders.filter((o) => o.isOverdue).length,

  setOrders: (orders) => set({ orders, overdueCount: orders.filter((o) => o.isOverdue).length }),

  updateOrderStatus: (orderId, status, assignedTo) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? { ...o, status, updatedAt: new Date().toISOString(), ...(assignedTo && { assignedTo }) }
          : o
      ),
    })),

  addDamageRecord: (record) =>
    set((state) => ({
      damageRecords: [
        ...state.damageRecords,
        {
          ...record,
          id: `DMG-${String(state.damageRecords.length + 1).padStart(3, '0')}`,
          recordedAt: new Date().toISOString(),
        },
      ],
    })),

  addRewashRecord: (record) =>
    set((state) => ({
      rewashRecords: [
        ...state.rewashRecords,
        {
          ...record,
          id: `RW-${String(state.rewashRecords.length + 1).padStart(3, '0')}`,
          createdAt: new Date().toISOString(),
          rewashCompletedAt: null,
        } as RewashRecord,
      ],
    })),

  updateRewashStatus: (rewashId, status) =>
    set((state) => ({
      rewashRecords: state.rewashRecords.map((r) =>
        r.id === rewashId
          ? {
              ...r,
              status,
              rewashCompletedAt: status === 'completed' ? new Date().toISOString() : r.rewashCompletedAt,
            }
          : r
      ),
    })),

  updateReceipt: (orderId, updates) =>
    set((state) => {
      const existingReceipt = state.receipts.find((r) => r.orderId === orderId);
      if (existingReceipt) {
        return {
          receipts: state.receipts.map((r) =>
            r.orderId === orderId ? { ...r, ...updates } : r
          ),
        };
      }
      return {
        receipts: [
          ...state.receipts,
          {
            id: `RCT-${String(state.receipts.length + 1).padStart(3, '0')}`,
            orderId,
            isVerified: false,
            verifiedAt: null,
            verifiedBy: null,
            isRejected: false,
            rejectReason: null,
            ...updates,
          },
        ],
      };
    }),
}));
