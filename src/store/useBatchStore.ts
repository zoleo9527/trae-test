import { create } from 'zustand';
import type { Batch } from '@/types';
import { mockBatches } from '@/data/mockData';

interface BatchState {
  batches: Batch[];
  initFromMock: () => void;
  createBatch: (batch: Batch) => void;
  updateBatchStatus: (batchId: string, status: Batch['status']) => void;
}

export const useBatchStore = create<BatchState>((set) => ({
  batches: [],

  initFromMock: () => set({ batches: mockBatches }),

  createBatch: (batch) =>
    set((state) => ({ batches: [...state.batches, batch] })),

  updateBatchStatus: (batchId, status) =>
    set((state) => ({
      batches: state.batches.map((b) =>
        b.id === batchId ? { ...b, status } : b
      ),
    })),
}));
