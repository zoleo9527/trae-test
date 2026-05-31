import { defineComponent, computed, resolveComponent, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderStyle, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
import { useRouter } from 'vue-router';
import { u as useRole } from './server.mjs';
import { u as useWorkOrder } from './useWorkOrder-B5AuO062.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const router = useRouter();
    const { userName, currentRole, currentRoleLabel } = useRole();
    const {
      stats,
      loading,
      rejectedOrders,
      needReviewOrders,
      myTasks,
      workOrders,
      selectOrder,
      setFilter
    } = useWorkOrder();
    const loadingStats = computed(() => loading.value && !stats.value);
    const statusDistribution = computed(() => {
      const total = workOrders.value.length || 1;
      const statusMap = [
        { status: "pending_review", label: "\u5F85\u68C0\u6D4B", colorClass: "bg-amber-500" },
        { status: "quoting", label: "\u62A5\u4EF7\u4E2D", colorClass: "bg-blue-500" },
        { status: "pending_approval", label: "\u5F85\u5BA1\u6279", colorClass: "bg-orange-500" },
        { status: "rejected", label: "\u5DF2\u9A73\u56DE", colorClass: "bg-red-500" },
        { status: "pending_confirm", label: "\u5F85\u5BA2\u6237\u786E\u8BA4", colorClass: "bg-purple-500" },
        { status: "repairing", label: "\u7EF4\u4FEE\u4E2D", colorClass: "bg-cyan-500" },
        { status: "completed", label: "\u5DF2\u5B8C\u6210", colorClass: "bg-green-500" },
        { status: "picked_up", label: "\u5DF2\u53D6\u4EF6", colorClass: "bg-gray-500" }
      ];
      return statusMap.map((item) => ({
        ...item,
        count: workOrders.value.filter((wo) => wo.status === item.status).length,
        percentage: Math.round(workOrders.value.filter((wo) => wo.status === item.status).length / total * 100)
      })).filter((item) => item.count > 0);
    });
    function navigateToWorkOrders(tab) {
      if (tab) {
        let statusFilter;
        switch (tab) {
          case "pending":
            statusFilter = ["pending_review", "quoting", "pending_confirm", "repairing"];
            break;
          case "approval":
            statusFilter = ["pending_approval"];
            break;
          case "rejected":
            statusFilter = ["rejected", "customer_rejected"];
            break;
          case "completed":
            statusFilter = ["completed"];
            break;
          case "followup":
            statusFilter = ["picked_up"];
            break;
          case "pending_confirm":
            statusFilter = ["pending_confirm"];
            break;
        }
        if (statusFilter) {
          setFilter({ status: statusFilter });
        }
      }
      router.push("/workorders");
    }
    function handleSelectOrder(order) {
      selectOrder(order);
      router.push("/workorders");
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i;
      const _component_LoadingState = resolveComponent("LoadingState");
      const _component_StatCard = resolveComponent("StatCard");
      const _component_Icon = resolveComponent("Icon");
      const _component_TaskList = resolveComponent("TaskList");
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-6"><h1 class="text-2xl font-bold text-gray-900">\u4EEA\u8868\u76D8</h1><p class="mt-1 text-sm text-gray-500"> \u6B22\u8FCE\u56DE\u6765\uFF0C${ssrInterpolate(unref(userName))}\uFF08${ssrInterpolate(unref(currentRoleLabel))}\uFF09\uFF01\u8FD9\u662F\u4ECA\u65E5\u7684\u552E\u540E\u6982\u89C8 </p></div>`);
      if (loadingStats.value) {
        _push(ssrRenderComponent(_component_LoadingState, { text: "\u52A0\u8F7D\u7EDF\u8BA1\u6570\u636E..." }, null, _parent));
      } else {
        _push(`<!--[--><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">`);
        _push(ssrRenderComponent(_component_StatCard, {
          title: "\u5F85\u5904\u7406\u5DE5\u5355",
          value: ((_a = unref(stats)) == null ? void 0 : _a.pending) || 0,
          icon: "mdi:clipboard-clock",
          variant: "warning",
          "sub-text": "\u9700\u8981\u60A8\u5173\u6CE8\u7684\u5DE5\u5355",
          "sub-icon": "mdi:alert-circle",
          onClick: ($event) => navigateToWorkOrders("pending")
        }, null, _parent));
        _push(ssrRenderComponent(_component_StatCard, {
          title: "\u5F85\u5BA1\u6279\u62A5\u4EF7",
          value: ((_b = unref(stats)) == null ? void 0 : _b.needReview) || 0,
          icon: "mdi:file-document-edit",
          variant: "info",
          "sub-text": "\u7B49\u5F85\u7ECF\u7406\u5BA1\u6279",
          "sub-icon": "mdi:clock-outline",
          onClick: ($event) => navigateToWorkOrders("approval")
        }, null, _parent));
        _push(ssrRenderComponent(_component_StatCard, {
          title: "\u5DF2\u9A73\u56DE\u5DE5\u5355",
          value: ((_c = unref(stats)) == null ? void 0 : _c.rejected) || 0,
          icon: "mdi:close-circle",
          variant: "danger",
          "sub-text": "\u9700\u8981\u91CD\u65B0\u5904\u7406",
          "sub-icon": "mdi:refresh",
          onClick: ($event) => navigateToWorkOrders("rejected")
        }, null, _parent));
        _push(ssrRenderComponent(_component_StatCard, {
          title: "\u4ECA\u65E5\u65B0\u589E",
          value: ((_d = unref(stats)) == null ? void 0 : _d.todayNew) || 0,
          icon: "mdi:plus-circle",
          variant: "success",
          "sub-text": `\u672C\u5468\u5B8C\u6210: ${((_e = unref(stats)) == null ? void 0 : _e.completedThisWeek) || 0}`,
          "sub-icon": "mdi:check",
          onClick: navigateToWorkOrders
        }, null, _parent));
        _push(`</div>`);
        if (((_f = unref(stats)) == null ? void 0 : _f.needFollowUp) && unref(stats).needFollowUp > 0) {
          _push(`<div class="mb-8"><div class="card p-4 bg-amber-50 border-amber-200"><div class="flex items-center justify-between"><div class="flex items-center space-x-3"><div class="w-10 h-10 flex items-center justify-center rounded-full bg-amber-500">`);
          _push(ssrRenderComponent(_component_Icon, {
            icon: "mdi:bell-ring",
            class: "w-5 h-5 text-white"
          }, null, _parent));
          _push(`</div><div><p class="font-medium text-amber-900">\u5F85\u56DE\u8BBF\u63D0\u9192</p><p class="text-sm text-amber-700"> \u6709 ${ssrInterpolate(unref(stats).needFollowUp)} \u4E2A\u5DF2\u53D6\u4EF6\u5DE5\u5355\u9700\u8981\u8FDB\u884C\u6EE1\u610F\u5EA6\u56DE\u8BBF </p></div></div><button class="btn-primary btn-sm"> \u7ACB\u5373\u5904\u7406 </button></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"><div class="lg:col-span-2">`);
        _push(ssrRenderComponent(_component_TaskList, {
          title: "\u6211\u7684\u5F85\u529E\u4EFB\u52A1",
          orders: unref(myTasks),
          "show-role-badge": true,
          "empty-title": "\u6682\u65E0\u5F85\u529E\u4EFB\u52A1",
          "empty-desc": "\u60A8\u5F53\u524D\u6CA1\u6709\u9700\u8981\u5904\u7406\u7684\u4EFB\u52A1",
          onSelect: handleSelectOrder
        }, null, _parent));
        _push(`</div><div class="space-y-6"><div class="card p-6"><h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">\u5FEB\u6377\u64CD\u4F5C</h3><div class="grid grid-cols-2 gap-3">`);
        if (unref(currentRole) === "consultant") {
          _push(`<button class="flex flex-col items-center p-4 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"><div class="w-10 h-10 flex items-center justify-center rounded-full bg-primary-500 mb-2">`);
          _push(ssrRenderComponent(_component_Icon, {
            icon: "mdi:plus",
            class: "w-5 h-5 text-white"
          }, null, _parent));
          _push(`</div><span class="text-sm font-medium text-primary-700">\u65B0\u5EFA\u5DE5\u5355</span></button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(currentRole) === "manager") {
          _push(`<button class="flex flex-col items-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"><div class="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 mb-2">`);
          _push(ssrRenderComponent(_component_Icon, {
            icon: "mdi:check-decagram",
            class: "w-5 h-5 text-white"
          }, null, _parent));
          _push(`</div><span class="text-sm font-medium text-blue-700">\u5BA1\u6279\u62A5\u4EF7</span></button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(currentRole) === "technician") {
          _push(`<button class="flex flex-col items-center p-4 rounded-lg bg-cyan-50 hover:bg-cyan-100 transition-colors"><div class="w-10 h-10 flex items-center justify-center rounded-full bg-cyan-500 mb-2">`);
          _push(ssrRenderComponent(_component_Icon, {
            icon: "mdi:hammer-wrench",
            class: "w-5 h-5 text-white"
          }, null, _parent));
          _push(`</div><span class="text-sm font-medium text-cyan-700">\u5F85\u7EF4\u4FEE</span></button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(currentRole) === "consultant") {
          _push(`<button class="flex flex-col items-center p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"><div class="w-10 h-10 flex items-center justify-center rounded-full bg-purple-500 mb-2">`);
          _push(ssrRenderComponent(_component_Icon, {
            icon: "mdi:message-text",
            class: "w-5 h-5 text-white"
          }, null, _parent));
          _push(`</div><span class="text-sm font-medium text-purple-700">\u5F85\u786E\u8BA4</span></button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(currentRole) === "manager") {
          _push(`<button class="flex flex-col items-center p-4 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors"><div class="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-500 mb-2">`);
          _push(ssrRenderComponent(_component_Icon, {
            icon: "mdi:star",
            class: "w-5 h-5 text-white"
          }, null, _parent));
          _push(`</div><span class="text-sm font-medium text-yellow-700">\u6EE1\u610F\u5EA6\u56DE\u8BBF</span></button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(currentRole) === "consultant") {
          _push(`<button class="flex flex-col items-center p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"><div class="w-10 h-10 flex items-center justify-center rounded-full bg-green-500 mb-2">`);
          _push(ssrRenderComponent(_component_Icon, {
            icon: "mdi:package-variant-closed",
            class: "w-5 h-5 text-white"
          }, null, _parent));
          _push(`</div><span class="text-sm font-medium text-green-700">\u5F85\u53D6\u4EF6</span></button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
        _push(ssrRenderComponent(_component_TaskList, {
          title: "\u5F85\u5BA1\u6279\u5DE5\u5355",
          orders: unref(needReviewOrders),
          "empty-title": "\u6682\u65E0\u5F85\u5BA1\u6279",
          "empty-desc": "\u6240\u6709\u62A5\u4EF7\u90FD\u5DF2\u5904\u7406\u5B8C\u6BD5",
          onSelect: handleSelectOrder
        }, null, _parent));
        _push(ssrRenderComponent(_component_TaskList, {
          title: "\u5DF2\u9A73\u56DE\u9700\u56DE\u67E5",
          orders: unref(rejectedOrders),
          "empty-title": "\u6682\u65E0\u9A73\u56DE\u5DE5\u5355",
          "empty-desc": "\u6CA1\u6709\u9700\u8981\u91CD\u65B0\u5904\u7406\u7684\u5DE5\u5355",
          onSelect: handleSelectOrder
        }, null, _parent));
        _push(`</div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="card p-6"><h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">\u672C\u5468\u6548\u7387</h3><div class="space-y-4"><div class="flex items-center justify-between"><span class="text-gray-600">\u672C\u5468\u5B8C\u6210\u5DE5\u5355</span><span class="text-2xl font-bold text-gray-900">${ssrInterpolate(((_g = unref(stats)) == null ? void 0 : _g.completedThisWeek) || 0)}</span></div><div class="flex items-center justify-between"><span class="text-gray-600">\u5E73\u5747\u5904\u7406\u5468\u671F</span><span class="text-2xl font-bold text-gray-900">${ssrInterpolate(((_h = unref(stats)) == null ? void 0 : _h.avgProcessTime) || 0)} <span class="text-sm font-normal text-gray-500">\u5929</span></span></div><div class="h-2 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all" style="${ssrRenderStyle({ width: `${Math.min(100, (((_i = unref(stats)) == null ? void 0 : _i.completedThisWeek) || 0) / 20 * 100)}%` })}"></div></div><p class="text-xs text-gray-500">\u76EE\u6807: \u6BCF\u5468\u5B8C\u6210 20 \u5355</p></div></div><div class="card p-6"><h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">\u72B6\u6001\u5206\u5E03</h3><div class="space-y-3"><!--[-->`);
        ssrRenderList(statusDistribution.value, (item) => {
          _push(`<div class="flex items-center space-x-3"><div class="${ssrRenderClass([item.colorClass, "w-3 h-3 rounded-full"])}"></div><span class="flex-1 text-sm text-gray-600">${ssrInterpolate(item.label)}</span><span class="text-sm font-medium text-gray-900">${ssrInterpolate(item.count)}</span><div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden"><div class="${ssrRenderClass([item.colorClass, "h-full rounded-full transition-all"])}" style="${ssrRenderStyle({ width: `${item.percentage}%` })}"></div></div></div>`);
        });
        _push(`<!--]--></div></div></div><!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-Cp6pgomb.mjs.map
