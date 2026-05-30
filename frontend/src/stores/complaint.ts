import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Complaint, ComplaintStatus, OrderStatus } from '@/types';
import { mockComplaints } from '@/data/mockData';
import { useOrderStore } from './order';
import dayjs from 'dayjs';

export const useComplaintStore = defineStore('complaint', () => {
  const complaints = ref<Complaint[]>([...mockComplaints]);

  const pendingComplaints = computed(() => complaints.value.filter(c => c.status === 'pending'));
  const investigatingComplaints = computed(() => complaints.value.filter(c => c.status === 'investigating'));

  function getComplaintById(id: string) {
    return complaints.value.find(c => c.id === id);
  }

  function getComplaintsByOrderId(orderId: string) {
    return complaints.value.filter(c => c.orderId === orderId);
  }

  function updateComplaintStatus(id: string, status: ComplaintStatus, handler: string, handlerRemark?: string, approvedCompensation?: number) {
    const complaint = complaints.value.find(c => c.id === id);
    if (!complaint) return;

    const isClosing = status === 'approved' || status === 'rejected' || status === 'resolved';

    complaint.status = status;
    complaint.handler = handler;
    if (handlerRemark) {
      complaint.handlerRemark = handlerRemark;
    }
    if (approvedCompensation !== undefined) {
      complaint.approvedCompensation = approvedCompensation;
    }
    if (isClosing) {
      complaint.resolvedAt = dayjs().format('YYYY-MM-DD HH:mm');
    }

    const orderStore = useOrderStore();
    const order = orderStore.getOrderById(complaint.orderId);
    if (!order) return;

    if (status === 'investigating') {
      if (order.status !== 'complaint') {
        orderStore.batchUpdateStatus([order.id], 'complaint', handler, handlerRemark || '客诉调查中');
      }
      return;
    }

    if (isClosing) {
      const hasCompensation = (status === 'approved' || status === 'resolved') && approvedCompensation && approvedCompensation > 0;
      const targetStatus: OrderStatus = hasCompensation ? 'ready' : 'ready';

      order.items.forEach(item => {
        if (complaint.itemId && item.id !== complaint.itemId) return;
        const oldStatus = item.status;
        item.status = targetStatus;
        orderStore.addStatusHistory(
          order.id,
          item.id,
          oldStatus,
          targetStatus,
          handler,
          `客诉${status === 'approved' ? '赔付结案' : status === 'rejected' ? '拒赔结案' : '结案'}${hasCompensation ? `，赔付 ¥${approvedCompensation}` : ''}${handlerRemark ? `：${handlerRemark}` : ''}`
        );
      });

      order.status = targetStatus;
      order.updatedAt = dayjs().format('YYYY-MM-DD HH:mm');
      order.updatedBy = handler;

      orderStore.addStatusHistory(
        order.id,
        undefined,
        'complaint',
        targetStatus,
        handler,
        `客诉${status === 'approved' ? '赔付结案' : status === 'rejected' ? '拒赔结案' : '结案'}${hasCompensation ? `，赔付 ¥${approvedCompensation}` : ''}${handlerRemark ? `：${handlerRemark}` : ''}`
      );
    }
  }

  function createComplaint(data: Omit<Complaint, 'id' | 'status' | 'createdAt'>) {
    const orderStore = useOrderStore();

    const newComplaint: Complaint = {
      ...data,
      id: `complaint-${Date.now()}`,
      status: 'pending',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm')
    };

    complaints.value.push(newComplaint);

    const order = orderStore.getOrderById(data.orderId);
    if (order && order.status !== 'complaint') {
      orderStore.batchUpdateStatus([data.orderId], 'complaint', data.storeName, '客户发起投诉');
    }

    return newComplaint;
  }

  return {
    complaints,
    pendingComplaints,
    investigatingComplaints,
    getComplaintById,
    getComplaintsByOrderId,
    updateComplaintStatus,
    createComplaint
  };
});
