import { create } from 'zustand';
import type { ProductionSchedule, CapacityConfig, CapacityInfo } from '../types';
import { mockSchedules, mockCapacityConfigs } from '../utils/mockData';

interface ScheduleState {
  schedules: ProductionSchedule[];
  capacityConfigs: CapacityConfig[];
  selectedDate: string;
  loadSchedules: () => void;
  setSelectedDate: (date: string) => void;
  createSchedule: (schedule: Omit<ProductionSchedule, 'id'>) => void;
  updateSchedule: (id: string, updates: Partial<ProductionSchedule>) => void;
  deleteSchedule: (id: string) => void;
  checkCapacity: (date: string) => CapacityInfo;
  getSchedulesByDate: (date: string) => ProductionSchedule[];
}

const STORAGE_KEY = 'bakery_schedules';
const CONFIG_KEY = 'bakery_capacity_configs';

const saveSchedules = (schedules: ProductionSchedule[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
};

const loadSchedulesFromStorage = (): ProductionSchedule[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return mockSchedules;
    }
  }
  return mockSchedules;
};

const saveConfigs = (configs: CapacityConfig[]) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(configs));
};

const loadConfigsFromStorage = (): CapacityConfig[] => {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return mockCapacityConfigs;
    }
  }
  return mockCapacityConfigs;
};

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: loadSchedulesFromStorage(),
  capacityConfigs: loadConfigsFromStorage(),
  selectedDate: new Date().toISOString().split('T')[0],

  loadSchedules: () => {
    set({
      schedules: loadSchedulesFromStorage(),
      capacityConfigs: loadConfigsFromStorage(),
    });
  },

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  createSchedule: (schedule: Omit<ProductionSchedule, 'id'>) => {
    set((state) => {
      const newSchedule: ProductionSchedule = {
        ...schedule,
        id: `sch-${Date.now()}`,
      };
      const schedules = [...state.schedules, newSchedule];
      saveSchedules(schedules);
      return { schedules };
    });
  },

  updateSchedule: (id: string, updates: Partial<ProductionSchedule>) => {
    set((state) => {
      const schedules = state.schedules.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      saveSchedules(schedules);
      return { schedules };
    });
  },

  deleteSchedule: (id: string) => {
    set((state) => {
      const schedules = state.schedules.filter((s) => s.id !== id);
      saveSchedules(schedules);
      return { schedules };
    });
  },

  checkCapacity: (date: string): CapacityInfo => {
    const { schedules, capacityConfigs } = get();
    const config = capacityConfigs.find((c) => c.date === date);
    const maxOrders = config?.maxDailyOrders || 5;
    
    const daySchedules = schedules.filter((s) => s.date === date);
    const currentOrders = daySchedules.length;

    const chefLoads: Record<string, { assigned: number; max: number }> = {};
    Object.entries(config?.chefCapacities || {}).forEach(([chefId, max]) => {
      const assigned = daySchedules.filter((s) => s.chefId === chefId).length;
      chefLoads[chefId] = { assigned, max };
    });

    return {
      date,
      maxOrders,
      currentOrders,
      remainingCapacity: maxOrders - currentOrders,
      chefLoads,
    };
  },

  getSchedulesByDate: (date: string) => {
    return get().schedules.filter((s) => s.date === date);
  },
}));
