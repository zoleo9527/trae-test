import { create } from 'zustand';
import type { Communication } from '../types';
import { mockCommunications } from '../utils/mockData';

interface CommunicationState {
  communications: Communication[];
  loadCommunications: () => void;
  addCommunication: (comm: Omit<Communication, 'id'>) => void;
  getCommunicationsByOrder: (orderId: string) => Communication[];
}

const STORAGE_KEY = 'bakery_communications';

const saveCommunications = (comms: Communication[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comms));
};

const loadCommunicationsFromStorage = (): Communication[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return mockCommunications;
    }
  }
  return mockCommunications;
};

export const useCommunicationStore = create<CommunicationState>((set, get) => ({
  communications: loadCommunicationsFromStorage(),

  loadCommunications: () => {
    set({ communications: loadCommunicationsFromStorage() });
  },

  addCommunication: (comm: Omit<Communication, 'id'>) => {
    set((state) => {
      const newComm: Communication = {
        ...comm,
        id: `comm-${Date.now()}`,
      };
      const communications = [...state.communications, newComm];
      saveCommunications(communications);
      return { communications };
    });
  },

  getCommunicationsByOrder: (orderId: string) => {
    return get().communications
      .filter((c) => c.orderId === orderId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  },
}));
