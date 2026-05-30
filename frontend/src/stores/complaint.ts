import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Complaint, ComplaintStatus } from '@/types';
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
    if (complaint) {
      complaint.status = status;
      complaint.handler = handler;
      if (handlerRemark) {
        complaint.handlerRemark = handlerRemark;
      }
      if (approvedCompensation !== undefined) {
        complaint.approvedCompensation = approvedCompensation;
      }
      if (status === 'resolved' || status === 'approved' || status === 'rejected') {
        complaint.resolvedAt = dayjs().format('YYYY-MM-DD HH:mm');
      }

      if ((status === 'approved' || status === 'resolved') && approvedCompensation && approvedCompensation > 0) {
        const orderStore = useOrderStore();
        const order = orderStore.getOrderById(complaint.orderId);
        if (order && order.status !== 'complaint') {
          orderStore.batchUpdateStatus([order.id], 'complaint', handler, `客诉赔付 ¥${approvedCompensation}`);
        }
      }
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
