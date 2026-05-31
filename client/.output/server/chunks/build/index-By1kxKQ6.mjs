import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrRenderComponent } from 'vue/server-renderer';
import { u as useDataStore, b as formatDateTime } from './data-CvF3Pjf4.mjs';
import { u as useAuthStore } from './auth-BO_zE_6L.mjs';
import { g as getAlertTypeText, i as getStatusText } from './formatters-B147ECSY.mjs';
import { a as _export_sfc } from './server.mjs';
import 'dayjs';
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

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "AlertDetailModal",
  __ssrInlineRender: true,
  props: {
    alert: {},
    visible: { type: Boolean }
  },
  emits: ["close", "status-change"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const dataStore = useDataStore();
    useAuthStore();
    const actionNote = ref("");
    const confirmDialog = ref({
      visible: false,
      title: "",
      message: "",
      onConfirm: () => {
      }
    });
    const projectName = computed(() => {
      var _a;
      if (!props.alert.projectId) return "\u65E0";
      return ((_a = dataStore.getProjectById(props.alert.projectId)) == null ? void 0 : _a.name) || "\u672A\u77E5\u9879\u76EE";
    });
    const relatedData = computed(() => {
      var _a;
      const { relatedType, relatedId } = props.alert;
      if (relatedType === "punch") {
        const punch = dataStore.punchRecords.find((p) => p.id === relatedId);
        if (punch) {
          const staff = dataStore.getStaffById(punch.staffId);
          return {
            staffName: (staff == null ? void 0 : staff.name) || "\u672A\u77E5",
            date: punch.date,
            status: getStatusText(punch.status),
            checkInTime: punch.checkInTime || "-",
            checkOutTime: punch.checkOutTime || "-",
            note: punch.note || "-"
          };
        }
      } else if (relatedType === "supply") {
        const supply = dataStore.supplies.find((s) => s.id === relatedId);
        if (supply) {
          return {
            supplyName: supply.name,
            category: supply.category,
            currentStock: `${supply.currentStock}${supply.unit}`,
            warningStock: `${supply.warningStock}${supply.unit}`,
            safeStock: `${supply.safeStock}${supply.unit}`,
            supplier: supply.supplier
          };
        }
      } else if (relatedType === "rectification") {
        const rect = dataStore.rectifications.find((r) => r.id === relatedId);
        if (rect) {
          const project = dataStore.getProjectById(rect.projectId);
          const completedItems = rect.items.filter((i) => i.completed).length;
          return {
            projectName: (project == null ? void 0 : project.name) || "\u672A\u77E5",
            deadline: rect.deadline,
            status: getStatusText(rect.status),
            progress: `${completedItems}/${rect.items.length} \u9879`,
            assignee: rect.assigneeId ? (_a = dataStore.getStaffById(rect.assigneeId)) == null ? void 0 : _a.name : "\u672A\u6307\u5B9A"
          };
        }
      } else if (relatedType === "project") {
        const project = dataStore.getProjectById(relatedId);
        if (project) {
          return {
            projectName: project.name,
            clientName: project.clientName,
            contractStartDate: project.contractStartDate,
            contractEndDate: project.contractEndDate,
            status: getStatusText(project.status)
          };
        }
      } else if (relatedType === "requisition") {
        const req = dataStore.requisitions.find((r) => r.id === relatedId);
        if (req) {
          const project = dataStore.getProjectById(req.projectId);
          const applicant = dataStore.getStaffById(req.applicantId);
          return {
            projectName: (project == null ? void 0 : project.name) || "\u672A\u77E5",
            applicant: (applicant == null ? void 0 : applicant.name) || "\u672A\u77E5",
            applicationDate: req.applicationDate,
            status: getStatusText(req.status),
            itemsCount: `${req.items.length} \u9879`
          };
        }
      }
      return null;
    });
    function getFieldLabel(key) {
      const labelMap = {
        staffName: "\u5458\u5DE5\u59D3\u540D",
        date: "\u65E5\u671F",
        checkInTime: "\u6253\u5361\u65F6\u95F4",
        checkOutTime: "\u7B7E\u9000\u65F6\u95F4",
        supplyName: "\u8017\u6750\u540D\u79F0",
        category: "\u5206\u7C7B",
        currentStock: "\u5F53\u524D\u5E93\u5B58",
        warningStock: "\u9884\u8B66\u5E93\u5B58",
        safeStock: "\u5B89\u5168\u5E93\u5B58",
        supplier: "\u4F9B\u5E94\u5546",
        projectName: "\u9879\u76EE\u540D\u79F0",
        clientName: "\u5BA2\u6237\u540D\u79F0",
        contractStartDate: "\u5408\u540C\u5F00\u59CB",
        contractEndDate: "\u5408\u540C\u7ED3\u675F",
        deadline: "\u622A\u6B62\u65E5\u671F",
        progress: "\u6574\u6539\u8FDB\u5EA6",
        assignee: "\u8D1F\u8D23\u4EBA",
        applicant: "\u7533\u8BF7\u4EBA",
        applicationDate: "\u7533\u8BF7\u65E5\u671F",
        itemsCount: "\u7533\u8BF7\u9879\u6570"
      };
      return labelMap[key] || key;
    }
    function formatFieldValue(key, value) {
      if (key === "category" && typeof value === "string") {
        const categoryMap = {
          detergent: "\u6E05\u6D01\u5242",
          tool: "\u6E05\u6D01\u5DE5\u5177",
          disposable: "\u4E00\u6B21\u6027\u7528\u54C1",
          protective: "\u9632\u62A4\u7528\u54C1"
        };
        return categoryMap[value] || value;
      }
      return String(value);
    }
    function getOperatorName(operatorId) {
      if (operatorId === "system") return "\u7CFB\u7EDF";
      const user = dataStore.staff.find((s) => s.id === operatorId);
      if (user) return user.name;
      return "\u672A\u77E5\u7528\u6237";
    }
    function getAlertIcon(type) {
      const iconMap = {
        missing_punch: "\u{1F550}",
        rectification: "\u{1F527}",
        low_stock: "\u{1F4E6}",
        contract_expiry: "\u{1F4C4}",
        overdue_task: "\u26A0\uFE0F"
      };
      return iconMap[type];
    }
    function getAlertSeverityBg(severity) {
      const bgMap = {
        critical: "bg-red-100",
        warning: "bg-yellow-100",
        info: "bg-blue-100"
      };
      return bgMap[severity];
    }
    function getSeverityBadgeClass(severity) {
      const classMap = {
        critical: "bg-red-100 text-red-700",
        warning: "bg-yellow-100 text-yellow-700",
        info: "bg-blue-100 text-blue-700"
      };
      return classMap[severity];
    }
    function getStatusBadgeClass(status) {
      const classMap = {
        open: "bg-red-100 text-red-700",
        in_progress: "bg-yellow-100 text-yellow-700",
        resolved: "bg-green-100 text-green-700"
      };
      return classMap[status];
    }
    function getSeverityText(severity) {
      const textMap = {
        critical: "\u7D27\u6025",
        warning: "\u8B66\u544A",
        info: "\u63D0\u793A"
      };
      return textMap[severity];
    }
    function getTimelineDotClass(status) {
      const classMap = {
        open: "bg-red-500",
        in_progress: "bg-yellow-500",
        resolved: "bg-green-500"
      };
      return classMap[status];
    }
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.visible) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" }, _attrs))}><div class="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"><div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between"><div class="flex items-center gap-3"><div class="${ssrRenderClass([getAlertSeverityBg(__props.alert.severity), "w-12 h-12 rounded-xl flex items-center justify-center"])}"><span class="text-2xl">${ssrInterpolate(getAlertIcon(__props.alert.type))}</span></div><div><h3 class="text-lg font-semibold text-gray-900">${ssrInterpolate(__props.alert.title)}</h3><div class="flex items-center gap-2 mt-1"><span class="${ssrRenderClass([getSeverityBadgeClass(__props.alert.severity), "px-2 py-0.5 text-xs rounded-full"])}">${ssrInterpolate(getSeverityText(__props.alert.severity))}</span><span class="${ssrRenderClass([getStatusBadgeClass(__props.alert.status), "px-2 py-0.5 text-xs rounded-full"])}">${ssrInterpolate(unref(getStatusText)(__props.alert.status))}</span><span class="text-xs text-gray-500">${ssrInterpolate(unref(getAlertTypeText)(__props.alert.type))}</span></div></div></div><button class="p-2 hover:bg-gray-100 rounded-lg transition-colors"><span class="text-xl">\u2715</span></button></div><div class="flex-1 overflow-y-auto p-6 space-y-6"><div class="bg-gray-50 rounded-xl p-5"><h4 class="font-medium text-gray-900 mb-3">\u9884\u8B66\u4FE1\u606F</h4><p class="text-gray-600 leading-relaxed">${ssrInterpolate(__props.alert.description)}</p><div class="grid grid-cols-2 gap-4 mt-4 text-sm"><div><span class="text-gray-500">\u5173\u8054\u9879\u76EE:</span><span class="text-gray-900 ml-2">${ssrInterpolate(projectName.value)}</span></div><div><span class="text-gray-500">\u521B\u5EFA\u65F6\u95F4:</span><span class="text-gray-900 ml-2">${ssrInterpolate(unref(formatDateTime)(__props.alert.createdAt))}</span></div><div><span class="text-gray-500">\u66F4\u65B0\u65F6\u95F4:</span><span class="text-gray-900 ml-2">${ssrInterpolate(unref(formatDateTime)(__props.alert.updatedAt))}</span></div>`);
        if (__props.alert.resolvedAt) {
          _push(`<div><span class="text-gray-500">\u89E3\u51B3\u65F6\u95F4:</span><span class="text-gray-900 ml-2">${ssrInterpolate(unref(formatDateTime)(__props.alert.resolvedAt))}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (__props.alert.resolutionNote) {
          _push(`<div class="mt-4 p-3 bg-green-50 rounded-lg border border-green-200"><span class="text-sm font-medium text-green-800">\u5904\u7406\u7ED3\u679C:</span><p class="text-sm text-green-700 mt-1">${ssrInterpolate(__props.alert.resolutionNote)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="bg-white border border-gray-200 rounded-xl p-5"><h4 class="font-medium text-gray-900 mb-3">\u5173\u8054\u6570\u636E</h4>`);
        if (relatedData.value) {
          _push(`<div class="space-y-3"><!--[-->`);
          ssrRenderList(relatedData.value, (value, key) => {
            _push(`<div class="flex items-start gap-2"><span class="text-gray-500 text-sm w-24 flex-shrink-0">${ssrInterpolate(getFieldLabel(key))}:</span><span class="text-gray-900 text-sm">${ssrInterpolate(formatFieldValue(key, value))}</span></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="text-gray-400 text-sm text-center py-4"> \u6682\u65E0\u5173\u8054\u6570\u636E\u8BE6\u60C5 </div>`);
        }
        _push(`</div><div><h4 class="font-medium text-gray-900 mb-4">\u5904\u7406\u65F6\u95F4\u7EBF</h4><div class="relative"><div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div><div class="space-y-4"><!--[-->`);
        ssrRenderList(__props.alert.history, (item, index2) => {
          _push(`<div class="relative pl-10"><div class="${ssrRenderClass([getTimelineDotClass(item.status), "absolute left-2 w-5 h-5 rounded-full border-4 border-white"])}"></div><div class="bg-white border border-gray-200 rounded-lg p-4"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><span class="${ssrRenderClass([getStatusBadgeClass(item.status), "px-2 py-0.5 text-xs rounded-full"])}">${ssrInterpolate(unref(getStatusText)(item.status))}</span><span class="text-sm text-gray-500">${ssrInterpolate(getOperatorName(item.operatorId))}</span></div><span class="text-xs text-gray-400">${ssrInterpolate(unref(formatDateTime)(item.timestamp))}</span></div><p class="text-sm text-gray-600">${ssrInterpolate(item.note)}</p></div></div>`);
        });
        _push(`<!--]--></div></div></div></div><div class="px-6 py-4 border-t border-gray-100 bg-gray-50">`);
        if (__props.alert.status !== "resolved") {
          _push(`<div class="space-y-4"><div class="space-y-2"><label class="block text-sm font-medium text-gray-700">\u5904\u7406\u64CD\u4F5C</label><textarea rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="\u8BF7\u8F93\u5165\u5904\u7406\u5907\u6CE8...">${ssrInterpolate(actionNote.value)}</textarea></div><div class="flex justify-end gap-3"><button class="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"> \u5173\u95ED </button>`);
          if (__props.alert.status === "open") {
            _push(`<button class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"><span>\u23F3</span> \u5F00\u59CB\u5904\u7406 </button>`);
          } else {
            _push(`<!---->`);
          }
          if (__props.alert.status === "in_progress") {
            _push(`<button class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><span>\u2705</span> \u6807\u8BB0\u89E3\u51B3 </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        } else {
          _push(`<div class="flex justify-end gap-3"><button class="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"> \u5173\u95ED </button><button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"><span>\u{1F504}</span> \u91CD\u65B0\u6253\u5F00 </button></div>`);
        }
        _push(`</div></div>`);
        if (confirmDialog.value.visible) {
          _push(`<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"><div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4"><div class="px-6 py-4 border-b border-gray-100"><h3 class="text-lg font-semibold text-gray-900">${ssrInterpolate(confirmDialog.value.title)}</h3></div><div class="px-6 py-4"><p class="text-gray-600">${ssrInterpolate(confirmDialog.value.message)}</p></div><div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3"><button class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"> \u53D6\u6D88 </button><button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"> \u786E\u8BA4 </button></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AlertDetailModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const dataStore = useDataStore();
    useAuthStore();
    const viewMode = ref("grouped");
    const selectedIds = ref([]);
    const activeTypeFilter = ref("all");
    const activeStatusFilter = ref("all");
    const searchText = ref("");
    const detailModalVisible = ref(false);
    const selectedAlert = ref(null);
    const showBatchModal = ref(false);
    const batchConfirmVisible = ref(false);
    const batchAction = ref("in_progress");
    const batchNote = ref("");
    const confirmDialog = ref({
      visible: false,
      title: "",
      message: "",
      showNote: false,
      note: "",
      onConfirm: () => {
      }
    });
    const toast = ref({
      visible: false,
      type: "success",
      message: "",
      icon: ""
    });
    const alertTypes = ["missing_punch", "rectification", "low_stock", "contract_expiry", "overdue_task"];
    const alertStats = computed(() => {
      const alerts = dataStore.alerts;
      return alertTypes.map((type) => {
        const typeAlerts = alerts.filter((a) => a.type === type);
        const criticalCount = typeAlerts.filter((a) => a.severity === "critical" && a.status !== "resolved").length;
        return {
          type,
          label: getAlertTypeText(type),
          icon: getAlertIcon(type),
          count: typeAlerts.filter((a) => a.status !== "resolved").length,
          iconBg: criticalCount > 0 ? "bg-red-100" : getAlertSeverityBg(type === "low_stock" ? "warning" : "info"),
          countColor: criticalCount > 0 ? "text-red-600" : "text-gray-900"
        };
      });
    });
    const statusFilters = computed(() => [
      { value: "all", label: "\u5168\u90E8", count: dataStore.alerts.length, bgClass: "bg-gray-100", textClass: "text-gray-700", borderClass: "border-gray-300" },
      { value: "open", label: "\u672A\u5904\u7406", count: dataStore.alerts.filter((a) => a.status === "open").length, bgClass: "bg-red-50", textClass: "text-red-700", borderClass: "border-red-300" },
      { value: "in_progress", label: "\u5904\u7406\u4E2D", count: dataStore.alerts.filter((a) => a.status === "in_progress").length, bgClass: "bg-yellow-50", textClass: "text-yellow-700", borderClass: "border-yellow-300" },
      { value: "resolved", label: "\u5DF2\u89E3\u51B3", count: dataStore.alerts.filter((a) => a.status === "resolved").length, bgClass: "bg-green-50", textClass: "text-green-700", borderClass: "border-green-300" }
    ]);
    const sortedAlerts = computed(() => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return [...dataStore.alerts].sort((a, b) => {
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });
    const filteredAlerts = computed(() => {
      return sortedAlerts.value.filter((alert) => {
        if (activeTypeFilter.value !== "all" && alert.type !== activeTypeFilter.value) {
          return false;
        }
        if (activeStatusFilter.value !== "all" && alert.status !== activeStatusFilter.value) {
          return false;
        }
        if (searchText.value) {
          const search = searchText.value.toLowerCase();
          if (!alert.title.toLowerCase().includes(search) && !alert.description.toLowerCase().includes(search)) {
            return false;
          }
        }
        return true;
      });
    });
    const groupedAlerts = computed(() => {
      return alertTypes.map((type) => ({
        type,
        alerts: filteredAlerts.value.filter((a) => a.type === type)
      }));
    });
    const hasActiveFilters = computed(() => {
      return activeTypeFilter.value !== "all" || activeStatusFilter.value !== "all" || searchText.value !== "";
    });
    function handleStatusChange() {
      showToast("success", "\u9884\u8B66\u72B6\u6001\u5DF2\u66F4\u65B0", "\u2705");
    }
    function showToast(type, message, icon) {
      toast.value = { visible: true, type, message, icon };
      setTimeout(() => {
        toast.value.visible = false;
      }, 3e3);
    }
    function getProjectName(projectId) {
      var _a;
      return ((_a = dataStore.getProjectById(projectId)) == null ? void 0 : _a.name) || "\u672A\u77E5\u9879\u76EE";
    }
    function getAlertIcon(type) {
      const iconMap = {
        missing_punch: "\u{1F550}",
        rectification: "\u{1F527}",
        low_stock: "\u{1F4E6}",
        contract_expiry: "\u{1F4C4}",
        overdue_task: "\u26A0\uFE0F"
      };
      return iconMap[type];
    }
    function getAlertSeverityBg(severity) {
      const bgMap = {
        critical: "bg-red-100",
        warning: "bg-yellow-100",
        info: "bg-blue-100"
      };
      return bgMap[severity];
    }
    function getSeverityText(severity) {
      const textMap = {
        critical: "\u7D27\u6025",
        warning: "\u8B66\u544A",
        info: "\u63D0\u793A"
      };
      return textMap[severity];
    }
    function getSeverityBadgeClass(severity) {
      const classMap = {
        critical: "bg-red-100 text-red-700",
        warning: "bg-yellow-100 text-yellow-700",
        info: "bg-blue-100 text-blue-700"
      };
      return classMap[severity];
    }
    function getStatusBadgeClass(status) {
      const classMap = {
        open: "bg-red-100 text-red-700",
        in_progress: "bg-yellow-100 text-yellow-700",
        resolved: "bg-green-100 text-green-700"
      };
      return classMap[status];
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-6" }, _attrs))} data-v-a62b419d><div class="flex items-center justify-between" data-v-a62b419d><div data-v-a62b419d><h1 class="text-2xl font-bold text-gray-900" data-v-a62b419d>\u9884\u8B66\u4E2D\u5FC3</h1><p class="text-gray-500 mt-1" data-v-a62b419d>\u67E5\u770B\u548C\u5904\u7406\u6240\u6709\u9884\u8B66\u4FE1\u606F</p></div><div class="flex items-center gap-3" data-v-a62b419d><select class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-a62b419d><option value="grouped" data-v-a62b419d${ssrIncludeBooleanAttr(Array.isArray(viewMode.value) ? ssrLooseContain(viewMode.value, "grouped") : ssrLooseEqual(viewMode.value, "grouped")) ? " selected" : ""}>\u6309\u7C7B\u578B\u5206\u7EC4</option><option value="list" data-v-a62b419d${ssrIncludeBooleanAttr(Array.isArray(viewMode.value) ? ssrLooseContain(viewMode.value, "list") : ssrLooseEqual(viewMode.value, "list")) ? " selected" : ""}>\u5168\u90E8\u5217\u8868</option></select>`);
      if (selectedIds.value.length > 0) {
        _push(`<button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex items-center gap-2" data-v-a62b419d><span data-v-a62b419d>\u6279\u91CF\u64CD\u4F5C</span><span class="bg-primary-500 px-2 py-0.5 rounded-full text-xs" data-v-a62b419d>${ssrInterpolate(selectedIds.value.length)}</span></button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4" data-v-a62b419d><!--[-->`);
      ssrRenderList(alertStats.value, (stat) => {
        _push(`<div class="${ssrRenderClass([{ "ring-2 ring-primary-500": activeTypeFilter.value === stat.type }, "bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"])}" data-v-a62b419d><div class="flex items-center gap-3" data-v-a62b419d><div class="${ssrRenderClass([stat.iconBg, "w-10 h-10 rounded-lg flex items-center justify-center"])}" data-v-a62b419d><span class="text-xl" data-v-a62b419d>${ssrInterpolate(stat.icon)}</span></div><div data-v-a62b419d><p class="text-sm text-gray-500" data-v-a62b419d>${ssrInterpolate(stat.label)}</p><p class="${ssrRenderClass([stat.countColor, "text-xl font-bold"])}" data-v-a62b419d>${ssrInterpolate(stat.count)}</p></div></div></div>`);
      });
      _push(`<!--]--></div><div class="flex items-center gap-4" data-v-a62b419d><div class="flex items-center gap-2" data-v-a62b419d><label class="text-sm font-medium text-gray-700" data-v-a62b419d>\u72B6\u6001:</label><div class="flex gap-2" data-v-a62b419d><!--[-->`);
      ssrRenderList(statusFilters.value, (status) => {
        _push(`<button class="${ssrRenderClass([
          "px-3 py-1.5 text-sm rounded-lg border transition-colors",
          activeStatusFilter.value === status.value ? `${status.bgClass} ${status.textClass} ${status.borderClass}` : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
        ])}" data-v-a62b419d>${ssrInterpolate(status.label)} (${ssrInterpolate(status.count)}) </button>`);
      });
      _push(`<!--]--></div></div><div class="flex-1 max-w-md" data-v-a62b419d><input${ssrRenderAttr("value", searchText.value)} type="text" placeholder="\u641C\u7D22\u9884\u8B66\u6807\u9898\u6216\u63CF\u8FF0..." class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-a62b419d></div>`);
      if (hasActiveFilters.value) {
        _push(`<button class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900" data-v-a62b419d> \u6E05\u9664\u7B5B\u9009 </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (viewMode.value === "grouped") {
        _push(`<div data-v-a62b419d><!--[-->`);
        ssrRenderList(groupedAlerts.value, (group) => {
          _push(`<div class="space-y-4" data-v-a62b419d>`);
          if (group.alerts.length > 0) {
            _push(`<div class="flex items-center gap-3" data-v-a62b419d><span class="text-2xl" data-v-a62b419d>${ssrInterpolate(getAlertIcon(group.type))}</span><h2 class="text-lg font-semibold text-gray-900" data-v-a62b419d>${ssrInterpolate(unref(getAlertTypeText)(group.type))}</h2><span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full" data-v-a62b419d>${ssrInterpolate(group.alerts.length)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" data-v-a62b419d>`);
          if (group.alerts.length > 0) {
            _push(`<div class="divide-y divide-gray-50" data-v-a62b419d><!--[-->`);
            ssrRenderList(group.alerts, (alert) => {
              _push(`<div class="${ssrRenderClass([{ "bg-primary-50": selectedIds.value.includes(alert.id) }, "hover:bg-gray-50 transition-colors"])}" data-v-a62b419d><div class="px-6 py-4" data-v-a62b419d><div class="flex items-start gap-4" data-v-a62b419d><input type="checkbox"${ssrIncludeBooleanAttr(selectedIds.value.includes(alert.id)) ? " checked" : ""} class="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500" data-v-a62b419d><div class="${ssrRenderClass([getAlertSeverityBg(alert.severity), "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"])}" data-v-a62b419d><span class="text-xl" data-v-a62b419d>${ssrInterpolate(getAlertIcon(alert.type))}</span></div><div class="flex-1 min-w-0 cursor-pointer" data-v-a62b419d><div class="flex items-center gap-2 flex-wrap" data-v-a62b419d><h3 class="font-medium text-gray-900" data-v-a62b419d>${ssrInterpolate(alert.title)}</h3><span class="${ssrRenderClass([getSeverityBadgeClass(alert.severity), "px-2 py-0.5 text-xs rounded-full flex-shrink-0"])}" data-v-a62b419d>${ssrInterpolate(getSeverityText(alert.severity))}</span><span class="${ssrRenderClass([getStatusBadgeClass(alert.status), "px-2 py-0.5 text-xs rounded-full flex-shrink-0"])}" data-v-a62b419d>${ssrInterpolate(unref(getStatusText)(alert.status))}</span></div><p class="text-sm text-gray-500 mt-1 line-clamp-2" data-v-a62b419d>${ssrInterpolate(alert.description)}</p><div class="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap" data-v-a62b419d>`);
              if (alert.projectId) {
                _push(`<span data-v-a62b419d> \u9879\u76EE: ${ssrInterpolate(getProjectName(alert.projectId))}</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`<span data-v-a62b419d>\u521B\u5EFA\u65F6\u95F4: ${ssrInterpolate(unref(formatDateTime)(alert.createdAt))}</span>`);
              if (alert.updatedAt !== alert.createdAt) {
                _push(`<span data-v-a62b419d> \u66F4\u65B0\u65F6\u95F4: ${ssrInterpolate(unref(formatDateTime)(alert.updatedAt))}</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div></div><div class="flex items-center gap-2" data-v-a62b419d>`);
              if (alert.status === "open") {
                _push(`<button class="px-3 py-1.5 text-sm text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" data-v-a62b419d> \u5F00\u59CB\u5904\u7406 </button>`);
              } else {
                _push(`<!---->`);
              }
              if (alert.status === "in_progress") {
                _push(`<button class="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors" data-v-a62b419d> \u6807\u8BB0\u89E3\u51B3 </button>`);
              } else {
                _push(`<!---->`);
              }
              if (alert.status === "resolved") {
                _push(`<button class="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" data-v-a62b419d> \u91CD\u65B0\u6253\u5F00 </button>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div></div></div></div>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<div class="px-6 py-12 text-center text-gray-400" data-v-a62b419d><span class="text-4xl mb-3 block" data-v-a62b419d>\u2705</span><p data-v-a62b419d>\u6682\u65E0${ssrInterpolate(unref(getAlertTypeText)(group.type))}\u9884\u8B66</p></div>`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" data-v-a62b419d><div class="divide-y divide-gray-50" data-v-a62b419d><!--[-->`);
        ssrRenderList(filteredAlerts.value, (alert) => {
          _push(`<div class="${ssrRenderClass([{ "bg-primary-50": selectedIds.value.includes(alert.id) }, "hover:bg-gray-50 transition-colors"])}" data-v-a62b419d><div class="px-6 py-4" data-v-a62b419d><div class="flex items-start gap-4" data-v-a62b419d><input type="checkbox"${ssrIncludeBooleanAttr(selectedIds.value.includes(alert.id)) ? " checked" : ""} class="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500" data-v-a62b419d><div class="${ssrRenderClass([getAlertSeverityBg(alert.severity), "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"])}" data-v-a62b419d><span class="text-xl" data-v-a62b419d>${ssrInterpolate(getAlertIcon(alert.type))}</span></div><div class="flex-1 min-w-0 cursor-pointer" data-v-a62b419d><div class="flex items-center gap-2 flex-wrap" data-v-a62b419d><span class="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 flex-shrink-0" data-v-a62b419d>${ssrInterpolate(unref(getAlertTypeText)(alert.type))}</span><h3 class="font-medium text-gray-900" data-v-a62b419d>${ssrInterpolate(alert.title)}</h3><span class="${ssrRenderClass([getSeverityBadgeClass(alert.severity), "px-2 py-0.5 text-xs rounded-full flex-shrink-0"])}" data-v-a62b419d>${ssrInterpolate(getSeverityText(alert.severity))}</span><span class="${ssrRenderClass([getStatusBadgeClass(alert.status), "px-2 py-0.5 text-xs rounded-full flex-shrink-0"])}" data-v-a62b419d>${ssrInterpolate(unref(getStatusText)(alert.status))}</span></div><p class="text-sm text-gray-500 mt-1 line-clamp-2" data-v-a62b419d>${ssrInterpolate(alert.description)}</p><div class="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap" data-v-a62b419d>`);
          if (alert.projectId) {
            _push(`<span data-v-a62b419d> \u9879\u76EE: ${ssrInterpolate(getProjectName(alert.projectId))}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<span data-v-a62b419d>\u521B\u5EFA\u65F6\u95F4: ${ssrInterpolate(unref(formatDateTime)(alert.createdAt))}</span></div></div><div class="flex items-center gap-2" data-v-a62b419d>`);
          if (alert.status === "open") {
            _push(`<button class="px-3 py-1.5 text-sm text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" data-v-a62b419d> \u5F00\u59CB\u5904\u7406 </button>`);
          } else {
            _push(`<!---->`);
          }
          if (alert.status === "in_progress") {
            _push(`<button class="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors" data-v-a62b419d> \u6807\u8BB0\u89E3\u51B3 </button>`);
          } else {
            _push(`<!---->`);
          }
          if (alert.status === "resolved") {
            _push(`<button class="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" data-v-a62b419d> \u91CD\u65B0\u6253\u5F00 </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></div></div>`);
        });
        _push(`<!--]--></div>`);
        if (filteredAlerts.value.length === 0) {
          _push(`<div class="px-6 py-12 text-center text-gray-400" data-v-a62b419d><span class="text-4xl mb-3 block" data-v-a62b419d>\u{1F389}</span><p data-v-a62b419d>\u6682\u65E0\u7B26\u5408\u6761\u4EF6\u7684\u9884\u8B66</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      if (detailModalVisible.value) {
        _push(ssrRenderComponent(_sfc_main$1, {
          alert: selectedAlert.value,
          visible: detailModalVisible.value,
          onClose: ($event) => detailModalVisible.value = false,
          onStatusChange: handleStatusChange
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (batchConfirmVisible.value) {
        _push(`<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-v-a62b419d><div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" data-v-a62b419d><div class="px-6 py-4 border-b border-gray-100" data-v-a62b419d><h3 class="text-lg font-semibold text-gray-900" data-v-a62b419d>\u786E\u8BA4\u6279\u91CF\u64CD\u4F5C</h3></div><div class="px-6 py-4" data-v-a62b419d><p class="text-gray-600 mb-4" data-v-a62b419d> \u786E\u5B9A\u8981\u5C06\u9009\u4E2D\u7684 <span class="font-semibold text-primary-600" data-v-a62b419d>${ssrInterpolate(selectedIds.value.length)}</span> \u6761\u9884\u8B66 \u6807\u8BB0\u4E3A <span class="font-semibold" data-v-a62b419d>${ssrInterpolate(unref(getStatusText)(batchAction.value))}</span> \u5417\uFF1F </p>`);
        if (batchAction.value !== "in_progress") {
          _push(`<div class="space-y-2" data-v-a62b419d><label class="block text-sm font-medium text-gray-700" data-v-a62b419d>\u5904\u7406\u5907\u6CE8</label><textarea rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="\u8BF7\u8F93\u5165\u5904\u7406\u5907\u6CE8..." data-v-a62b419d>${ssrInterpolate(batchNote.value)}</textarea></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3" data-v-a62b419d><button class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" data-v-a62b419d> \u53D6\u6D88 </button><button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors" data-v-a62b419d> \u786E\u8BA4 </button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (confirmDialog.value.visible) {
        _push(`<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-v-a62b419d><div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" data-v-a62b419d><div class="px-6 py-4 border-b border-gray-100" data-v-a62b419d><h3 class="text-lg font-semibold text-gray-900" data-v-a62b419d>${ssrInterpolate(confirmDialog.value.title)}</h3></div><div class="px-6 py-4" data-v-a62b419d><p class="text-gray-600 mb-4" data-v-a62b419d>${ssrInterpolate(confirmDialog.value.message)}</p>`);
        if (confirmDialog.value.showNote) {
          _push(`<div class="space-y-2" data-v-a62b419d><label class="block text-sm font-medium text-gray-700" data-v-a62b419d>\u5904\u7406\u5907\u6CE8</label><textarea rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="\u8BF7\u8F93\u5165\u5904\u7406\u5907\u6CE8..." data-v-a62b419d>${ssrInterpolate(confirmDialog.value.note)}</textarea></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3" data-v-a62b419d><button class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" data-v-a62b419d> \u53D6\u6D88 </button><button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors" data-v-a62b419d> \u786E\u8BA4 </button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (toast.value.visible) {
        _push(`<div class="fixed top-6 right-6 z-50 animate-fade-in" data-v-a62b419d><div class="${ssrRenderClass([{
          "bg-green-500 text-white": toast.value.type === "success",
          "bg-red-500 text-white": toast.value.type === "error",
          "bg-blue-500 text-white": toast.value.type === "info"
        }, "px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"])}" data-v-a62b419d><span data-v-a62b419d>${ssrInterpolate(toast.value.icon)}</span><span data-v-a62b419d>${ssrInterpolate(toast.value.message)}</span></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (showBatchModal.value) {
        _push(`<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-v-a62b419d><div class="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" data-v-a62b419d><div class="px-6 py-4 border-b border-gray-100" data-v-a62b419d><h3 class="text-lg font-semibold text-gray-900" data-v-a62b419d>\u6279\u91CF\u64CD\u4F5C</h3></div><div class="px-6 py-4 space-y-3" data-v-a62b419d><button class="w-full px-4 py-3 text-left rounded-lg hover:bg-yellow-50 transition-colors flex items-center gap-3" data-v-a62b419d><span class="text-xl" data-v-a62b419d>\u23F3</span><div data-v-a62b419d><p class="font-medium text-gray-900" data-v-a62b419d>\u6807\u8BB0\u5904\u7406\u4E2D</p><p class="text-sm text-gray-500" data-v-a62b419d>\u5C06\u9009\u4E2D\u7684\u9884\u8B66\u6807\u8BB0\u4E3A\u5904\u7406\u4E2D\u72B6\u6001</p></div></button><button class="w-full px-4 py-3 text-left rounded-lg hover:bg-green-50 transition-colors flex items-center gap-3" data-v-a62b419d><span class="text-xl" data-v-a62b419d>\u2705</span><div data-v-a62b419d><p class="font-medium text-gray-900" data-v-a62b419d>\u6807\u8BB0\u5DF2\u89E3\u51B3</p><p class="text-sm text-gray-500" data-v-a62b419d>\u5C06\u9009\u4E2D\u7684\u9884\u8B66\u6807\u8BB0\u4E3A\u5DF2\u89E3\u51B3\u72B6\u6001</p></div></button></div><div class="px-6 py-4 border-t border-gray-100" data-v-a62b419d><button class="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" data-v-a62b419d> \u53D6\u6D88 </button></div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/alerts/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-a62b419d"]]);

export { index as default };
//# sourceMappingURL=index-By1kxKQ6.mjs.map
