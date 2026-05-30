"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { User, UserRole, BorrowRecord, ReturnInspection, StoredValueRecord } from "@/types";
import { mockUsers, mockBorrowRecords, mockReturnInspections, mockStoredValueRecords } from "@/lib/mockData";

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  canApprove: boolean;
  canHandleDisputes: boolean;
  canViewAllRecords: boolean;
  canProcessReturns: boolean;
  borrowRecords: BorrowRecord[];
  returnInspections: ReturnInspection[];
  storedValueRecords: StoredValueRecord[];
  updateBorrowStatus: (id: string, updates: Partial<BorrowRecord>) => void;
  addReturnInspection: (inspection: ReturnInspection) => void;
  addStoredValueRecord: (record: StoredValueRecord) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>(mockBorrowRecords);
  const [returnInspections, setReturnInspections] = useState<ReturnInspection[]>(mockReturnInspections);
  const [storedValueRecords, setStoredValueRecords] = useState<StoredValueRecord[]>(mockStoredValueRecords);

  const switchRole = (role: UserRole) => {
    const user = mockUsers.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
    }
  };

  const canApprove = currentUser.role === "manager" || currentUser.role === "reception";
  const canHandleDisputes = currentUser.role === "manager";
  const canViewAllRecords = currentUser.role === "manager";
  const canProcessReturns = currentUser.role === "reception" || currentUser.role === "manager";

  const updateBorrowStatus = useCallback((id: string, updates: Partial<BorrowRecord>) => {
    setBorrowRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ") } : r))
    );
  }, []);

  const addReturnInspection = useCallback((inspection: ReturnInspection) => {
    setReturnInspections((prev) => [...prev, inspection]);
  }, []);

  const addStoredValueRecord = useCallback((record: StoredValueRecord) => {
    setStoredValueRecords((prev) => [...prev, record]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        isLoading,
        setIsLoading,
        error,
        setError,
        canApprove,
        canHandleDisputes,
        canViewAllRecords,
        canProcessReturns,
        borrowRecords,
        returnInspections,
        storedValueRecords,
        updateBorrowStatus,
        addReturnInspection,
        addStoredValueRecord,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
