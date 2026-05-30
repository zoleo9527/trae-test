import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Complaint, ComplaintStatus } from '@/types';
import { mockComplaints } from '@/data/mockData';
import dayjs from 'dayjs';

export const useComplaintStore = defineStore('complaint', () => {
  const complaints = ref<Complaint[]>([...mockComplaints]);

  const pendingComplaints = computed(() => complaints.value.filter(c => c.status === 'pending'));
  const investigatingComplaints = computed(() => complaints.value.filter(c => c.status === 'investigating'));

  function getComplaintById(id: string) {
    return complaints.value.find(c => c.id === id);
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
    }
  }

  return {
    complaints,
    pendingComplaints,
    investigatingComplaints,
    getComplaintById,
    updateComplaintStatus
  };
});
