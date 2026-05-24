import { createContext, useContext, useReducer, useEffect } from 'react';
import { changeOrders as initialChangeOrders, feeRecords as initialFeeRecords, users } from '../data/mockData';

const STORAGE_KEY = 'home-supervision-data';

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return {
    changeOrders: initialChangeOrders,
    feeRecords: initialFeeRecords,
  };
};

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
};

const getCurrentTime = () => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SUPERVISOR_RESUBMIT': {
      const { orderId, userId, updates } = action.payload;
      const user = users.find(u => u.id === userId);
      
      return {
        ...state,
        changeOrders: state.changeOrders.map(order => {
          if (order.id !== orderId) return order;
          
          const newVersion = order.version + 1;
          const newTimeline = [
            ...order.timeline,
            {
              time: getCurrentTime(),
              action: `更新变更单（v${newVersion}）并重新提交`,
              user: user?.name || '未知',
              role: 'supervisor',
            },
          ];
          
          return {
            ...order,
            ...updates,
            version: newVersion,
            status: 'pending_approval',
            currentHandler: 'manager',
            timeline: newTimeline,
            approvals: {
              ...order.approvals,
              supervisor: {
                approved: true,
                time: getCurrentTime(),
                comment: '重新提交审核',
                user: user?.name,
              },
              manager: { approved: null, time: null, comment: null, user: null },
            },
          };
        }),
      };
    }

    case 'MANAGER_APPROVE': {
      const { orderId, userId, comment } = action.payload;
      const user = users.find(u => u.id === userId);
      
      return {
        ...state,
        changeOrders: state.changeOrders.map(order => {
          if (order.id !== orderId) return order;
          
          const newTimeline = [
            ...order.timeline,
            {
              time: getCurrentTime(),
              action: '管家审核通过',
              user: user?.name || '未知',
              role: 'manager',
            },
            {
              time: getCurrentTime(),
              action: '待业主确认',
              user: user?.name || '未知',
              role: 'manager',
            },
          ];
          
          return {
            ...order,
            status: 'pending_owner',
            currentHandler: 'owner',
            timeline: newTimeline,
            approvals: {
              ...order.approvals,
              manager: {
                approved: true,
                time: getCurrentTime(),
                comment: comment || '审核通过',
                user: user?.name,
              },
            },
          };
        }),
      };
    }

    case 'MANAGER_REJECT': {
      const { orderId, userId, comment } = action.payload;
      const user = users.find(u => u.id === userId);
      
      return {
        ...state,
        changeOrders: state.changeOrders.map(order => {
          if (order.id !== orderId) return order;
          
          const newTimeline = [
            ...order.timeline,
            {
              time: getCurrentTime(),
              action: `驳回：${comment || '需要补充信息'}`,
              user: user?.name || '未知',
              role: 'manager',
            },
          ];
          
          return {
            ...order,
            status: 'rejected',
            currentHandler: 'supervisor',
            timeline: newTimeline,
            approvals: {
              ...order.approvals,
              manager: {
                approved: false,
                time: getCurrentTime(),
                comment: comment || '驳回',
                user: user?.name,
              },
            },
          };
        }),
      };
    }

    case 'SEND_OWNER_CONFIRMATION': {
      const { orderId, userId } = action.payload;
      const user = users.find(u => u.id === userId);
      
      return {
        ...state,
        changeOrders: state.changeOrders.map(order => {
          if (order.id !== orderId) return order;
          
          const newTimeline = [
            ...order.timeline,
            {
              time: getCurrentTime(),
              action: '已发送业主确认通知',
              user: user?.name || '未知',
              role: 'manager',
            },
          ];
          
          return {
            ...order,
            timeline: newTimeline,
          };
        }),
      };
    }

    case 'OWNER_APPROVE': {
      const { orderId } = action.payload;
      
      return {
        ...state,
        changeOrders: state.changeOrders.map(order => {
          if (order.id !== orderId) return order;
          
          const newTimeline = [
            ...order.timeline,
            {
              time: getCurrentTime(),
              action: '业主确认签字',
              user: '业主',
              role: 'owner',
            },
            {
              time: getCurrentTime(),
              action: '变更单生效',
              user: '系统',
              role: 'system',
            },
          ];
          
          return {
            ...order,
            status: 'completed',
            currentHandler: null,
            timeline: newTimeline,
            approvals: {
              ...order.approvals,
              owner: {
                approved: true,
                time: getCurrentTime(),
                comment: '同意变更',
                user: '业主',
              },
            },
          };
        }),
        feeRecords: state.feeRecords.some(f => f.relatedId === orderId) 
          ? state.feeRecords.map(f => 
              f.relatedId === orderId ? { ...f, status: 'pending_pay' } : f
            )
          : [
              ...state.feeRecords,
              {
                id: `FY${Date.now().toString().slice(-6)}`,
                projectId: state.changeOrders.find(o => o.id === orderId)?.projectId,
                projectName: state.changeOrders.find(o => o.id === orderId)?.projectName,
                type: 'change_order',
                relatedId: orderId,
                title: state.changeOrders.find(o => o.id === orderId)?.title,
                amount: Math.abs(state.changeOrders.find(o => o.id === orderId)?.costChange?.difference || 0),
                status: 'pending_pay',
                createdAt: getCurrentTime(),
              },
            ],
      };
    }

    case 'CONFIRM_FEE': {
      const { feeId, userId } = action.payload;
      const user = users.find(u => u.id === userId);
      
      return {
        ...state,
        feeRecords: state.feeRecords.map(fee => {
          if (fee.id !== feeId) return fee;
          return {
            ...fee,
            status: 'pending_pay',
            confirmedBy: user?.name,
            confirmedAt: getCurrentTime(),
          };
        }),
      };
    }

    case 'MARK_FEE_PAID': {
      const { feeId, userId } = action.payload;
      const user = users.find(u => u.id === userId);
      
      return {
        ...state,
        feeRecords: state.feeRecords.map(fee => {
          if (fee.id !== feeId) return fee;
          return {
            ...fee,
            status: 'paid',
            paidAt: getCurrentTime(),
            paidBy: user?.name,
          };
        }),
      };
    }

    case 'RESET_DATA': {
      return {
        changeOrders: initialChangeOrders,
        feeRecords: initialFeeRecords,
      };
    }

    default:
      return state;
  }
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const actions = {
    supervisorResubmit: (orderId, userId, updates = {}) => {
      dispatch({ type: 'SUPERVISOR_RESUBMIT', payload: { orderId, userId, updates } });
    },
    managerApprove: (orderId, userId, comment = '') => {
      dispatch({ type: 'MANAGER_APPROVE', payload: { orderId, userId, comment } });
    },
    managerReject: (orderId, userId, comment = '') => {
      dispatch({ type: 'MANAGER_REJECT', payload: { orderId, userId, comment } });
    },
    sendOwnerConfirmation: (orderId, userId) => {
      dispatch({ type: 'SEND_OWNER_CONFIRMATION', payload: { orderId, userId } });
    },
    ownerApprove: (orderId) => {
      dispatch({ type: 'OWNER_APPROVE', payload: { orderId } });
    },
    confirmFee: (feeId, userId) => {
      dispatch({ type: 'CONFIRM_FEE', payload: { feeId, userId } });
    },
    markFeePaid: (feeId, userId) => {
      dispatch({ type: 'MARK_FEE_PAID', payload: { feeId, userId } });
    },
    resetData: () => {
      dispatch({ type: 'RESET_DATA' });
    },
  };

  return (
    <AppContext.Provider value={{ ...state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
