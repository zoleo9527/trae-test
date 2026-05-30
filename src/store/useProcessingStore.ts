import { create } from 'zustand';
import type { ProcessingContext } from '@/types';

interface ProcessingState extends ProcessingContext {
  openProcessing: (orderId: string, mode: ProcessingContext['mode']) => void;
  closeProcessing: () => void;
}

export const useProcessingStore = create<ProcessingState>((set) => ({
  orderId: null,
  isOpen: false,
  mode: null,

  openProcessing: (orderId, mode) => set({ orderId, isOpen: true, mode }),
  closeProcessing: () => set({ orderId: null, isOpen: false, mode: null }),
}));
