import { create } from 'zustand';
import type {
  User,
  UserRole,
  LedgerRecord,
  ExceptionRecord,
  PriceChange,
  FinanceRecord,
  CurrentPrice,
  Comment,
  ExceptionStatus,
  LedgerStatus,
  ExceptionType,
  Category,
} from '../types';
import {
  mockUsers,
  mockLedgerRecords,
  mockExceptions,
  mockPriceChanges,
  mockCurrentPrices,
  mockFinanceRecords,
  mockDailyStats,
  mockCategoryStats,
} from '../data/mockData';

interface AppState {
  currentUser: User;
  currentRole: UserRole;
  users: User[];
  ledgerRecords: LedgerRecord[];
  exceptions: ExceptionRecord[];
  priceChanges: PriceChange[];
  currentPrices: CurrentPrice[];
  financeRecords: FinanceRecord[];
  dailyStats: { date: string; weight: number; amount: number }[];
  categoryStats: { category: string; weight: number; value: number }[];

  setCurrentRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;

  addLedgerRecord: (record: Omit<LedgerRecord, 'id' | 'recordNo' | 'createdAt' | 'remarks' | 'operationLogs'>) => void;
  updateLedgerStatus: (id: string, status: LedgerStatus, userId: string, userName: string) => void;
  addLedgerRemark: (id: string, remark: Omit<Comment, 'id'>) => void;

  addException: (exception: Omit<ExceptionRecord, 'id' | 'exceptionNo' | 'createdAt' | 'updatedAt' | 'comments' | 'operationLogs' | 'status'>) => void;
  updateExceptionStatus: (id: string, status: ExceptionStatus, userId: string, userName: string, comment?: string) => void;
  addExceptionComment: (id: string, comment: Omit<Comment, 'id'>) => void;

  addPriceChange: (change: Omit<PriceChange, 'id' | 'createdAt' | 'comments' | 'status'>) => void;
  approvePriceChange: (id: string, approverId: string, approverName: string) => void;
  rejectPriceChange: (id: string, approverId: string, approverName: string, comment: string) => void;

  reconcileFinance: (id: string, reconciledBy: string) => void;
  settleFinance: (id: string, difference?: number, differenceNote?: string) => void;

  getLedgerById: (id: string) => LedgerRecord | undefined;
  getExceptionById: (id: string) => ExceptionRecord | undefined;
  getFilteredLedger: () => LedgerRecord[];
  getFilteredExceptions: () => ExceptionRecord[];
  getPendingExceptionsCount: () => number;
  getPendingLedgerCount: () => number;
  getPendingFinanceCount: () => number;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: mockUsers[0],
  currentRole: 'owner',
  users: mockUsers,
  ledgerRecords: mockLedgerRecords,
  exceptions: mockExceptions,
  priceChanges: mockPriceChanges,
  currentPrices: mockCurrentPrices,
  financeRecords: mockFinanceRecords,
  dailyStats: mockDailyStats,
  categoryStats: mockCategoryStats,

  setCurrentRole: (role) => set({ currentRole: role }),

  switchUser: (userId) => {
    const user = mockUsers.find((u) => u.id === userId);
    if (user) {
      set({ currentUser: user, currentRole: user.role });
    }
  },

  addLedgerRecord: (record) => {
    const newRecord: LedgerRecord = {
      ...record,
      id: `ledger-${Date.now()}`,
      recordNo: `LD${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(get().ledgerRecords.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      remarks: [],
      operationLogs: [
        {
          id: `log-${Date.now()}`,
          action: '创建台账',
          userId: record.weigherId,
          userName: record.weigherName,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    set((state) => ({
      ledgerRecords: [newRecord, ...state.ledgerRecords],
    }));
  },

  updateLedgerStatus: (id, status, userId, userName) => {
    set((state) => ({
      ledgerRecords: state.ledgerRecords.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              verifiedAt: status === 'verified' ? new Date().toISOString() : r.verifiedAt,
              reconciledAt: status === 'reconciled' ? new Date().toISOString() : r.reconciledAt,
              settledAt: status === 'settled' ? new Date().toISOString() : r.settledAt,
              operationLogs: [
                ...r.operationLogs,
                {
                  id: `log-${Date.now()}`,
                  action: `状态更新为${status}`,
                  userId,
                  userName,
                  oldValue: r.status,
                  newValue: status,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : r
      ),
    }));
  },

  addLedgerRemark: (id, remark) => {
    set((state) => ({
      ledgerRecords: state.ledgerRecords.map((r) =>
        r.id === id
          ? {
              ...r,
              remarks: [...r.remarks, { ...remark, id: `remark-${Date.now()}` }],
            }
          : r
      ),
    }));
  },

  addException: (exception) => {
    const newException: ExceptionRecord = {
      ...exception,
      id: `exp-${Date.now()}`,
      exceptionNo: `EX${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(get().exceptions.length + 1).padStart(3, '0')}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      operationLogs: [
        {
          id: `elog-${Date.now()}`,
          action: '发起异常',
          userId: exception.reporterId,
          userName: exception.reporterName,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    set((state) => ({
      exceptions: [newException, ...state.exceptions],
    }));
  },

  updateExceptionStatus: (id, status, userId, userName, comment) => {
    set((state) => ({
      exceptions: state.exceptions.map((e) =>
        e.id === id
          ? {
              ...e,
              status,
              updatedAt: new Date().toISOString(),
              resolvedAt: status === 'resolved' ? new Date().toISOString() : e.resolvedAt,
              comments: comment
                ? [
                    ...e.comments,
                    {
                      id: `c-${Date.now()}`,
                      userId,
                      userName,
                      content: comment,
                      createdAt: new Date().toISOString(),
                    },
                  ]
                : e.comments,
              operationLogs: [
                ...e.operationLogs,
                {
                  id: `elog-${Date.now()}`,
                  action: `状态更新为${status}`,
                  userId,
                  userName,
                  oldValue: e.status,
                  newValue: status,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : e
      ),
    }));
  },

  addExceptionComment: (id, comment) => {
    set((state) => ({
      exceptions: state.exceptions.map((e) =>
        e.id === id
          ? {
              ...e,
              comments: [...e.comments, { ...comment, id: `c-${Date.now()}` }],
            }
          : e
      ),
    }));
  },

  addPriceChange: (change) => {
    const newChange: PriceChange = {
      ...change,
      id: `price-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      comments: [],
    };
    set((state) => ({
      priceChanges: [newChange, ...state.priceChanges],
    }));
  },

  approvePriceChange: (id, approverId, approverName) => {
    set((state) => {
      const change = state.priceChanges.find((p) => p.id === id);
      if (!change) return state;
      return {
        priceChanges: state.priceChanges.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'approved',
                approverId,
                approverName,
                approvedAt: new Date().toISOString(),
              }
            : p
        ),
        currentPrices: state.currentPrices.map((cp) =>
          cp.category === change.category
            ? { ...cp, price: change.newPrice, updatedAt: change.effectiveDate }
            : cp
        ),
      };
    });
  },

  rejectPriceChange: (id, approverId, approverName, comment) => {
    set((state) => ({
      priceChanges: state.priceChanges.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'rejected',
              approverId,
              approverName,
              comments: [
                ...p.comments,
                {
                  id: `pc-${Date.now()}`,
                  userId: approverId,
                  userName: approverName,
                  content: comment,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : p
      ),
    }));
  },

  reconcileFinance: (id, reconciledBy) => {
    set((state) => ({
      financeRecords: state.financeRecords.map((f) =>
        f.id === id
          ? {
              ...f,
              status: 'reconciled',
              reconciledBy,
              reconciledAt: new Date().toISOString(),
            }
          : f
      ),
    }));
  },

  settleFinance: (id, difference, differenceNote) => {
    set((state) => ({
      financeRecords: state.financeRecords.map((f) =>
        f.id === id
          ? {
              ...f,
              status: 'settled',
              settledAt: new Date().toISOString(),
              difference,
              differenceNote,
            }
          : f
      ),
    }));
  },

  getLedgerById: (id) => get().ledgerRecords.find((r) => r.id === id),
  getExceptionById: (id) => get().exceptions.find((e) => e.id === id),

  getFilteredLedger: () => {
    const { currentRole, currentUser, ledgerRecords } = get();
    if (currentRole === 'weigher') {
      return ledgerRecords.filter((r) => r.weigherId === currentUser.id);
    }
    return ledgerRecords;
  },

  getFilteredExceptions: () => {
    const { currentRole, currentUser, exceptions } = get();
    if (currentRole === 'weigher') {
      return exceptions.filter((e) => e.reporterId === currentUser.id);
    }
    return exceptions;
  },

  getPendingExceptionsCount: () => {
    const { currentRole, currentUser, exceptions } = get();
    if (currentRole === 'owner') {
      return exceptions.filter((e) => e.status === 'pending' || e.status === 'processing').length;
    }
    if (currentRole === 'weigher') {
      return exceptions.filter((e) => e.reporterId === currentUser.id && e.status !== 'closed' && e.status !== 'resolved').length;
    }
    return 0;
  },

  getPendingLedgerCount: () => {
    const { currentRole, currentUser, ledgerRecords } = get();
    if (currentRole === 'owner') {
      return ledgerRecords.filter((r) => r.status === 'pending').length;
    }
    if (currentRole === 'weigher') {
      return ledgerRecords.filter((r) => r.weigherId === currentUser.id && r.status === 'pending').length;
    }
    return 0;
  },

  getPendingFinanceCount: () => {
    const { currentRole, financeRecords } = get();
    if (currentRole === 'owner' || currentRole === 'accountant') {
      return financeRecords.filter((r) => r.status === 'pending').length;
    }
    return 0;
  },
}));
