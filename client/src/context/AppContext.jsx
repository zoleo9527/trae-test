import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEFAULT_USERS } from '../data/constants.js';
import {
    mockColdRoomInventory,
    mockCollectionRecords,
    mockComplaintRecords,
    mockCreditOrders,
    mockCustomers,
    mockGradingRecords,
    mockLossRecords,
    mockNotifications,
    mockTasks,
    mockWeighingOrders
} from '../data/mockData.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(DEFAULT_USERS[0]);
  const [customers, setCustomers] = useState(mockCustomers);
  const [weighingOrders, setWeighingOrders] = useState(mockWeighingOrders);
  const [coldRoomInventory, setColdRoomInventory] = useState(mockColdRoomInventory);
  const [gradingRecords, setGradingRecords] = useState(mockGradingRecords);
  const [creditOrders, setCreditOrders] = useState(mockCreditOrders);
  const [collectionRecords, setCollectionRecords] = useState(mockCollectionRecords);
  const [lossRecords, setLossRecords] = useState(mockLossRecords);
  const [complaintRecords, setComplaintRecords] = useState(mockComplaintRecords);
  const [tasks, setTasks] = useState(mockTasks);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const switchUser = useCallback((userId) => {
    const user = DEFAULT_USERS.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const addTask = useCallback((task) => {
    const newTask = {
      ...task,
      id: Date.now(),
      createDate: new Date().toISOString().split('T')[0]
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const updateTask = useCallback((taskId, updates) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  }, []);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      ...notification,
      id: Date.now(),
      createDate: new Date().toISOString().split('T')[0]
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const addWeighingOrder = useCallback((order) => {
    const newOrder = {
      ...order,
      id: `WO${Date.now()}`,
      createDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      gradingStatus: 'pending'
    };
    setWeighingOrders(prev => [newOrder, ...prev]);
    addTask({
      title: `过磅单 ${newOrder.id} 待确认`,
      type: 'weighing',
      priority: 'high',
      status: 'pending',
      assignedTo: currentUser.name,
      relatedId: newOrder.id,
      dueDate: new Date().toISOString().split('T')[0]
    });
    addNotification({
      type: 'info',
      message: `新的过磅单 ${newOrder.id} 已创建`,
      relatedTo: newOrder.id
    });
  }, [currentUser.name, addTask, addNotification]);

  const confirmWeighingOrder = useCallback((orderId) => {
    setWeighingOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'confirmed' } : o));
    setTasks(prev => prev.map(t => t.relatedId === orderId && t.type === 'weighing' ? { ...t, status: 'completed' } : t));
  }, []);

  const addGradingRecord = useCallback((record) => {
    const newRecord = {
      ...record,
      id: `GR${Date.now()}`,
      createDate: new Date().toISOString().split('T')[0],
      status: 'in_progress'
    };
    setGradingRecords(prev => [newRecord, ...prev]);
    setWeighingOrders(prev => prev.map(o => o.id === record.weighingOrderId ? { ...o, gradingStatus: 'in_progress' } : o));
  }, []);

  const completeGrading = useCallback((recordId) => {
    const record = gradingRecords.find(r => r.id === recordId);
    if (record) {
      setGradingRecords(prev => prev.map(r => r.id === recordId ? { ...r, status: 'completed' } : r));
      setWeighingOrders(prev => prev.map(o => o.id === record.weighingOrderId ? { ...o, gradingStatus: 'completed' } : o));
      setTasks(prev => prev.map(t => t.relatedId === recordId && t.type === 'grading' ? { ...t, status: 'completed' } : t));
    }
  }, [gradingRecords]);

  const addCreditOrder = useCallback((order) => {
    const newOrder = {
      ...order,
      id: `CO${Date.now()}`,
      createDate: new Date().toISOString().split('T')[0],
      status: 'normal',
      paidAmount: 0
    };
    setCreditOrders(prev => [newOrder, ...prev]);
    const customer = customers.find(c => c.id === order.customerId);
    if (customer) {
      setCustomers(prev => prev.map(c => c.id === order.customerId ? {
        ...c,
        currentCredit: c.currentCredit + order.totalAmount
      } : c));
    }
    addTask({
      title: `${customer?.name || '客户'} ${newOrder.id} 账款待催办`,
      type: 'collection',
      priority: 'medium',
      status: 'pending',
      assignedTo: order.salesperson || '李销售',
      relatedId: newOrder.id,
      dueDate: order.dueDate
    });
    addNotification({
      type: 'info',
      message: `新赊销单 ${newOrder.id} 已创建，到期日 ${order.dueDate}`,
      relatedTo: newOrder.id
    });
  }, [customers, addTask, addNotification]);

  const addCollectionRecord = useCallback((record) => {
    const newRecord = {
      ...record,
      id: `CR${Date.now()}`,
      createDate: new Date().toISOString().split('T')[0]
    };
    setCollectionRecords(prev => [newRecord, ...prev]);

    addTask({
      title: `${record.customerName} 回款催办`,
      type: 'collection',
      priority: 'high',
      status: record.status === 'completed' ? 'completed' : record.status,
      assignedTo: record.operator || '李销售',
      relatedId: newRecord.id,
      dueDate: record.nextFollowDate || new Date().toISOString().split('T')[0]
    });

    if (record.status === 'completed') {
      const order = creditOrders.find(o => o.id === record.creditOrderId);
      if (order) {
        const newPaidAmount = order.paidAmount + record.amount;
        const isFullyPaid = newPaidAmount >= order.totalAmount;
        setCreditOrders(prev => prev.map(o => o.id === record.creditOrderId ? {
          ...o,
          paidAmount: newPaidAmount,
          status: isFullyPaid ? 'paid' : o.status
        } : o));
        const customer = customers.find(c => c.id === order.customerId);
        if (customer) {
          setCustomers(prev => prev.map(c => c.id === order.customerId ? {
            ...c,
            currentCredit: Math.max(0, c.currentCredit - record.amount)
          } : c));
        }
        addNotification({
          type: 'success',
          message: `${record.customerName} 订单 ${record.creditOrderId} 已回款 ¥${record.amount.toLocaleString()}`,
          relatedTo: record.creditOrderId
        });
      }
    }
  }, [creditOrders, customers, addTask, addNotification]);

  const completeCollectionRecord = useCallback((recordId) => {
    const record = collectionRecords.find(r => r.id === recordId);
    if (!record) return;

    setCollectionRecords(prev => prev.map(r => r.id === recordId ? {
      ...r,
      status: 'completed',
      nextFollowDate: null
    } : r));

    const order = creditOrders.find(o => o.id === record.creditOrderId);
    if (order) {
      const newPaidAmount = order.paidAmount + record.amount;
      const isFullyPaid = newPaidAmount >= order.totalAmount;
      setCreditOrders(prev => prev.map(o => o.id === record.creditOrderId ? {
        ...o,
        paidAmount: newPaidAmount,
        status: isFullyPaid ? 'paid' : o.status
      } : o));
      const customer = customers.find(c => c.id === order.customerId);
      if (customer) {
        setCustomers(prev => prev.map(c => c.id === order.customerId ? {
          ...c,
          currentCredit: Math.max(0, c.currentCredit - record.amount)
        } : c));
      }
    }

    setTasks(prev => prev.map(t => t.relatedId === recordId && t.type === 'collection' ? {
      ...t,
      status: 'completed'
    } : t));

    addNotification({
      type: 'success',
      message: `${record.customerName} 催办记录 ${recordId} 已标记完成，回款 ¥${record.amount.toLocaleString()}`,
      relatedTo: record.creditOrderId
    });
  }, [collectionRecords, creditOrders, customers, addNotification]);

  const addLossRecord = useCallback((record) => {
    const newRecord = {
      ...record,
      id: `LS${Date.now()}`,
      createDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    setLossRecords(prev => [newRecord, ...prev]);
    addTask({
      title: `损耗记录 ${newRecord.id} 待审核`,
      type: 'loss',
      priority: 'medium',
      status: 'pending',
      assignedTo: '张经理',
      relatedId: newRecord.id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  }, [addTask]);

  const confirmLossRecord = useCallback((recordId) => {
    setLossRecords(prev => prev.map(r => r.id === recordId ? { ...r, status: 'confirmed' } : r));
    setTasks(prev => prev.map(t => t.relatedId === recordId && t.type === 'loss' ? { ...t, status: 'completed' } : t));
  }, []);

  const rejectLossRecord = useCallback((recordId, reason) => {
    setLossRecords(prev => prev.map(r => r.id === recordId ? { ...r, status: 'rejected', rejectReason: reason } : r));
    setTasks(prev => prev.map(t => t.relatedId === recordId && t.type === 'loss' ? { ...t, status: 'rejected' } : t));
  }, []);

  const addComplaintRecord = useCallback((record) => {
    const newRecord = {
      ...record,
      id: `CP${Date.now()}`,
      createDate: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    setComplaintRecords(prev => [newRecord, ...prev]);
    addTask({
      title: `投诉 ${newRecord.id} 待处理`,
      type: 'complaint',
      priority: 'high',
      status: 'pending',
      assignedTo: currentUser.name,
      relatedId: newRecord.id,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  }, [currentUser.name, addTask]);

  const processComplaint = useCallback((recordId, resolution) => {
    setComplaintRecords(prev => prev.map(r => r.id === recordId ? {
      ...r,
      status: 'processing',
      resolution: resolution
    } : r));
  }, []);

  const resolveComplaint = useCallback((recordId, resolution) => {
    setComplaintRecords(prev => prev.map(r => r.id === recordId ? {
      ...r,
      status: 'resolved',
      resolution: resolution
    } : r));
    setTasks(prev => prev.map(t => t.relatedId === recordId && t.type === 'complaint' ? { ...t, status: 'completed' } : t));
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const rejectedTasks = tasks.filter(t => t.status === 'rejected').length;
    const overdueTasks = tasks.filter(t => t.status !== 'completed' && t.dueDate < today).length;
    const overdueCredit = creditOrders.filter(o => o.status === 'overdue' || o.status === 'bad_debt');
    const totalOverdueAmount = overdueCredit.reduce((sum, o) => sum + (o.totalAmount - o.paidAmount), 0);
    const pendingCollection = collectionRecords.filter(r => r.status === 'pending' || r.status === 'in_progress').length;
    const pendingLoss = lossRecords.filter(r => r.status === 'pending').length;
    const pendingComplaints = complaintRecords.filter(r => r.status === 'pending' || r.status === 'processing').length;

    return {
      pendingTasks,
      inProgressTasks,
      rejectedTasks,
      overdueTasks,
      totalOverdueAmount,
      pendingCollection,
      pendingLoss,
      pendingComplaints,
      totalCustomers: customers.length,
      totalCreditAmount: creditOrders.reduce((sum, o) => sum + (o.totalAmount - o.paidAmount), 0)
    };
  }, [tasks, creditOrders, collectionRecords, lossRecords, complaintRecords, customers]);

  const myTasks = useMemo(() => {
    return tasks.filter(t => t.assignedTo === currentUser.name);
  }, [tasks, currentUser]);

  const value = {
    currentUser,
    switchUser,
    customers,
    weighingOrders,
    coldRoomInventory,
    gradingRecords,
    creditOrders,
    collectionRecords,
    lossRecords,
    complaintRecords,
    tasks,
    notifications,
    sidebarOpen,
    setSidebarOpen,
    stats,
    myTasks,
    addTask,
    updateTask,
    addNotification,
    addWeighingOrder,
    confirmWeighingOrder,
    addGradingRecord,
    completeGrading,
    addCreditOrder,
    addCollectionRecord,
    completeCollectionRecord,
    addLossRecord,
    confirmLossRecord,
    rejectLossRecord,
    addComplaintRecord,
    processComplaint,
    resolveComplaint
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
