import { useApp } from '@/store/AppContext';
import {
  updateShippingOrder,
  updateReceipt,
  updateReworkOrder,
  updateDispute,
  addActionLog,
  markAlertHandled,
} from '@/store/actions';
import type {
  ShippingStatus,
  ReworkStatus,
  ReceiptStatus,
  ShippingOrder,
  ReworkOrder,
  Receipt,
  SettlementDispute,
  DifferenceRecord,
  ReworkStep,
} from '@/types';

export function useWorkflow() {
  const { state, dispatch } = useApp();
  const currentUser = state.currentUser;

  const canTransitionShipping = (
    order: ShippingOrder,
    newStatus: ShippingStatus
  ): boolean => {
    const validTransitions: Record<ShippingStatus, ShippingStatus[]> = {
      draft: ['pending_approval'],
      pending_approval: ['approved', 'rejected'],
      approved: ['shipped'],
      shipped: ['received'],
      received: ['completed'],
      completed: [],
      rejected: ['draft'],
    };
    return validTransitions[order.status].includes(newStatus);
  };

  const canTransitionRework = (
    order: ReworkOrder,
    newStatus: ReworkStatus
  ): boolean => {
    const validTransitions: Record<ReworkStatus, ReworkStatus[]> = {
      created: ['in_progress'],
      in_progress: ['submitted'],
      submitted: ['passed', 'failed'],
      passed: ['closed'],
      failed: ['in_progress'],
      closed: [],
    };
    return validTransitions[order.status].includes(newStatus);
  };

  const canTransitionReceipt = (
    receipt: Receipt,
    newStatus: ReceiptStatus
  ): boolean => {
    const validTransitions: Record<ReceiptStatus, ReceiptStatus[]> = {
      pending: ['signed'],
      signed: ['verified', 'has_difference', 'disputed'],
      has_difference: ['verified', 'disputed'],
      verified: [],
      disputed: [],
    };
    return validTransitions[receipt.status].includes(newStatus);
  };

  const createActionLog = (
    action: string,
    targetType: string,
    targetId: string,
    targetName: string,
    detail: string
  ) => {
    if (!currentUser) return;
    dispatch(
      addActionLog({
        id: `log-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action,
        targetType,
        targetId,
        targetName,
        timestamp: new Date().toISOString(),
        detail,
      })
    );
  };

  const submitShippingForApproval = (order: ShippingOrder) => {
    if (!canTransitionShipping(order, 'pending_approval') || !currentUser) return;
    const updated: ShippingOrder = {
      ...order,
      status: 'pending_approval',
      submittedAt: new Date().toISOString(),
    };
    dispatch(updateShippingOrder(updated));
    createActionLog(
      '提交审核',
      'shipping',
      order.id,
      order.code,
      `发货单 ${order.code} 提交审核，金额 ${order.totalAmount.toLocaleString()} 元`
    );
  };

  const approveShipping = (order: ShippingOrder) => {
    if (!canTransitionShipping(order, 'approved') || !currentUser) return;
    const updated: ShippingOrder = {
      ...order,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser.id,
    };
    dispatch(updateShippingOrder(updated));
    createActionLog(
      '审核通过',
      'shipping',
      order.id,
      order.code,
      `发货单 ${order.code} 审核通过`
    );
  };

  const rejectShipping = (order: ShippingOrder, reason: string) => {
    if (!canTransitionShipping(order, 'rejected') || !currentUser) return;
    const updated: ShippingOrder = {
      ...order,
      status: 'rejected',
      rejectReason: reason,
    };
    dispatch(updateShippingOrder(updated));
    createActionLog(
      '审核驳回',
      'shipping',
      order.id,
      order.code,
      `发货单 ${order.code} 被驳回：${reason}`
    );
  };

  const markAsShipped = (
    order: ShippingOrder,
    carrier: string,
    trackingNo: string
  ) => {
    if (!canTransitionShipping(order, 'shipped') || !currentUser) return;
    const updated: ShippingOrder = {
      ...order,
      status: 'shipped',
      shippedAt: new Date().toISOString(),
      carrier,
      trackingNo,
    };
    dispatch(updateShippingOrder(updated));
    createActionLog(
      '标记发货',
      'shipping',
      order.id,
      order.code,
      `发货单 ${order.code} 已发货，承运商：${carrier}，运单号：${trackingNo}`
    );
  };

  const signReceipt = (
    receipt: Receipt,
    location: string,
    receivedQuantities: Record<string, number>
  ) => {
    if (!canTransitionReceipt(receipt, 'signed') || !currentUser) return;
    const shipping = state.shippingOrders.find((s) => s.id === receipt.shippingId);
    if (!shipping) return;

    const updatedItems = shipping.materialItems.map((item) => ({
      ...item,
      receivedQuantity: receivedQuantities[item.id] ?? item.quantity,
    }));
    const updatedShipping: ShippingOrder = {
      ...shipping,
      materialItems: updatedItems,
      status: 'received',
    };
    dispatch(updateShippingOrder(updatedShipping));

    const hasDifferences = updatedItems.some(
      (item) => item.receivedQuantity !== item.quantity
    );
    const updated: Receipt = {
      ...receipt,
      status: hasDifferences ? 'has_difference' : 'signed',
      signedAt: new Date().toISOString(),
      signedBy: currentUser.id,
      signedLocation: location,
    };
    dispatch(updateReceipt(updated));
    createActionLog(
      '签收回单',
      'receipt',
      receipt.id,
      shipping.code,
      `回单 ${shipping.code} 已签收${hasDifferences ? '，存在数量差异' : ''}`
    );
  };

  const recordDifference = (
    receipt: Receipt,
    difference: Omit<DifferenceRecord, 'id' | 'receiptId' | 'reportedBy' | 'reportedAt' | 'resolved'>
  ) => {
    if (!currentUser) return;
    const newDiff: DifferenceRecord = {
      ...difference,
      id: `diff-${Date.now()}`,
      receiptId: receipt.id,
      reportedBy: currentUser.id,
      reportedAt: new Date().toISOString(),
      resolved: false,
    };
    const updated: Receipt = {
      ...receipt,
      status: 'has_difference',
      differences: [...receipt.differences, newDiff],
    };
    dispatch(updateReceipt(updated));
    createActionLog(
      '记录差异',
      'receipt',
      receipt.id,
      receipt.id,
      `记录材料差异：${difference.materialName} - ${difference.description}`
    );
  };

  const verifyReceipt = (receipt: Receipt) => {
    if (!canTransitionReceipt(receipt, 'verified') || !currentUser) return;
    const shipping = state.shippingOrders.find((s) => s.id === receipt.shippingId);
    const updated: Receipt = {
      ...receipt,
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      verifiedBy: currentUser.id,
    };
    dispatch(updateReceipt(updated));

    if (shipping) {
      const updatedShipping: ShippingOrder = {
        ...shipping,
        status: 'completed',
      };
      dispatch(updateShippingOrder(updatedShipping));
    }

    const relatedAlert = state.alerts.find(
      (a) => a.targetType === 'receipt' && a.targetId === receipt.id
    );
    if (relatedAlert) {
      dispatch(markAlertHandled(relatedAlert.id));
    }

    createActionLog(
      '核验通过',
      'receipt',
      receipt.id,
      shipping?.code || receipt.id,
      `回单核验通过，流程完成`
    );
  };

  const judgeResponsibility = (
    receipt: Receipt,
    differenceId: string,
    responsibility: string,
    resolution: string
  ) => {
    if (!currentUser) return;
    const updatedDifferences = receipt.differences.map((d) =>
      d.id === differenceId
        ? { ...d, responsibility, resolved: true, resolvedAt: new Date().toISOString(), resolution }
        : d
    );
    const allResolved = updatedDifferences.every((d) => d.resolved);
    const updated: Receipt = {
      ...receipt,
      status: allResolved ? 'verified' : 'has_difference',
      differences: updatedDifferences,
      verifiedAt: allResolved ? new Date().toISOString() : receipt.verifiedAt,
      verifiedBy: allResolved ? currentUser.id : receipt.verifiedBy,
    };
    dispatch(updateReceipt(updated));

    const shipping = state.shippingOrders.find((s) => s.id === receipt.shippingId);
    if (allResolved && shipping) {
      const updatedShipping: ShippingOrder = {
        ...shipping,
        status: 'completed',
      };
      dispatch(updateShippingOrder(updatedShipping));
    }

    createActionLog(
      '判定责任',
      'receipt',
      receipt.id,
      receipt.id,
      `差异责任判定：${responsibility}，处理方案：${resolution}`
    );
  };

  const startRework = (order: ReworkOrder, remark?: string) => {
    if (!canTransitionRework(order, 'in_progress') || !currentUser) return;
    const step: ReworkStep = {
      id: `step-${Date.now()}`,
      reworkId: order.id,
      action: '开始整改',
      operator: currentUser.id,
      operatorName: currentUser.name,
      timestamp: new Date().toISOString(),
      remark,
    };
    const updated: ReworkOrder = {
      ...order,
      status: 'in_progress',
      steps: [...order.steps, step],
    };
    dispatch(updateReworkOrder(updated));
    createActionLog(
      '开始整改',
      'rework',
      order.id,
      order.code,
      `返工单 ${order.code} 开始整改`
    );
  };

  const submitReworkForReview = (
    order: ReworkOrder,
    remark?: string,
    evidenceUrls?: string[]
  ) => {
    if (!canTransitionRework(order, 'submitted') || !currentUser) return;
    const step: ReworkStep = {
      id: `step-${Date.now()}`,
      reworkId: order.id,
      action: '提交复查',
      operator: currentUser.id,
      operatorName: currentUser.name,
      timestamp: new Date().toISOString(),
      remark,
      evidenceUrls,
    };
    const updated: ReworkOrder = {
      ...order,
      status: 'submitted',
      steps: [...order.steps, step],
    };
    dispatch(updateReworkOrder(updated));
    createActionLog(
      '提交复查',
      'rework',
      order.id,
      order.code,
      `返工单 ${order.code} 整改完成，提交复查`
    );
  };

  const reviewRework = (
    order: ReworkOrder,
    passed: boolean,
    remark?: string,
    actualCost?: number
  ) => {
    const newStatus = passed ? 'passed' : 'failed';
    if (!canTransitionRework(order, newStatus) || !currentUser) return;
    const step: ReworkStep = {
      id: `step-${Date.now()}`,
      reworkId: order.id,
      action: passed ? '复查通过' : '复查不通过',
      operator: currentUser.id,
      operatorName: currentUser.name,
      timestamp: new Date().toISOString(),
      remark,
    };
    const updated: ReworkOrder = {
      ...order,
      status: newStatus,
      steps: [...order.steps, step],
      actualCost: actualCost ?? order.actualCost,
    };
    dispatch(updateReworkOrder(updated));
    createActionLog(
      passed ? '复查通过' : '复查不通过',
      'rework',
      order.id,
      order.code,
      `返工单 ${order.code} ${passed ? '复查通过' : '复查不通过，需重新整改'}`
    );
  };

  const closeRework = (order: ReworkOrder, remark?: string) => {
    if (!canTransitionRework(order, 'closed') || !currentUser) return;
    const step: ReworkStep = {
      id: `step-${Date.now()}`,
      reworkId: order.id,
      action: '返工闭环',
      operator: currentUser.id,
      operatorName: currentUser.name,
      timestamp: new Date().toISOString(),
      remark,
    };
    const updated: ReworkOrder = {
      ...order,
      status: 'closed',
      steps: [...order.steps, step],
    };
    dispatch(updateReworkOrder(updated));
    createActionLog(
      '返工闭环',
      'rework',
      order.id,
      order.code,
      `返工单 ${order.code} 已闭环`
    );
  };

  const ruleDispute = (
    dispute: SettlementDispute,
    ruling: string,
    resolution: string
  ) => {
    if (!currentUser) return;
    const updated: SettlementDispute = {
      ...dispute,
      status: 'ruled',
      ruling,
      ruledBy: currentUser.id,
      ruledAt: new Date().toISOString(),
      resolution,
      resolvedAt: new Date().toISOString(),
    };
    dispatch(updateDispute(updated));
    createActionLog(
      '裁定争议',
      'dispute',
      dispute.id,
      dispute.code,
      `争议 ${dispute.code} 已裁定：${ruling}`
    );
  };

  return {
    canTransitionShipping,
    canTransitionRework,
    canTransitionReceipt,
    submitShippingForApproval,
    approveShipping,
    rejectShipping,
    markAsShipped,
    signReceipt,
    recordDifference,
    verifyReceipt,
    judgeResponsibility,
    startRework,
    submitReworkForReview,
    reviewRework,
    closeRework,
    ruleDispute,
  };
}
