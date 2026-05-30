import { create } from 'zustand';
import type { Order } from '@/types';
import { mockOrders } from '@/data/mockData';

interface OrderState {
  orders: Order[];
  overdueCount: number;
  setOrders: (orders: Order[]) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: mockOrders,
  overdueCount: mockOrders.filter((o) => o.isOverdue).length,
  setOrders: (orders) => set({ orders, overdueCount: orders.filter((o) => o.isOverdue).length }),
}));
