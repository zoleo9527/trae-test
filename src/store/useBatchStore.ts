import { mockBatches } from '@/data/mockData';
import type { Batch } from '@/types';
import { create } from 'zustand';

interface BatchState {
  batches: Batch[];
  setBatches: (batches: Batch[]) => void;
  addOrderToBatch: (batchId: string, orderId: string) => void;
  removeOrderFromBatch: (batchId: string, orderId: string) => void;
  updateBatchStatus: (batchId: string, status: Batch['status']) => void;
  createBatch: (batch: Omit<Batch, 'id'>) => void;
}

export const useBatchStore = create<BatchState>((set, get) => ({
  batches: mockBatches,

  setBatches: (batches) => set({ batches }),

  addOrderToBatch: (batchId, orderId) =>
    set((state) => ({
      batches: state.batches.map((b) =>
        b.id === batchId
          ? { ...b, orderIds: [...new Set([...b.orderIds, orderId])] }
          : b
      ),
    })),

  removeOrderFromBatch: (batchId, orderId) =>
    set((state) => ({
      batches: state.batches.map((b) =>
        b.id === batchId
          ? { ...b, orderIds: b.orderIds.filter((id) => id !== orderId) }
          : b
      ),
    })),

  updateBatchStatus: (batchId, status) =>
    set((state) => ({
      batches: state.batches.map((b) =>
        b.id === batchId
          ? {
              ...b,
              status,
              washEndTime: status === 'completed' ? new Date().toISOString() : b.washEndTime,
            }
          : b
      ),
    })),

  createBatch: (batch) =>
    set((state) => ({
      batches: [
        ...state.batches,
        {
          ...batch,
          id: `B-${String(state.batches.length + 1).padStart(3, '0')}`,
        } as Batch,
      ],
    })),
}));
