import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { appReducer, initialState } from './reducer';
import type { AppState, AppAction } from '@/types/state';
import {
  mockUsers,
  mockProjects,
  mockShippingOrders,
  mockReceipts,
  mockReworkOrders,
  mockDisputes,
  mockAlerts,
  mockActionLogs,
  mockDashboardStats,
} from '@/data/mock';
import {
  setCurrentUser,
  setCurrentProject,
  setProjects,
  setShippingOrders,
  setReceipts,
  setReworkOrders,
  setDisputes,
  setAlerts,
  setActionLogs,
  setDashboardStats,
} from './actions';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    dispatch(setCurrentUser(mockUsers[0]));
    dispatch(setProjects(mockProjects));
    dispatch(setCurrentProject(mockProjects[0]));
    dispatch(setShippingOrders(mockShippingOrders));
    dispatch(setReceipts(mockReceipts));
    dispatch(setReworkOrders(mockReworkOrders));
    dispatch(setDisputes(mockDisputes));
    dispatch(setAlerts(mockAlerts));
    dispatch(setActionLogs(mockActionLogs));
    dispatch(setDashboardStats(mockDashboardStats));
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
