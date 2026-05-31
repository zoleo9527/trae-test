import { d as defineStore, b as useUserStore, S as STATUS_COLORS, a as STATUS_LABELS } from './server.mjs';
import { computed } from 'vue';

const useWorkOrderStore = defineStore("workorder", {
  state: () => ({
    workOrders: [],
    selectedOrder: null,
    stats: null,
    partInventory: [],
    loading: false,
    error: null,
    actionLoading: false,
    actionError: null,
    filter: {
      status: [],
      priority: [],
      search: ""
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    }
  }),
  getters: {
    pendingOrders: (state) => {
      const pendingStatuses = ["pending_review", "quoting", "pending_approval", "pending_confirm", "repairing"];
      return state.workOrders.filter((wo) => pendingStatuses.includes(wo.status));
    },
    rejectedOrders: (state) => {
      const rejectedStatuses = ["rejected", "customer_rejected"];
      return state.workOrders.filter((wo) => rejectedStatuses.includes(wo.status));
    },
    needReviewOrders: (state) => {
      return state.workOrders.filter((wo) => wo.status === "pending_approval");
    },
    needFollowUpOrders: (state) => {
      return state.workOrders.filter(
        (wo) => {
          var _a;
          return wo.status === "picked_up" && (!((_a = wo.receipt) == null ? void 0 : _a.satisfaction) || wo.receipt.satisfaction === 0);
        }
      );
    },
    myTasks: (state) => {
      const userStore = useUserStore();
      const role = userStore.currentRole;
      switch (role) {
        case "manager":
          return state.workOrders.filter(
            (wo) => {
              var _a;
              return wo.status === "pending_approval" || wo.status === "picked_up" && (!((_a = wo.receipt) == null ? void 0 : _a.satisfaction) || wo.receipt.satisfaction === 0);
            }
          );
        case "consultant":
          return state.workOrders.filter(
            (wo) => wo.status === "pending_review" || wo.status === "pending_confirm" || wo.status === "completed"
          );
        case "technician":
          return state.workOrders.filter(
            (wo) => wo.status === "quoting" || wo.status === "repairing"
          );
        default:
          return state.workOrders;
      }
    }
  },
  actions: {
    async fetchWorkOrders() {
      var _a, _b;
      this.loading = true;
      this.error = null;
      try {
        const queryParams = new URLSearchParams();
        if ((_a = this.filter.status) == null ? void 0 : _a.length) {
          queryParams.set("status", this.filter.status.join(","));
        }
        if ((_b = this.filter.priority) == null ? void 0 : _b.length) {
          queryParams.set("priority", this.filter.priority.join(","));
        }
        if (this.filter.search) {
          queryParams.set("search", this.filter.search);
        }
        queryParams.set("page", String(this.pagination.page));
        queryParams.set("limit", String(this.pagination.limit));
        const response = await $fetch(`/api/workorders?${queryParams.toString()}`);
        this.workOrders = response.data;
        this.pagination.total = response.total;
      } catch (err) {
        this.error = err instanceof Error ? err.message : "\u52A0\u8F7D\u5931\u8D25";
      } finally {
        this.loading = false;
      }
    },
    async fetchStats() {
      try {
        this.stats = await $fetch("/api/stats");
      } catch (err) {
        console.error("\u83B7\u53D6\u7EDF\u8BA1\u6570\u636E\u5931\u8D25:", err);
      }
    },
    async fetchPartInventory() {
      try {
        this.partInventory = await $fetch("/api/parts");
      } catch (err) {
        console.error("\u83B7\u53D6\u914D\u4EF6\u5E93\u5B58\u5931\u8D25:", err);
      }
    },
    async fetchWorkOrderDetail(id) {
      this.loading = true;
      this.error = null;
      try {
        this.selectedOrder = await $fetch(`/api/workorders/${id}`);
      } catch (err) {
        this.error = err instanceof Error ? err.message : "\u52A0\u8F7D\u5931\u8D25";
      } finally {
        this.loading = false;
      }
    },
    async performAction(id, action) {
      var _a;
      this.actionLoading = true;
      this.actionError = null;
      try {
        const userStore = useUserStore();
        const updated = await $fetch(`/api/workorders/${id}/action`, {
          method: "POST",
          body: {
            ...action,
            role: userStore.currentRole
          }
        });
        const index = this.workOrders.findIndex((wo) => wo.id === id);
        if (index !== -1) {
          this.workOrders[index] = updated;
        }
        if (((_a = this.selectedOrder) == null ? void 0 : _a.id) === id) {
          this.selectedOrder = updated;
        }
        await Promise.all([
          this.fetchStats(),
          this.fetchPartInventory()
        ]);
        return updated;
      } catch (err) {
        this.actionError = err instanceof Error ? err.message : "\u64CD\u4F5C\u5931\u8D25";
        throw err;
      } finally {
        this.actionLoading = false;
      }
    },
    selectOrder(order) {
      this.selectedOrder = order;
    },
    setFilter(filter) {
      this.filter = { ...this.filter, ...filter };
      this.pagination.page = 1;
      this.fetchWorkOrders();
    },
    setPage(page) {
      this.pagination.page = page;
      this.fetchWorkOrders();
    },
    clearFilter() {
      this.filter = {
        status: [],
        priority: [],
        search: ""
      };
      this.pagination.page = 1;
      this.fetchWorkOrders();
    },
    clearActionError() {
      this.actionError = null;
    }
  }
});
function useWorkOrder() {
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
  function getStatusLabel(status) {
    return STATUS_LABELS[status];
  }
  function getStatusColor(status) {
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
  async function fetchWorkOrderDetail(id) {
    await workOrderStore.fetchWorkOrderDetail(id);
  }
  async function performAction(id, action) {
    return await workOrderStore.performAction(id, action);
  }
  function selectOrder(order) {
    workOrderStore.selectOrder(order);
  }
  function setFilter(newFilter) {
    workOrderStore.setFilter(newFilter);
  }
  function setPage(page) {
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
    clearActionError
  };
}

export { useWorkOrder as u };
//# sourceMappingURL=useWorkOrder-B5AuO062.mjs.map
