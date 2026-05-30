"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { User, UserRole } from "@/types";
import { mockUsers } from "@/lib/mockData";

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
