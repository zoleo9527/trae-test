import { _ as __nuxt_component_0 } from './nuxt-link-BqY1MNSU.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, openBlock, createBlock, createVNode, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrRenderClass, ssrRenderTeleport } from 'vue/server-renderer';
import { u as useDataStore, f as formatDate } from './data-CvF3Pjf4.mjs';
import { u as useAuthStore } from './auth-BO_zE_6L.mjs';
import { f as formatCurrency, i as getStatusText } from './formatters-B147ECSY.mjs';
import { a as _export_sfc } from './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'dayjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'vue-router';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "RequisitionDetailModal",
  __ssrInlineRender: true,
  props: {
    visible: { type: Boolean },
    requisition: {}
  },
  emits: ["close", "update"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const dataStore = useDataStore();
    const authStore = useAuthStore();
    const showRejectDialog = ref(false);
    const rejectReason = ref("");
    const project = computed(() => {
      return dataStore.getProjectById(props.requisition.projectId);
    });
    const applicant = computed(() => {
      return dataStore.getStaffById(props.requisition.applicantId);
    });
    const approver = computed(() => {
      if (props.requisition.approverId) {
        return dataStore.staff.find((s) => s.id === props.requisition.approverId);
      }
      return null;
    });
    const totalAmount = computed(() => {
      return props.requisition.items.reduce((sum, item) => {
        if (item.unitPrice) {
          return sum + item.quantity * item.unitPrice;
        }
        return sum;
      }, 0);
    });
    const statusBadgeClass = computed(() => {
      const classMap = {
        draft: "bg-gray-100 text-gray-700",
        pending: "bg-yellow-100 text-yellow-700",
        approved: "bg-green-100 text-green-700",
        rejected: "bg-red-100 text-red-700",
        delivered: "bg-blue-100 text-blue-700",
        completed: "bg-green-100 text-green-700"
      };
      return classMap[props.requisition.status] || "bg-gray-100 text-gray-700";
    });
    const canApprove = computed(() => {
      return props.requisition.status === "pending" && authStore.isProjectManager;
    });
    const canDeliver = computed(() => {
      return props.requisition.status === "approved" && authStore.isProjectManager;
    });
    const canComplete = computed(() => {
      return props.requisition.status === "delivered" && authStore.isProjectManager;
    });
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderTeleport(_push, (_push2) => {
        var _a, _b, _c, _d, _e;
        if (__props.visible) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div><div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"><div class="flex items-center justify-between px-6 py-4 border-b border-gray-100"><div><h2 class="text-xl font-bold text-gray-900">\u7533\u9886\u5355\u8BE6\u60C5</h2><p class="text-sm text-gray-500 mt-1"> \u7533\u9886\u5355\u53F7: ${ssrInterpolate(__props.requisition.id)}</p></div><button class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><div class="overflow-y-auto max-h-[calc(90vh-180px)]"><div class="p-6 space-y-6"><div class="flex items-center justify-between"><div class="flex items-center gap-4"><div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center"><span class="text-2xl">\u{1F4DD}</span></div><div><h3 class="font-semibold text-gray-900">${ssrInterpolate((_a = project.value) == null ? void 0 : _a.name)}</h3><p class="text-sm text-gray-500"> \u7533\u9886\u4EBA: ${ssrInterpolate((_b = applicant.value) == null ? void 0 : _b.name)} \xB7 ${ssrInterpolate(unref(formatDate)(__props.requisition.applicationDate))}</p></div></div><span class="${ssrRenderClass([statusBadgeClass.value, "px-3 py-1 text-sm font-medium rounded-full"])}">${ssrInterpolate(unref(getStatusText)(__props.requisition.status))}</span></div><div class="space-y-3"><h4 class="font-medium text-gray-900">\u7533\u9886\u660E\u7EC6</h4><div class="bg-gray-50 rounded-xl overflow-hidden"><table class="w-full text-sm"><thead><tr class="bg-gray-100 text-gray-600"><th class="text-left px-4 py-3 font-medium">\u8017\u6750\u540D\u79F0</th><th class="text-center px-4 py-3 font-medium">\u7533\u8BF7\u6570\u91CF</th><th class="text-center px-4 py-3 font-medium">\u5DF2\u53D1\u6570\u91CF</th><th class="text-right px-4 py-3 font-medium">\u5355\u4EF7</th><th class="text-right px-4 py-3 font-medium">\u5C0F\u8BA1</th></tr></thead><tbody class="divide-y divide-gray-200"><!--[-->`);
          ssrRenderList(__props.requisition.items, (item, index) => {
            var _a2;
            _push2(`<tr class="hover:bg-white"><td class="px-4 py-3">${ssrInterpolate(item.supplyName)}</td><td class="px-4 py-3 text-center">${ssrInterpolate(item.quantity)}</td><td class="px-4 py-3 text-center"><span class="${ssrRenderClass(item.deliveredQuantity ? "text-green-600" : "text-gray-400")}">${ssrInterpolate((_a2 = item.deliveredQuantity) != null ? _a2 : "-")}</span></td><td class="px-4 py-3 text-right">${ssrInterpolate(item.unitPrice ? unref(formatCurrency)(item.unitPrice) : "-")}</td><td class="px-4 py-3 text-right font-medium">${ssrInterpolate(item.unitPrice ? unref(formatCurrency)(item.quantity * item.unitPrice) : "-")}</td></tr>`);
          });
          _push2(`<!--]--></tbody><tfoot class="bg-gray-100"><tr><td colspan="4" class="px-4 py-3 text-right font-medium text-gray-600">\u5408\u8BA1</td><td class="px-4 py-3 text-right font-bold text-primary-600">${ssrInterpolate(unref(formatCurrency)(totalAmount.value))}</td></tr></tfoot></table></div></div>`);
          if (__props.requisition.note) {
            _push2(`<div class="bg-blue-50 rounded-xl p-4"><h4 class="font-medium text-blue-900 mb-1">\u5907\u6CE8</h4><p class="text-sm text-blue-700">${ssrInterpolate(__props.requisition.note)}</p></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`<div class="grid grid-cols-2 gap-4">`);
          if (__props.requisition.approverId) {
            _push2(`<div class="bg-gray-50 rounded-xl p-4"><h4 class="font-medium text-gray-900 mb-2">\u5BA1\u6279\u4FE1\u606F</h4><div class="space-y-1 text-sm"><p class="text-gray-600"> \u5BA1\u6279\u4EBA: <span class="text-gray-900">${ssrInterpolate((_c = approver.value) == null ? void 0 : _c.name)}</span></p><p class="text-gray-600"> \u5BA1\u6279\u65E5\u671F: <span class="text-gray-900">${ssrInterpolate(__props.requisition.approvalDate)}</span></p></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (__props.requisition.deliveryDate) {
            _push2(`<div class="bg-gray-50 rounded-xl p-4"><h4 class="font-medium text-gray-900 mb-2">\u7269\u6D41\u4FE1\u606F</h4><div class="space-y-1 text-sm"><p class="text-gray-600"> \u53D1\u8D27\u65E5\u671F: <span class="text-gray-900">${ssrInterpolate(__props.requisition.deliveryDate)}</span></p><p class="text-gray-600"> \u72B6\u6001: <span class="text-green-600 font-medium">\u5DF2\u53D1\u8D27</span></p></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (__props.requisition.rejectReason) {
            _push2(`<div class="col-span-2 bg-red-50 rounded-xl p-4"><h4 class="font-medium text-red-900 mb-1">\u62D2\u7EDD\u539F\u56E0</h4><p class="text-sm text-red-700">${ssrInterpolate(__props.requisition.rejectReason)}</p></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div><div class="space-y-3"><h4 class="font-medium text-gray-900">\u5BA1\u6279\u6D41\u7A0B</h4><div class="relative"><div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div><div class="space-y-4"><div class="relative flex items-start gap-4"><div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center z-10 flex-shrink-0"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div><div class="pt-1"><p class="font-medium text-gray-900">\u63D0\u4EA4\u7533\u9886</p><p class="text-sm text-gray-500">${ssrInterpolate((_d = applicant.value) == null ? void 0 : _d.name)} \xB7 ${ssrInterpolate(unref(formatDate)(__props.requisition.applicationDate))}</p></div></div>`);
          if (__props.requisition.status !== "pending" && __props.requisition.status !== "draft") {
            _push2(`<div class="relative flex items-start gap-4"><div class="${ssrRenderClass([__props.requisition.status === "rejected" ? "bg-red-500" : "bg-green-500", "w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0"])}">`);
            if (__props.requisition.status === "rejected") {
              _push2(`<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`);
            } else {
              _push2(`<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`);
            }
            _push2(`</div><div class="pt-1"><p class="font-medium text-gray-900">${ssrInterpolate(__props.requisition.status === "rejected" ? "\u5DF2\u62D2\u7EDD" : "\u5DF2\u6279\u51C6")}</p><p class="text-sm text-gray-500">${ssrInterpolate((_e = approver.value) == null ? void 0 : _e.name)} \xB7 ${ssrInterpolate(__props.requisition.approvalDate)}</p></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (__props.requisition.status === "delivered" || __props.requisition.status === "completed") {
            _push2(`<div class="relative flex items-start gap-4"><div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center z-10 flex-shrink-0"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div><div class="pt-1"><p class="font-medium text-gray-900">\u5DF2\u53D1\u8D27</p><p class="text-sm text-gray-500">${ssrInterpolate(__props.requisition.deliveryDate)}</p></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (__props.requisition.status === "completed") {
            _push2(`<div class="relative flex items-start gap-4"><div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center z-10 flex-shrink-0"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div><div class="pt-1"><p class="font-medium text-gray-900">\u5DF2\u5B8C\u6210</p><p class="text-sm text-gray-500">\u7533\u9886\u6D41\u7A0B\u5DF2\u5B8C\u6210</p></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (__props.requisition.status === "pending") {
            _push2(`<div class="relative flex items-start gap-4"><div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center z-10 flex-shrink-0 animate-pulse"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div class="pt-1"><p class="font-medium text-gray-900">\u5F85\u5BA1\u6838</p><p class="text-sm text-gray-500">\u7B49\u5F85\u9879\u76EE\u4E3B\u7BA1\u5BA1\u6279</p></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div></div></div></div></div><div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">`);
          if (canApprove.value) {
            _push2(`<!--[--><button class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"> \u62D2\u7EDD </button><button class="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors font-medium"> \u6279\u51C6 </button><!--]-->`);
          } else if (canDeliver.value) {
            _push2(`<button class="px-4 py-2 bg-primary-500 text-white hover:bg-primary-600 rounded-lg transition-colors font-medium"> \u6807\u8BB0\u5DF2\u53D1\u8D27 </button>`);
          } else if (canComplete.value) {
            _push2(`<button class="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors font-medium"> \u786E\u8BA4\u5B8C\u6210 </button>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`<button class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"> \u5173\u95ED </button></div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
        if (showRejectDialog.value) {
          _push2(`<div class="fixed inset-0 z-[60] flex items-center justify-center p-4"><div class="absolute inset-0 bg-black/50"></div><div class="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6"><h3 class="text-lg font-bold text-gray-900 mb-4">\u62D2\u7EDD\u7533\u9886</h3><p class="text-sm text-gray-500 mb-4">\u8BF7\u586B\u5199\u62D2\u7EDD\u539F\u56E0</p><textarea placeholder="\u8BF7\u8F93\u5165\u62D2\u7EDD\u539F\u56E0..." class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" rows="4">${ssrInterpolate(rejectReason.value)}</textarea><div class="flex items-center justify-end gap-3 mt-4"><button class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"> \u53D6\u6D88 </button><button${ssrIncludeBooleanAttr(!rejectReason.value.trim()) ? " disabled" : ""} class="px-4 py-2 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"> \u786E\u8BA4\u62D2\u7EDD </button></div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/RequisitionDetailModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "requisitions",
  __ssrInlineRender: true,
  setup(__props) {
    const dataStore = useDataStore();
    const authStore = useAuthStore();
    const selectedStatus = ref("");
    const selectedProjectId = ref("");
    const startDate = ref("");
    const endDate = ref("");
    const showDetailModal = ref(false);
    const selectedRequisition = ref(null);
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastType = ref("success");
    ref(false);
    ref("");
    ref("");
    const projects = computed(() => dataStore.projects);
    const requisitions2 = computed(() => dataStore.requisitions);
    const pendingCount = computed(() => {
      return requisitions2.value.filter((r) => r.status === "pending").length;
    });
    const filteredRequisitions = computed(() => {
      let result = [...requisitions2.value];
      if (selectedStatus.value) {
        result = result.filter((r) => r.status === selectedStatus.value);
      }
      if (selectedProjectId.value) {
        result = result.filter((r) => r.projectId === selectedProjectId.value);
      }
      if (startDate.value) {
        result = result.filter((r) => r.applicationDate >= startDate.value);
      }
      if (endDate.value) {
        result = result.filter((r) => r.applicationDate <= endDate.value);
      }
      result.sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime());
      return result;
    });
    function getProjectName(projectId) {
      var _a;
      return ((_a = dataStore.getProjectById(projectId)) == null ? void 0 : _a.name) || "\u672A\u77E5\u9879\u76EE";
    }
    function getStaffName(staffId) {
      var _a;
      return ((_a = dataStore.getStaffById(staffId)) == null ? void 0 : _a.name) || "\u672A\u77E5";
    }
    function getTotalAmount(req) {
      return req.items.reduce((sum, item) => {
        if (item.unitPrice) {
          return sum + item.quantity * item.unitPrice;
        }
        return sum;
      }, 0);
    }
    function getStatusBadgeClass(status) {
      const classMap = {
        draft: "bg-gray-100 text-gray-700",
        pending: "bg-yellow-100 text-yellow-700",
        approved: "bg-green-100 text-green-700",
        rejected: "bg-red-100 text-red-700",
        delivered: "bg-blue-100 text-blue-700",
        completed: "bg-green-100 text-green-700"
      };
      return classMap[status] || "bg-gray-100 text-gray-700";
    }
    function canApprove(req) {
      return req.status === "pending" && authStore.isProjectManager;
    }
    function canDeliver(req) {
      return req.status === "approved" && authStore.isProjectManager;
    }
    function closeDetailModal() {
      showDetailModal.value = false;
      selectedRequisition.value = null;
    }
    function handleRequisitionUpdate(req) {
      showToastMessage("\u64CD\u4F5C\u6210\u529F");
    }
    function showToastMessage(message, type = "success") {
      toastMessage.value = message;
      toastType.value = type;
      showToast.value = true;
      setTimeout(() => {
        showToast.value = false;
      }, 3e3);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_RequisitionDetailModal = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-6" }, _attrs))} data-v-2fb567e1><div class="flex items-center justify-between" data-v-2fb567e1><div data-v-2fb567e1><h1 class="text-2xl font-bold text-gray-900" data-v-2fb567e1>\u7533\u9886\u5355\u7BA1\u7406</h1><p class="text-gray-500 mt-1" data-v-2fb567e1> \u5171 ${ssrInterpolate(requisitions2.value.length)} \u6761\u7533\u9886\u5355 \xB7 <span class="text-yellow-600" data-v-2fb567e1>${ssrInterpolate(pendingCount.value)} \u6761\u5F85\u5BA1\u6838</span></p></div><div class="flex items-center gap-3" data-v-2fb567e1>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/supplies",
        class: "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-2fb567e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" data-v-2fb567e1${_scopeId}></path></svg> \u5E93\u5B58\u5217\u8868 `);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                class: "w-5 h-5",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24"
              }, [
                createVNode("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "stroke-width": "2",
                  d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                })
              ])),
              createTextVNode(" \u5E93\u5B58\u5217\u8868 ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/supplies/requisition/new",
        class: "px-4 py-2 bg-primary-500 text-white hover:bg-primary-600 rounded-lg transition-colors font-medium flex items-center gap-2"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-2fb567e1${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" data-v-2fb567e1${_scopeId}></path></svg> \u65B0\u5EFA\u7533\u9886 `);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                class: "w-5 h-5",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24"
              }, [
                createVNode("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "stroke-width": "2",
                  d: "M12 4v16m8-8H4"
                })
              ])),
              createTextVNode(" \u65B0\u5EFA\u7533\u9886 ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4" data-v-2fb567e1><div class="flex flex-wrap items-center gap-4" data-v-2fb567e1><div class="flex items-center gap-2" data-v-2fb567e1><label class="text-sm text-gray-500" data-v-2fb567e1>\u72B6\u6001:</label><select class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-2fb567e1><option value="" data-v-2fb567e1${ssrIncludeBooleanAttr(Array.isArray(selectedStatus.value) ? ssrLooseContain(selectedStatus.value, "") : ssrLooseEqual(selectedStatus.value, "")) ? " selected" : ""}>\u5168\u90E8</option><option value="draft" data-v-2fb567e1${ssrIncludeBooleanAttr(Array.isArray(selectedStatus.value) ? ssrLooseContain(selectedStatus.value, "draft") : ssrLooseEqual(selectedStatus.value, "draft")) ? " selected" : ""}>\u8349\u7A3F</option><option value="pending" data-v-2fb567e1${ssrIncludeBooleanAttr(Array.isArray(selectedStatus.value) ? ssrLooseContain(selectedStatus.value, "pending") : ssrLooseEqual(selectedStatus.value, "pending")) ? " selected" : ""}>\u5F85\u5BA1\u6838</option><option value="approved" data-v-2fb567e1${ssrIncludeBooleanAttr(Array.isArray(selectedStatus.value) ? ssrLooseContain(selectedStatus.value, "approved") : ssrLooseEqual(selectedStatus.value, "approved")) ? " selected" : ""}>\u5DF2\u6279\u51C6</option><option value="rejected" data-v-2fb567e1${ssrIncludeBooleanAttr(Array.isArray(selectedStatus.value) ? ssrLooseContain(selectedStatus.value, "rejected") : ssrLooseEqual(selectedStatus.value, "rejected")) ? " selected" : ""}>\u5DF2\u62D2\u7EDD</option><option value="delivered" data-v-2fb567e1${ssrIncludeBooleanAttr(Array.isArray(selectedStatus.value) ? ssrLooseContain(selectedStatus.value, "delivered") : ssrLooseEqual(selectedStatus.value, "delivered")) ? " selected" : ""}>\u5DF2\u53D1\u8D27</option><option value="completed" data-v-2fb567e1${ssrIncludeBooleanAttr(Array.isArray(selectedStatus.value) ? ssrLooseContain(selectedStatus.value, "completed") : ssrLooseEqual(selectedStatus.value, "completed")) ? " selected" : ""}>\u5DF2\u5B8C\u6210</option></select></div><div class="flex items-center gap-2" data-v-2fb567e1><label class="text-sm text-gray-500" data-v-2fb567e1>\u9879\u76EE:</label><select class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-2fb567e1><option value="" data-v-2fb567e1${ssrIncludeBooleanAttr(Array.isArray(selectedProjectId.value) ? ssrLooseContain(selectedProjectId.value, "") : ssrLooseEqual(selectedProjectId.value, "")) ? " selected" : ""}>\u5168\u90E8\u9879\u76EE</option><!--[-->`);
      ssrRenderList(projects.value, (project) => {
        _push(`<option${ssrRenderAttr("value", project.id)} data-v-2fb567e1${ssrIncludeBooleanAttr(Array.isArray(selectedProjectId.value) ? ssrLooseContain(selectedProjectId.value, project.id) : ssrLooseEqual(selectedProjectId.value, project.id)) ? " selected" : ""}>${ssrInterpolate(project.name)}</option>`);
      });
      _push(`<!--]--></select></div><div class="flex items-center gap-2" data-v-2fb567e1><label class="text-sm text-gray-500" data-v-2fb567e1>\u5F00\u59CB\u65E5\u671F:</label><input${ssrRenderAttr("value", startDate.value)} type="date" class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-2fb567e1></div><div class="flex items-center gap-2" data-v-2fb567e1><label class="text-sm text-gray-500" data-v-2fb567e1>\u7ED3\u675F\u65E5\u671F:</label><input${ssrRenderAttr("value", endDate.value)} type="date" class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-2fb567e1></div><button class="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors" data-v-2fb567e1> \u91CD\u7F6E\u7B5B\u9009 </button></div></div>`);
      if (filteredRequisitions.value.length === 0) {
        _push(`<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center" data-v-2fb567e1><span class="text-5xl mb-4 block" data-v-2fb567e1>\u{1F4CB}</span><p class="text-gray-500 text-lg" data-v-2fb567e1>\u6682\u65E0\u7B26\u5408\u6761\u4EF6\u7684\u7533\u9886\u5355</p><p class="text-gray-400 text-sm mt-2" data-v-2fb567e1>\u8BF7\u5C1D\u8BD5\u8C03\u6574\u7B5B\u9009\u6761\u4EF6</p></div>`);
      } else {
        _push(`<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" data-v-2fb567e1><table class="w-full text-sm" data-v-2fb567e1><thead data-v-2fb567e1><tr class="bg-gray-50 text-gray-600" data-v-2fb567e1><th class="text-left px-6 py-4 font-medium" data-v-2fb567e1>\u7533\u9886\u5355\u53F7</th><th class="text-left px-6 py-4 font-medium" data-v-2fb567e1>\u9879\u76EE</th><th class="text-left px-6 py-4 font-medium" data-v-2fb567e1>\u7533\u9886\u4EBA</th><th class="text-left px-6 py-4 font-medium" data-v-2fb567e1>\u7533\u8BF7\u65E5\u671F</th><th class="text-center px-6 py-4 font-medium" data-v-2fb567e1>\u8017\u6750\u6570\u91CF</th><th class="text-right px-6 py-4 font-medium" data-v-2fb567e1>\u5408\u8BA1\u91D1\u989D</th><th class="text-center px-6 py-4 font-medium" data-v-2fb567e1>\u72B6\u6001</th><th class="text-right px-6 py-4 font-medium" data-v-2fb567e1>\u64CD\u4F5C</th></tr></thead><tbody class="divide-y divide-gray-100" data-v-2fb567e1><!--[-->`);
        ssrRenderList(filteredRequisitions.value, (req) => {
          _push(`<tr class="hover:bg-gray-50 transition-colors cursor-pointer" data-v-2fb567e1><td class="px-6 py-4" data-v-2fb567e1><span class="font-mono text-gray-900" data-v-2fb567e1>${ssrInterpolate(req.id)}</span></td><td class="px-6 py-4" data-v-2fb567e1><span class="text-gray-900" data-v-2fb567e1>${ssrInterpolate(getProjectName(req.projectId))}</span></td><td class="px-6 py-4" data-v-2fb567e1><span class="text-gray-600" data-v-2fb567e1>${ssrInterpolate(getStaffName(req.applicantId))}</span></td><td class="px-6 py-4" data-v-2fb567e1><span class="text-gray-600" data-v-2fb567e1>${ssrInterpolate(req.applicationDate)}</span></td><td class="px-6 py-4 text-center" data-v-2fb567e1><span class="text-gray-600" data-v-2fb567e1>${ssrInterpolate(req.items.length)} \u9879</span></td><td class="px-6 py-4 text-right" data-v-2fb567e1><span class="font-medium text-gray-900" data-v-2fb567e1>${ssrInterpolate(unref(formatCurrency)(getTotalAmount(req)))}</span></td><td class="px-6 py-4 text-center" data-v-2fb567e1><span class="${ssrRenderClass([getStatusBadgeClass(req.status), "px-3 py-1 text-xs font-medium rounded-full"])}" data-v-2fb567e1>${ssrInterpolate(unref(getStatusText)(req.status))}</span></td><td class="px-6 py-4 text-right" data-v-2fb567e1><div class="flex items-center justify-end gap-2" data-v-2fb567e1>`);
          if (canApprove(req)) {
            _push(`<button class="px-3 py-1.5 text-xs bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors" data-v-2fb567e1> \u6279\u51C6 </button>`);
          } else {
            _push(`<!---->`);
          }
          if (canApprove(req)) {
            _push(`<button class="px-3 py-1.5 text-xs bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors" data-v-2fb567e1> \u62D2\u7EDD </button>`);
          } else {
            _push(`<!---->`);
          }
          if (canDeliver(req)) {
            _push(`<button class="px-3 py-1.5 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors" data-v-2fb567e1> \u53D1\u8D27 </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<button class="px-3 py-1.5 text-xs text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" data-v-2fb567e1> \u8BE6\u60C5 </button></div></td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      }
      if (selectedRequisition.value) {
        _push(ssrRenderComponent(_component_RequisitionDetailModal, {
          visible: showDetailModal.value,
          requisition: selectedRequisition.value,
          onClose: closeDetailModal,
          onUpdate: handleRequisitionUpdate
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      ssrRenderTeleport(_push, (_push2) => {
        if (showToast.value) {
          _push2(`<div class="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up" data-v-2fb567e1>`);
          if (toastType.value === "success") {
            _push2(`<span class="text-green-400" data-v-2fb567e1>\u2713</span>`);
          } else {
            _push2(`<span class="text-red-400" data-v-2fb567e1>\u2715</span>`);
          }
          _push2(`<span data-v-2fb567e1>${ssrInterpolate(toastMessage.value)}</span></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/supplies/requisitions.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const requisitions = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-2fb567e1"]]);

export { requisitions as default };
//# sourceMappingURL=requisitions-BxR2IYGY.mjs.map
