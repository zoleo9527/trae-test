import { create } from 'zustand';
import type {
  Order,
  OrderStatus,
  OrderFilters,
  OrderHistory,
  ChangeRequest,
  RefundRequest,
} from '../types';
import { mockOrders } from '../utils/mockData';

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  filters: OrderFilters;
  loadOrders: () => void;
  selectOrder: (id: string | null) => void;
  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    remarks: string,
    operator: string,
    operatorRole: string
  ) => void;
  applyFilters: (filters: Partial<OrderFilters>) => void;
  clearFilters: () => void;
  getFilteredOrders: () => Order[];
  requestChange: (orderId: string, changeRequest: Omit<ChangeRequest, 'id'>) => void;
  requestRefund: (orderId: string, refundRequest: Omit<RefundRequest, 'id'>) => void;
  approveChange: (orderId: string, reviewNotes: string, operator: string) => void;
  rejectChange: (orderId: string, reviewNotes: string, operator: string) => void;
  approveRefund: (orderId: string, reviewNotes: string, operator: string) => void;
  rejectRefund: (orderId: string, reviewNotes: string, operator: string) => void;
  addOrderHistory: (orderId: string, history: Omit<OrderHistory, 'id'>) => void;
}

const STORAGE_KEY = 'bakery_orders';

const saveOrders = (orders: Order[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
};

const loadOrdersFromStorage = (): Order[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return mockOrders;
    }
  }
  return mockOrders;
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: loadOrdersFromStorage(),
  selectedOrder: null,
  filters: {},

  loadOrders: () => {
    set({ orders: loadOrdersFromStorage() });
  },

  selectOrder: (id: string | null) => {
    if (!id) {
      set({ selectedOrder: null });
      return;
    }
    const order = get().orders.find((o) => o.id === id);
    set({ selectedOrder: order || null });
  },

  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    remarks: string,
    operator: string,
    operatorRole: string
  ) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id === id) {
          const newHistory: OrderHistory = {
            id: `h-${Date.now()}`,
            orderId: id,
            action: `状态变更: ${getStatusText(order.status)} → ${getStatusText(status)}`,
            operator,
            operatorRole: operatorRole as any,
            timestamp: new Date().toISOString(),
            remarks,
          };
          return {
            ...order,
            status,
            updatedAt: new Date().toISOString(),
            history: [...order.history, newHistory],
          };
        }
        return order;
      });
      saveOrders(orders);
      const selectedOrder = orders.find((o) => o.id === state.selectedOrder?.id);
      return { orders, selectedOrder: selectedOrder || state.selectedOrder };
    });
  },

  applyFilters: (filters: Partial<OrderFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  getFilteredOrders: () => {
    const { orders, filters } = get();
    return orders.filter((order) => {
      if (filters.status && order.status !== filters.status) return false;
      if (filters.isUrgent && !order.isUrgent) return false;
      if (filters.isOverdue && !order.isOverdue) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (
          !order.orderNo.toLowerCase().includes(search) &&
          !order.customerName.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      return true;
    });
  },

  requestChange: (orderId: string, changeRequest: Omit<ChangeRequest, 'id'>) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: 'change_requested' as OrderStatus,
            changeRequest: {
              ...changeRequest,
              id: `cr-${Date.now()}`,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      });
      saveOrders(orders);
      return { orders };
    });
  },

  requestRefund: (orderId: string, refundRequest: Omit<RefundRequest, 'id'>) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: 'refund_requested' as OrderStatus,
            refundRequest: {
              ...refundRequest,
              id: `rf-${Date.now()}`,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      });
      saveOrders(orders);
      return { orders };
    });
  },

  approveChange: (orderId: string, reviewNotes: string, operator: string) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id === orderId && order.changeRequest) {
          const changes = order.changeRequest.changes;
          let updatedOrder = { ...order };
          changes.forEach((change) => {
            if (change.field === 'pickupTime') {
              updatedOrder.pickupTime = change.newValue;
            }
          });
          return {
            ...updatedOrder,
            status: 'scheduled' as OrderStatus,
            changeRequest: {
              ...order.changeRequest,
              status: 'approved' as const,
              reviewedBy: operator,
              reviewedAt: new Date().toISOString(),
              reviewNotes,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      });
      saveOrders(orders);
      return { orders };
    });
  },

  rejectChange: (orderId: string, reviewNotes: string, operator: string) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id === orderId && order.changeRequest) {
          return {
            ...order,
            status: 'scheduled' as OrderStatus,
            changeRequest: {
              ...order.changeRequest,
              status: 'rejected' as const,
              reviewedBy: operator,
              reviewedAt: new Date().toISOString(),
              reviewNotes,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      });
      saveOrders(orders);
      return { orders };
    });
  },

  approveRefund: (orderId: string, reviewNotes: string, operator: string) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id === orderId && order.refundRequest) {
          return {
            ...order,
            status: 'refunded' as OrderStatus,
            refundRequest: {
              ...order.refundRequest,
              status: 'approved' as const,
              reviewedBy: operator,
              reviewedAt: new Date().toISOString(),
              reviewNotes,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      });
      saveOrders(orders);
      return { orders };
    });
  },

  rejectRefund: (orderId: string, reviewNotes: string, operator: string) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id === orderId && order.refundRequest) {
          return {
            ...order,
            status: 'scheduled' as OrderStatus,
            refundRequest: {
              ...order.refundRequest,
              status: 'rejected' as const,
              reviewedBy: operator,
              reviewedAt: new Date().toISOString(),
              reviewNotes,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      });
      saveOrders(orders);
      return { orders };
    });
  },

  addOrderHistory: (orderId: string, history: Omit<OrderHistory, 'id'>) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            history: [
              ...order.history,
              { ...history, id: `h-${Date.now()}` },
            ],
          };
        }
        return order;
      });
      saveOrders(orders);
      return { orders };
    });
  },
}));

function getStatusText(status: OrderStatus): string {
  const statusMap: Record<OrderStatus, string> = {
    pending_review: '待审核',
    reviewed: '已审核',
    scheduled: '已排期',
    in_production: '生产中',
    completed: '已完成',
    change_requested: '申请改单',
    refund_requested: '申请退款',
    refunded: '已退款',
    cancelled: '已取消',
  };
  return statusMap[status];
}
