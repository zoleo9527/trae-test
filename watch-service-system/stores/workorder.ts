import { defineStore } from 'pinia';
import type { WorkOrder, DashboardStats, FilterOptions, WorkOrderAction, PartInventory, ActionType } from '~/types/workorder';

export const useWorkOrderStore = defineStore('workorder', {
  state: () => ({
    workOrders: [] as WorkOrder[],
    selectedOrder: null as WorkOrder | null,
    stats: null as DashboardStats | null,
    partInventory: [] as PartInventory[],
    loading: false,
    error: null as string | null,
    actionLoading: false,
    actionError: null as string | null,
    filter: {
      status: [],
      priority: [],
      search: '',
    } as FilterOptions,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
    },
  }),

  getters: {
    pendingOrders: (state) => {
      const pendingStatuses = ['pending_review', 'quoting', 'pending_approval', 'pending_confirm', 'ready_for_repair', 'repairing'];
      return state.workOrders.filter(wo => pendingStatuses.includes(wo.status));
    },

    rejectedOrders: (state) => {
      const rejectedStatuses = ['rejected', 'customer_rejected'];
      return state.workOrders.filter(wo => rejectedStatuses.includes(wo.status));
    },

    needReviewOrders: (state) => {
      return state.workOrders.filter(wo => wo.status === 'pending_approval');
    },

    needFollowUpOrders: (state) => {
      return state.workOrders.filter(wo =>
        wo.status === 'picked_up' && (!wo.receipt?.satisfaction || wo.receipt.satisfaction === 0)
      );
    },

    myTasks: (state) => {
      const userStore = useUserStore();
      const role = userStore.currentRole;

      switch (role) {
        case 'manager':
          return state.workOrders.filter(wo =>
            wo.status === 'pending_approval' ||
            (wo.status === 'picked_up' && (!wo.receipt?.satisfaction || wo.receipt.satisfaction === 0))
          );
        case 'consultant':
          return state.workOrders.filter(wo =>
            wo.status === 'pending_review' ||
            wo.status === 'pending_confirm' ||
            wo.status === 'completed'
          );
        case 'technician':
          return state.workOrders.filter(wo =>
            wo.status === 'quoting' ||
            wo.status === 'ready_for_repair' ||
            wo.status === 'repairing'
          );
        default:
          return state.workOrders;
      }
    },
  },

  actions: {
    async fetchWorkOrders() {
      this.loading = true;
      this.error = null;

      try {
        const queryParams = new URLSearchParams();
        if (this.filter.status?.length) {
          queryParams.set('status', this.filter.status.join(','));
        }
        if (this.filter.priority?.length) {
          queryParams.set('priority', this.filter.priority.join(','));
        }
        if (this.filter.search) {
          queryParams.set('search', this.filter.search);
        }
        queryParams.set('page', String(this.pagination.page));
        queryParams.set('limit', String(this.pagination.limit));

        const response = await $fetch<{
          data: WorkOrder[];
          total: number;
          page: number;
          limit: number;
        }>(`/api/workorders?${queryParams.toString()}`);

        this.workOrders = response.data;
        this.pagination.total = response.total;
      } catch (err) {
        this.error = err instanceof Error ? err.message : '加载失败';
      } finally {
        this.loading = false;
      }
    },

    async fetchStats() {
      try {
        this.stats = await $fetch<DashboardStats>('/api/stats');
      } catch (err) {
        console.error('获取统计数据失败:', err);
      }
    },

    async fetchPartInventory() {
      try {
        this.partInventory = await $fetch<PartInventory[]>('/api/parts');
      } catch (err) {
        console.error('获取配件库存失败:', err);
      }
    },

    async fetchWorkOrderDetail(id: string) {
      this.loading = true;
      this.error = null;

      try {
        this.selectedOrder = await $fetch<WorkOrder>(`/api/workorders/${id}`);
      } catch (err) {
        this.error = err instanceof Error ? err.message : '加载失败';
      } finally {
        this.loading = false;
      }
    },

    async performAction(id: string, action: WorkOrderAction) {
      this.actionLoading = true;
      this.actionError = null;

      try {
        const userStore = useUserStore();
        const updated = await $fetch<WorkOrder>(`/api/workorders/${id}/action`, {
          method: 'POST',
          body: {
            ...action,
            role: userStore.currentRole,
          },
        });

        const index = this.workOrders.findIndex(wo => wo.id === id);
        if (index !== -1) {
          this.workOrders[index] = updated;
        }
        if (this.selectedOrder?.id === id) {
          this.selectedOrder = updated;
        }

        await Promise.all([
          this.fetchStats(),
          this.fetchPartInventory(),
        ]);

        return updated;
      } catch (err) {
        this.actionError = err instanceof Error ? err.message : '操作失败';
        throw err;
      } finally {
        this.actionLoading = false;
      }
    },

    selectOrder(order: WorkOrder | null) {
      this.selectedOrder = order;
    },

    setFilter(filter: Partial<FilterOptions>) {
      this.filter = { ...this.filter, ...filter };
      this.pagination.page = 1;
      this.fetchWorkOrders();
    },

    setPage(page: number) {
      this.pagination.page = page;
      this.fetchWorkOrders();
    },

    clearFilter() {
      this.filter = {
        status: [],
        priority: [],
        search: '',
      };
      this.pagination.page = 1;
      this.fetchWorkOrders();
    },

    clearActionError() {
      this.actionError = null;
    },

    async createWorkOrder(data: {
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      watchBrand: string;
      watchModel: string;
      watchSerial: string;
      problemDesc: string;
      priority: string;
      expectedDate: string;
    }) {
      this.loading = true;
      this.error = null;

      try {
        const userStore = useUserStore();
        const newOrder = await $fetch<WorkOrder>('/api/workorders', {
          method: 'POST',
          body: {
            ...data,
            role: userStore.currentRole,
          },
        });

        this.workOrders.unshift(newOrder);
        this.pagination.total += 1;
        await this.fetchStats();

        return newOrder;
      } catch (err) {
        this.error = err instanceof Error ? err.message : '创建失败';
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
