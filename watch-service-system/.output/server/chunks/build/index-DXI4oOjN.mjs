import { defineComponent, ref, computed, watch, resolveComponent, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import { u as useWorkOrder } from './useWorkOrder-B5AuO062.mjs';
import './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'vue-router';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const {
      workOrders,
      selectedOrder,
      loading,
      error,
      actionError,
      pagination,
      fetchWorkOrders,
      selectOrder,
      setFilter,
      clearFilter
    } = useWorkOrder();
    const statusFilter = ref([]);
    const priorityFilter = ref([]);
    const totalCount = computed(() => pagination.value.total);
    function handleSelectOrder(order) {
      selectOrder(order);
    }
    function handleSearch(query) {
      setFilter({ search: query });
    }
    function handleTabFilter(statuses) {
      setFilter({ status: statuses || [] });
    }
    function clearFilters() {
      statusFilter.value = [];
      priorityFilter.value = [];
      clearFilter();
    }
    watch([statusFilter, priorityFilter], () => {
      setFilter({
        status: statusFilter.value.length > 0 ? statusFilter.value : void 0,
        priority: priorityFilter.value.length > 0 ? priorityFilter.value : void 0
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_Icon = resolveComponent("Icon");
      const _component_WorkOrderFilter = resolveComponent("WorkOrderFilter");
      const _component_WorkOrderList = resolveComponent("WorkOrderList");
      const _component_WorkOrderDetail = resolveComponent("WorkOrderDetail");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "h-[calc(100vh-140px)]" }, _attrs))}><div class="mb-4"><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold text-gray-900">\u5DE5\u5355\u7BA1\u7406</h1><p class="mt-1 text-sm text-gray-500">\u67E5\u770B\u548C\u5904\u7406\u6240\u6709\u552E\u540E\u5DE5\u5355</p></div><div class="flex items-center space-x-3"><button class="btn-secondary btn-sm"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}>`);
      if (unref(loading)) {
        _push(ssrRenderComponent(_component_Icon, {
          icon: "mdi:loading",
          class: "w-4 h-4 mr-2 animate-spin"
        }, null, _parent));
      } else {
        _push(ssrRenderComponent(_component_Icon, {
          icon: "mdi:refresh",
          class: "w-4 h-4 mr-2"
        }, null, _parent));
      }
      _push(` \u5237\u65B0 </button></div></div></div><div class="card h-full overflow-hidden"><div class="grid grid-cols-12 h-full"><div class="col-span-5 border-r border-gray-200 flex flex-col h-full">`);
      _push(ssrRenderComponent(_component_WorkOrderFilter, {
        "selected-statuses": statusFilter.value,
        "onUpdate:selectedStatuses": ($event) => statusFilter.value = $event,
        "selected-priorities": priorityFilter.value,
        "onUpdate:selectedPriorities": ($event) => priorityFilter.value = $event,
        "total-count": totalCount.value,
        onClear: clearFilters
      }, null, _parent));
      _push(ssrRenderComponent(_component_WorkOrderList, {
        orders: unref(workOrders),
        "selected-id": ((_a = unref(selectedOrder)) == null ? void 0 : _a.id) || null,
        loading: unref(loading),
        error: unref(error),
        onSelect: handleSelectOrder,
        onSearch: handleSearch,
        onFilter: handleTabFilter,
        onFetch: unref(fetchWorkOrders),
        class: "flex-1"
      }, null, _parent));
      _push(`</div><div class="col-span-7 h-full">`);
      _push(ssrRenderComponent(_component_WorkOrderDetail, { order: unref(selectedOrder) }, null, _parent));
      _push(`</div></div></div>`);
      if (unref(actionError)) {
        _push(`<div class="fixed bottom-6 right-6 max-w-sm bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50"><div class="flex items-start space-x-3">`);
        _push(ssrRenderComponent(_component_Icon, {
          icon: "mdi:alert-circle",
          class: "w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
        }, null, _parent));
        _push(`<div class="flex-1"><p class="text-sm font-medium text-red-800">\u64CD\u4F5C\u5931\u8D25</p><p class="text-sm text-red-700 mt-0.5">${ssrInterpolate(unref(actionError))}</p></div><button class="text-red-400 hover:text-red-600">`);
        _push(ssrRenderComponent(_component_Icon, {
          icon: "mdi:close",
          class: "w-4 h-4"
        }, null, _parent));
        _push(`</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/workorders/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-DXI4oOjN.mjs.map
