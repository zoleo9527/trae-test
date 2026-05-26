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
    const now = new Date().toISOString();
    const ledgerId = `ledger-${Date.now()}`;
    const recordNo = `LD${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(get().ledgerRecords.length + 1).padStart(3, '0')}`;
    
    const newRecord: LedgerRecord = {
      ...record,
      id: ledgerId,
      recordNo,
      createdAt: now,
      remarks: [],
      operationLogs: [
        {
          id: `log-${Date.now()}`,
          action: '创建台账',
          userId: record.weigherId,
          userName: record.weigherName,
          createdAt: now,
        },
      ],
    };

    const newFinanceRecord: FinanceRecord = {
      id: `finance-${Date.now() + 1}`,
      ledgerId,
      recordNo: `FN${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(get().financeRecords.length + 1).padStart(3, '0')}`,
      amount: record.totalAmount,
      type: 'payable',
      party: record.supplier,
      status: 'pending',
      remarks: `由台账 ${recordNo} 自动生成`,
    };

    set((state) => ({
      ledgerRecords: [newRecord, ...state.ledgerRecords],
      financeRecords: [newFinanceRecord, ...state.financeRecords],
    }));
  },

  updateLedgerStatus: (id, status, userId, userName) => {
    const now = new Date().toISOString();
    set((state) => {
      const ledgerRecord = state.ledgerRecords.find((r) => r.id === id);
      if (!ledgerRecord) return state;

      const relatedFinance = state.financeRecords.find((f) => f.ledgerId === id);
      
      const updateLedger = (r: LedgerRecord) => ({
        ...r,
        status,
        verifiedAt: status === 'verified' ? now : r.verifiedAt,
        reconciledAt: status === 'reconciled' ? now : r.reconciledAt,
        settledAt: status === 'settled' ? now : r.settledAt,
        operationLogs: [
          ...r.operationLogs,
          {
            id: `log-${Date.now()}`,
            action: `状态更新为${status}`,
            userId,
            userName,
            oldValue: r.status,
            newValue: status,
            createdAt: now,
          },
        ],
      });

      const updateFinance = relatedFinance ? (f: FinanceRecord) => {
        if (f.ledgerId !== id) return f;
        if (status === 'verified' && f.status === 'pending') {
          return { ...f, status: 'pending' as const };
        }
        if (status === 'reconciled') {
          return { ...f, status: 'reconciled' as const, reconciledBy: userName, reconciledAt: now };
        }
        if (status === 'settled') {
          return { ...f, status: 'settled' as const, settledAt: now };
        }
        return f;
      } : undefined;

      return {
        ledgerRecords: state.ledgerRecords.map(updateLedger),
        financeRecords: updateFinance ? state.financeRecords.map(updateFinance) : state.financeRecords,
      };
    });
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
    const now = new Date().toISOString();
    const newException: ExceptionRecord = {
      ...exception,
      id: `exp-${Date.now()}`,
      exceptionNo: `EX${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(get().exceptions.length + 1).padStart(3, '0')}`,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      comments: [],
      operationLogs: [
        {
          id: `elog-${Date.now()}`,
          action: '发起异常',
          userId: exception.reporterId,
          userName: exception.reporterName,
          createdAt: now,
        },
      ],
    };
    set((state) => ({
      exceptions: [newException, ...state.exceptions],
    }));
  },

  updateExceptionStatus: (id, status, userId, userName, comment) => {
    const now = new Date().toISOString();
    set((state) => ({
      exceptions: state.exceptions.map((e) =>
        e.id === id
          ? {
              ...e,
              status,
              handlerId: userId,
              handlerName: userName,
              updatedAt: now,
              resolvedAt: status === 'resolved' || status === 'rejected' || status === 'closed' ? now : e.resolvedAt,
              comments: comment
                ? [
                    ...e.comments,
                    {
                      id: `c-${Date.now()}`,
                      userId,
                      userName,
                      content: comment,
                      createdAt: now,
                    },
                  ]
                : e.comments,
              operationLogs: [
                ...e.operationLogs,
                {
                  id: `elog-${Date.now()}`,
                  action: status === 'processing' ? '开始处理' : status === 'resolved' ? '标记已解决' : status === 'rejected' ? '驳回异常' : `状态更新为${status}`,
                  userId,
                  userName,
                  oldValue: e.status,
                  newValue: status,
                  createdAt: now,
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
    const now = new Date().toISOString();
    set((state) => {
      const financeRecord = state.financeRecords.find((f) => f.id === id);
      if (!financeRecord) return state;

      const relatedLedger = state.ledgerRecords.find((r) => r.id === financeRecord.ledgerId);
      
      return {
        financeRecords: state.financeRecords.map((f) =>
          f.id === id
            ? {
                ...f,
                status: 'reconciled',
                reconciledBy,
                reconciledAt: now,
              }
            : f
        ),
        ledgerRecords: relatedLedger && relatedLedger.status === 'verified'
          ? state.ledgerRecords.map((r) =>
              r.id === financeRecord.ledgerId
                ? {
                    ...r,
                    status: 'reconciled',
                    reconciledAt: now,
                    operationLogs: [
                      ...r.operationLogs,
                      {
                        id: `log-${Date.now()}`,
                        action: '状态更新为reconciled',
                        userId: reconciledBy,
                        userName: reconciledBy,
                        oldValue: r.status,
                        newValue: 'reconciled',
                        createdAt: now,
                      },
                    ],
                  }
                : r
            )
          : state.ledgerRecords,
      };
    });
  },

  settleFinance: (id, difference, differenceNote) => {
    const now = new Date().toISOString();
    set((state) => {
      const financeRecord = state.financeRecords.find((f) => f.id === id);
      if (!financeRecord) return state;

      return {
        financeRecords: state.financeRecords.map((f) =>
          f.id === id
            ? {
                ...f,
                status: 'settled',
                settledAt: now,
                difference,
                differenceNote,
              }
            : f
        ),
        ledgerRecords: state.ledgerRecords.map((r) =>
          r.id === financeRecord.ledgerId
            ? {
                ...r,
                status: 'settled',
                settledAt: now,
                operationLogs: [
                  ...r.operationLogs,
                  {
                    id: `log-${Date.now()}`,
                    action: '状态更新为settled',
                    userId: 'system',
                    userName: '系统',
                    oldValue: r.status,
                    newValue: 'settled',
                    createdAt: now,
                  },
                ],
              }
            : r
        ),
      };
    });
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
