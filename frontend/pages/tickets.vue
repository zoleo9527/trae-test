<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">票务团单管理</h1>
        <p class="text-gray-500">管理票务订单及退改审批</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        + 新增订单
      </button>
    </div>

    <div class="flex space-x-2 mb-6">
      <button
        v-for="s in statusFilters"
        :key="s.value"
        @click="currentFilter = s.value"
        :class="
          currentFilter === s.value
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        "
        class="px-4 py-2 rounded-lg transition-colors text-sm"
      >
        {{ s.label }}
      </button>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              订单号
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              演出
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              客户
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              票数
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              金额
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              状态
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              操作
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="order in filteredOrders"
            :key="order.id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">
                {{ order.order_no }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">
                {{ getPerformanceName(order.performance_id) }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ order.customer_name }}</div>
              <div class="text-xs text-gray-500">
                {{ order.customer_phone }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ order.ticket_count }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              ¥{{ order.total_price.toLocaleString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="getStatusClass(order.status)"
                class="status-badge"
                >{{ getStatusText(order.status) }}</span
              >
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2"
            >
              <button
                v-if="
                  order.status === 'confirmed' ||
                  order.status === 'refund_rejected'
                "
                @click="requestRefund(order)"
                class="text-orange-600 hover:text-orange-900"
              >
                {{
                  order.status === "refund_rejected"
                    ? "重新申请退票"
                    : "申请退票"
                }}
              </button>
              <button
                v-if="order.status === 'refund_pending'"
                @click="approveRefund(order)"
                class="text-green-600 hover:text-green-900"
              >
                通过
              </button>
              <button
                v-if="order.status === 'refund_pending'"
                @click="rejectRefund(order)"
                class="text-red-600 hover:text-red-900"
              >
                驳回
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold text-gray-900">新增票务订单</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >选择演出</label
            >
            <select
              v-model="form.performance_id"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option :value="0">请选择演出</option>
              <option
                v-for="perf in performances"
                :key="perf.id"
                :value="perf.id"
              >
                {{ perf.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >客户姓名</label
            >
            <input
              v-model="form.customer_name"
              type="text"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >联系电话</label
            >
            <input
              v-model="form.customer_phone"
              type="text"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >购票数量</label
            >
            <input
              v-model.number="form.ticket_count"
              type="number"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >总金额</label
            >
            <input
              v-model.number="form.total_price"
              type="number"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div class="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            @click="showCreateModal = false"
            class="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            取消
          </button>
          <button
            @click="createOrder"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showRefundModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ refundAction === "request" ? "申请退票" : "退票审批" }}
          </h3>
        </div>
        <div class="p-6">
          <div class="mb-4 p-3 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600">
              订单号: {{ selectedOrder?.order_no }}
            </p>
            <p class="text-sm text-gray-600">
              客户: {{ selectedOrder?.customer_name }}
            </p>
            <p class="text-sm text-gray-600">
              票数: {{ selectedOrder?.ticket_count }}
            </p>
            <p class="text-sm text-gray-600">
              金额: ¥{{ selectedOrder?.total_price?.toLocaleString() }}
            </p>
          </div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ refundAction === "request" ? "退票原因" : "审批备注" }}
          </label>
          <textarea
            v-model="refundReason"
            rows="3"
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            :placeholder="
              refundAction === 'request'
                ? '请输入退票原因...'
                : '请输入审批备注...'
            "
          ></textarea>
        </div>
        <div class="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            @click="showRefundModal = false"
            class="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            取消
          </button>
          <button
            @click="confirmRefundAction"
            :class="
              refundAction === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            "
            class="px-4 py-2 text-white rounded-lg"
          >
            {{
              refundAction === "request"
                ? "提交申请"
                : refundAction === "approve"
                  ? "通过退票"
                  : "驳回申请"
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Performance {
  id: number;
  name: string;
}

interface TicketOrder {
  id: number;
  performance_id: number;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  ticket_count: number;
  total_price: number;
  status: string;
  refund_reason?: string;
}

const orders = ref<TicketOrder[]>([]);
const performances = ref<Performance[]>([]);
const currentFilter = ref("all");
const showCreateModal = ref(false);
const showRefundModal = ref(false);
const selectedOrder = ref<TicketOrder | null>(null);
const refundAction = ref<"request" | "approve" | "reject">("request");
const refundReason = ref("");

const route = useRoute();

const form = ref({
  performance_id: 0,
  customer_name: "",
  customer_phone: "",
  ticket_count: 1,
  total_price: 0,
});

const statusFilters = [
  { label: "全部", value: "all" },
  { label: "已确认", value: "confirmed" },
  { label: "待退票", value: "refund_pending" },
  { label: "退票驳回", value: "refund_rejected" },
  { label: "已退票", value: "refunded" },
];

const { get, post } = useApi();

const loadData = async () => {
  try {
    const [ordersData, perfData] = await Promise.all([
      get<TicketOrder[]>("/ticket-orders"),
      get<Performance[]>("/performances"),
    ]);
    orders.value = ordersData;
    performances.value = perfData;
  } catch (e) {
    console.error("加载数据失败", e);
  }
};

const filteredOrders = computed(() => {
  if (currentFilter.value === "all") return orders.value;
  return orders.value.filter((o) => o.status === currentFilter.value);
});

const getPerformanceName = (id: number) => {
  const perf = performances.value.find((p) => p.id === id);
  return perf?.name || "未知演出";
};

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    confirmed: "status-approved",
    refund_pending: "status-pending",
    refund_rejected: "status-rejected",
    refunded: "status-completed",
  };
  return map[status] || "status-pending";
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    confirmed: "已确认",
    refund_pending: "待退票",
    refund_rejected: "退票驳回",
    refunded: "已退票",
  };
  return map[status] || status;
};

const createOrder = async () => {
  if (!form.value.performance_id) {
    alert("请选择演出");
    return;
  }
  await post("/ticket-orders", form.value);
  showCreateModal.value = false;
  form.value = {
    performance_id: 0,
    customer_name: "",
    customer_phone: "",
    ticket_count: 1,
    total_price: 0,
  };
  loadData();
};

const requestRefund = (order: TicketOrder) => {
  selectedOrder.value = order;
  refundAction.value = "request";
  refundReason.value = "";
  showRefundModal.value = true;
};

const approveRefund = (order: TicketOrder) => {
  selectedOrder.value = order;
  refundAction.value = "approve";
  refundReason.value = "";
  showRefundModal.value = true;
};

const rejectRefund = (order: TicketOrder) => {
  selectedOrder.value = order;
  refundAction.value = "reject";
  refundReason.value = "";
  showRefundModal.value = true;
};

const confirmRefundAction = async () => {
  if (!selectedOrder.value) return;

  try {
    if (refundAction.value === "request") {
      await post(
        `/ticket-orders/${selectedOrder.value.id}/refund-request?refund_reason=${encodeURIComponent(refundReason.value)}`,
        {},
      );
    } else if (refundAction.value === "approve") {
      await post(
        `/ticket-orders/${selectedOrder.value.id}/refund-approve?approval_notes=${encodeURIComponent(refundReason.value)}`,
        {},
      );
    } else if (refundAction.value === "reject") {
      await post(
        `/ticket-orders/${selectedOrder.value.id}/refund-reject?approval_notes=${encodeURIComponent(refundReason.value)}`,
        {},
      );
    }
    showRefundModal.value = false;
    loadData();
  } catch (e) {
    console.error("操作失败", e);
  }
};

onMounted(() => {
  const statusParam = route.query.status as string;
  if (statusParam && statusFilters.some((s) => s.value === statusParam)) {
    currentFilter.value = statusParam;
  }
  loadData();
});
</script>
