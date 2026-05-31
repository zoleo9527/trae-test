import type { WorkOrder, WorkOrderStatus, FilterOptions, WorkOrderAction, PartInventory } from '~/types/workorder';
import { STATUS_LABELS, STATUS_COLORS } from '~/utils/constants';

export function useWorkOrder() {
  const workOrderStore = useWorkOrderStore();

  const workOrders = computed(() => workOrderStore.workOrders);
  const selectedOrder = computed(() => workOrderStore.selectedOrder);
  const stats = computed(() => workOrderStore.stats);
  const loading = computed(() => workOrderStore.loading);
  const error = computed(() => workOrderStore.error);
  const actionLoading = computed(() => workOrderStore.actionLoading);
  const actionError = computed(() => workOrderStore.actionError);
  const filter = computed(() => workOrderStore.filter);
  const pagination = computed(() => workOrderStore.pagination);
  const partInventory = computed(() => workOrderStore.partInventory);

  const pendingOrders = computed(() => workOrderStore.pendingOrders);
  const rejectedOrders = computed(() => workOrderStore.rejectedOrders);
  const needReviewOrders = computed(() => workOrderStore.needReviewOrders);
  const needFollowUpOrders = computed(() => workOrderStore.needFollowUpOrders);
  const myTasks = computed(() => workOrderStore.myTasks);

  function getStatusLabel(status: WorkOrderStatus): string {
    return STATUS_LABELS[status];
  }

  function getStatusColor(status: WorkOrderStatus): string {
    return STATUS_COLORS[status];
  }

  async function fetchWorkOrders() {
    await workOrderStore.fetchWorkOrders();
  }

  async function fetchStats() {
    await workOrderStore.fetchStats();
  }

  async function fetchPartInventory() {
    await workOrderStore.fetchPartInventory();
  }

  async function fetchWorkOrderDetail(id: string) {
    await workOrderStore.fetchWorkOrderDetail(id);
  }

  async function performAction(id: string, action: WorkOrderAction) {
    return await workOrderStore.performAction(id, action);
  }

  function selectOrder(order: WorkOrder | null) {
    workOrderStore.selectOrder(order);
  }

  function setFilter(newFilter: Partial<FilterOptions>) {
    workOrderStore.setFilter(newFilter);
  }

  function setPage(page: number) {
    workOrderStore.setPage(page);
  }

  function clearFilter() {
    workOrderStore.clearFilter();
  }

  function clearActionError() {
    workOrderStore.clearActionError();
  }

  return {
    workOrders,
    selectedOrder,
    stats,
    loading,
    error,
    actionLoading,
    actionError,
    filter,
    pagination,
    partInventory,
    pendingOrders,
    rejectedOrders,
    needReviewOrders,
    needFollowUpOrders,
    myTasks,
    getStatusLabel,
    getStatusColor,
    fetchWorkOrders,
    fetchStats,
    fetchPartInventory,
    fetchWorkOrderDetail,
    performAction,
    selectOrder,
    setFilter,
    setPage,
    clearFilter,
    clearActionError,
  };
}
