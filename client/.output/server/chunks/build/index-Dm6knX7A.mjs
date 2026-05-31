import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as useDataStore, b as formatDateTime, f as formatDate } from './data-CvF3Pjf4.mjs';
import { u as useFilterStore } from './filter-GkuypMRw.mjs';
import { j as getTaskTypeText, g as getAlertTypeText, i as getStatusText } from './formatters-B147ECSY.mjs';
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
  __name: "HistoryFilterBar",
  __ssrInlineRender: true,
  props: {
    types: {}
  },
  emits: ["filterChange"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const dataStore = useDataStore();
    const filterStore = useFilterStore();
    const showProjectDropdown = ref(false);
    const showStatusDropdown = ref(false);
    const localSearchText = ref(filterStore.global.searchText);
    ref(null);
    ref(null);
    const projects = computed(() => dataStore.projects);
    const selectedTypes = computed(() => filterStore.global.types);
    const availableStatuses = computed(() => {
      const types = selectedTypes.value;
      const statuses = [];
      if (types.includes("schedule") || types.length === 0) {
        statuses.push(
          { value: "scheduled", label: "\u5DF2\u6392\u671F" },
          { value: "in_progress", label: "\u8FDB\u884C\u4E2D" },
          { value: "completed", label: "\u5DF2\u5B8C\u6210" },
          { value: "cancelled", label: "\u5DF2\u53D6\u6D88" }
        );
      }
      if (types.includes("punch") || types.length === 0) {
        statuses.push(
          { value: "normal", label: "\u6B63\u5E38" },
          { value: "late", label: "\u8FDF\u5230" },
          { value: "early_leave", label: "\u65E9\u9000" },
          { value: "absent", label: "\u7F3A\u52E4" }
        );
      }
      if (types.includes("inspection") || types.length === 0) {
        statuses.push(
          { value: "excellent", label: "\u4F18\u79C0" },
          { value: "good", label: "\u826F\u597D" },
          { value: "pass", label: "\u5408\u683C" },
          { value: "fail", label: "\u4E0D\u5408\u683C" }
        );
      }
      if (types.includes("requisition") || types.length === 0) {
        statuses.push(
          { value: "draft", label: "\u8349\u7A3F" },
          { value: "pending", label: "\u5F85\u5BA1\u6838" },
          { value: "approved", label: "\u5DF2\u901A\u8FC7" },
          { value: "rejected", label: "\u5DF2\u62D2\u7EDD" },
          { value: "delivered", label: "\u5DF2\u53D1\u8D27" },
          { value: "completed", label: "\u5DF2\u5B8C\u6210" }
        );
      }
      if (types.includes("alert") || types.length === 0) {
        statuses.push(
          { value: "open", label: "\u672A\u5904\u7406" },
          { value: "in_progress", label: "\u5904\u7406\u4E2D" },
          { value: "resolved", label: "\u5DF2\u89E3\u51B3" }
        );
      }
      const uniqueStatuses = statuses.filter(
        (status, index2, self) => index2 === self.findIndex((s) => s.value === status.value)
      );
      return uniqueStatuses;
    });
    const hasActiveFilters = computed(() => filterStore.hasActiveFilters);
    const activeFilterTags = computed(() => {
      const tags = [];
      if (filterStore.global.dateRange) {
        tags.push({
          key: "dateRange",
          label: `\u65E5\u671F: ${filterStore.global.dateRange[0]} \u81F3 ${filterStore.global.dateRange[1]}`,
          onRemove: () => filterStore.setDateRange(null)
        });
      }
      filterStore.global.projectIds.forEach((id) => {
        const project = dataStore.getProjectById(id);
        if (project) {
          tags.push({
            key: `project-${id}`,
            label: `\u9879\u76EE: ${project.name}`,
            onRemove: () => filterStore.toggleProjectId(id)
          });
        }
      });
      filterStore.global.statuses.forEach((status) => {
        tags.push({
          key: `status-${status}`,
          label: `\u72B6\u6001: ${getStatusText(status)}`,
          onRemove: () => filterStore.toggleStatus(status)
        });
      });
      filterStore.global.types.forEach((type) => {
        const typeConfig = props.types.find((t) => t.value === type);
        if (typeConfig) {
          tags.push({
            key: `type-${type}`,
            label: `\u7C7B\u578B: ${typeConfig.label}`,
            onRemove: () => filterStore.toggleType(type)
          });
        }
      });
      if (filterStore.global.searchText) {
        tags.push({
          key: "search",
          label: `\u641C\u7D22: ${filterStore.global.searchText}`,
          onRemove: () => {
            localSearchText.value = "";
            filterStore.setSearchText("");
          }
        });
      }
      return tags;
    });
    function getProjectName(projectId) {
      var _a;
      return ((_a = dataStore.getProjectById(projectId)) == null ? void 0 : _a.name) || "\u672A\u77E5\u9879\u76EE";
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4" }, _attrs))}><div class="flex items-center justify-between"><h3 class="font-semibold text-gray-900">\u7B5B\u9009\u6761\u4EF6</h3>`);
      if (hasActiveFilters.value) {
        _push(`<button class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"><span>\u2715</span> \u6E05\u9664\u5168\u90E8 </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="space-y-4"><div><label class="block text-sm font-medium text-gray-700 mb-2">\u8BB0\u5F55\u7C7B\u578B</label><div class="flex flex-wrap gap-2"><!--[-->`);
      ssrRenderList(__props.types, (type) => {
        _push(`<button class="${ssrRenderClass([
          "px-3 py-1.5 text-sm rounded-lg border transition-colors",
          selectedTypes.value.includes(type.value) ? `${type.bgClass} ${type.textClass} ${type.borderClass}` : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
        ])}"><span class="flex items-center gap-1.5"><span>${ssrInterpolate(type.icon)}</span> ${ssrInterpolate(type.label)}</span></button>`);
      });
      _push(`<!--]--></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-2">\u65E5\u671F\u8303\u56F4</label><div class="flex items-center gap-2"><input type="date"${ssrRenderAttr("value", ((_a = unref(filterStore).global.dateRange) == null ? void 0 : _a[0]) || "")} class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><span class="text-gray-400">\u81F3</span><input type="date"${ssrRenderAttr("value", ((_b = unref(filterStore).global.dateRange) == null ? void 0 : _b[1]) || "")} class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></div></div><div><label class="block text-sm font-medium text-gray-700 mb-2">\u5173\u952E\u8BCD\u641C\u7D22</label><div class="relative"><input${ssrRenderAttr("value", localSearchText.value)} type="text" placeholder="\u641C\u7D22\u6807\u9898\u3001\u63CF\u8FF0\u3001\u4EBA\u5458..." class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">\u{1F50D}</span></div></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-2"> \u9879\u76EE\u7B5B\u9009 `);
      if (unref(filterStore).global.projectIds.length > 0) {
        _push(`<span class="text-primary-600 ml-1"> (\u5DF2\u9009 ${ssrInterpolate(unref(filterStore).global.projectIds.length)}) </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</label><div class="relative"><button class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-between">`);
      if (unref(filterStore).global.projectIds.length === 0) {
        _push(`<span class="text-gray-400"> \u8BF7\u9009\u62E9\u9879\u76EE </span>`);
      } else if (unref(filterStore).global.projectIds.length <= 2) {
        _push(`<span>${ssrInterpolate(unref(filterStore).global.projectIds.map((id) => getProjectName(id)).join("\u3001"))}</span>`);
      } else {
        _push(`<span> \u5DF2\u9009\u62E9 ${ssrInterpolate(unref(filterStore).global.projectIds.length)} \u4E2A\u9879\u76EE </span>`);
      }
      _push(`<span class="text-gray-400">\u25BC</span></button>`);
      if (showProjectDropdown.value) {
        _push(`<div class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"><!--[-->`);
        ssrRenderList(projects.value, (project) => {
          _push(`<div class="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"><input type="checkbox"${ssrIncludeBooleanAttr(unref(filterStore).global.projectIds.includes(project.id)) ? " checked" : ""} class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"><span class="text-sm text-gray-700">${ssrInterpolate(project.name)}</span></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div><label class="block text-sm font-medium text-gray-700 mb-2"> \u72B6\u6001\u7B5B\u9009 `);
      if (unref(filterStore).global.statuses.length > 0) {
        _push(`<span class="text-primary-600 ml-1"> (\u5DF2\u9009 ${ssrInterpolate(unref(filterStore).global.statuses.length)}) </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</label><div class="relative"><button class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-between">`);
      if (unref(filterStore).global.statuses.length === 0) {
        _push(`<span class="text-gray-400"> \u8BF7\u9009\u62E9\u72B6\u6001 </span>`);
      } else if (unref(filterStore).global.statuses.length <= 2) {
        _push(`<span>${ssrInterpolate(unref(filterStore).global.statuses.map((s) => unref(getStatusText)(s)).join("\u3001"))}</span>`);
      } else {
        _push(`<span> \u5DF2\u9009\u62E9 ${ssrInterpolate(unref(filterStore).global.statuses.length)} \u4E2A\u72B6\u6001 </span>`);
      }
      _push(`<span class="text-gray-400">\u25BC</span></button>`);
      if (showStatusDropdown.value) {
        _push(`<div class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"><!--[-->`);
        ssrRenderList(availableStatuses.value, (status) => {
          _push(`<div class="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"><input type="checkbox"${ssrIncludeBooleanAttr(unref(filterStore).global.statuses.includes(status.value)) ? " checked" : ""} class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"><span class="text-sm text-gray-700">${ssrInterpolate(status.label)}</span></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div>`);
      if (hasActiveFilters.value) {
        _push(`<div class="flex flex-wrap gap-2 pt-2 border-t border-gray-100"><!--[-->`);
        ssrRenderList(activeFilterTags.value, (tag) => {
          _push(`<div class="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"><span>${ssrInterpolate(tag.label)}</span><button class="hover:text-primary-900">\u2715</button></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/HistoryFilterBar.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const dataStore = useDataStore();
    const filterStore = useFilterStore();
    const recordTypes = [
      { value: "schedule", label: "\u6392\u73ED\u8BB0\u5F55", icon: "\u{1F4C5}", bgClass: "bg-blue-50", textClass: "text-blue-700", borderClass: "border-blue-300" },
      { value: "punch", label: "\u6253\u5361\u8BB0\u5F55", icon: "\u{1F550}", bgClass: "bg-red-50", textClass: "text-red-700", borderClass: "border-red-300" },
      { value: "inspection", label: "\u8D28\u68C0\u8BB0\u5F55", icon: "\u2705", bgClass: "bg-green-50", textClass: "text-green-700", borderClass: "border-green-300" },
      { value: "requisition", label: "\u8017\u6750\u7533\u9886", icon: "\u{1F4E6}", bgClass: "bg-purple-50", textClass: "text-purple-700", borderClass: "border-purple-300" },
      { value: "alert", label: "\u9884\u8B66\u5904\u7406", icon: "\u{1F6A8}", bgClass: "bg-orange-50", textClass: "text-orange-700", borderClass: "border-orange-300" }
    ];
    const detailModal = ref({
      visible: false,
      record: null
    });
    const toast = ref({
      visible: false,
      type: "success",
      message: "",
      icon: ""
    });
    const exportConfirmVisible = ref(false);
    const activeType = computed(() => {
      const types = filterStore.global.types;
      return types.length === 1 ? types[0] : null;
    });
    const activeTypeLabel = computed(() => {
      if (!activeType.value) {
        return "\u5168\u90E8\u7C7B\u578B";
      }
      const typeConfig = recordTypes.find((t) => t.value === activeType.value);
      return (typeConfig == null ? void 0 : typeConfig.label) || "\u5168\u90E8\u7C7B\u578B";
    });
    const allRecords = computed(() => {
      const records = [];
      const types = filterStore.global.types;
      if (types.length === 0 || types.includes("schedule")) {
        dataStore.schedules.forEach((schedule) => {
          const project = dataStore.getProjectById(schedule.projectId);
          const staff = dataStore.getStaffById(schedule.staffId);
          records.push({
            id: `schedule-${schedule.id}`,
            type: "schedule",
            title: `${(staff == null ? void 0 : staff.name) || "\u672A\u77E5"} - ${(project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE"}`,
            description: `${getTaskTypeText(schedule.taskType)} ${schedule.startTime}-${schedule.endTime}`,
            status: schedule.status,
            date: schedule.date,
            projectName: (project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE",
            staffName: staff == null ? void 0 : staff.name,
            detail: {
              taskType: schedule.taskType,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              status: schedule.status,
              note: schedule.note || "-"
            },
            extra: {}
          });
        });
      }
      if (types.length === 0 || types.includes("punch")) {
        dataStore.punchRecords.forEach((punch) => {
          const project = dataStore.getProjectById(punch.projectId);
          const staff = dataStore.getStaffById(punch.staffId);
          records.push({
            id: `punch-${punch.id}`,
            type: "punch",
            title: `${(staff == null ? void 0 : staff.name) || "\u672A\u77E5"} - \u6253\u5361\u8BB0\u5F55`,
            description: punch.status === "normal" ? "\u6B63\u5E38\u6253\u5361" : punch.status === "late" ? "\u8FDF\u5230" : punch.status === "early_leave" ? "\u65E9\u9000" : "\u7F3A\u52E4",
            status: punch.status,
            date: punch.date,
            projectName: (project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE",
            staffName: staff == null ? void 0 : staff.name,
            detail: {
              checkInTime: punch.checkInTime || "-",
              checkOutTime: punch.checkOutTime || "-",
              locationVerified: punch.locationVerified ? "\u662F" : "\u5426",
              status: punch.status,
              note: punch.note || "-"
            },
            extra: {}
          });
        });
      }
      if (types.length === 0 || types.includes("inspection")) {
        dataStore.inspections.forEach((inspection) => {
          const project = dataStore.getProjectById(inspection.projectId);
          const inspector = dataStore.staff.find((s) => s.id === inspection.inspectorId);
          records.push({
            id: `inspection-${inspection.id}`,
            type: "inspection",
            title: `\u8D28\u68C0 - ${(project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE"}`,
            description: `\u8BC4\u5206: ${inspection.score}\u5206 - ${inspection.overallStatus === "excellent" ? "\u4F18\u79C0" : inspection.overallStatus === "good" ? "\u826F\u597D" : inspection.overallStatus === "pass" ? "\u5408\u683C" : "\u4E0D\u5408\u683C"}`,
            status: inspection.overallStatus,
            date: inspection.date,
            projectName: (project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE",
            staffName: inspector == null ? void 0 : inspector.name,
            detail: {
              score: `${inspection.score}\u5206`,
              overallStatus: inspection.overallStatus,
              rectificationRequired: inspection.rectificationRequired ? "\u9700\u8981" : "\u4E0D\u9700\u8981",
              rectificationDeadline: inspection.rectificationDeadline || "-",
              note: inspection.note || "-"
            },
            extra: {
              itemCount: `${inspection.items.length}\u9879\u68C0\u67E5\u9879`
            }
          });
        });
      }
      if (types.length === 0 || types.includes("requisition")) {
        dataStore.requisitions.forEach((requisition) => {
          var _a;
          const project = dataStore.getProjectById(requisition.projectId);
          const applicant = dataStore.getStaffById(requisition.applicantId);
          records.push({
            id: `requisition-${requisition.id}`,
            type: "requisition",
            title: `\u8017\u6750\u7533\u9886 - ${(project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE"}`,
            description: `${requisition.items.length}\u9879\u8017\u6750`,
            status: requisition.status,
            date: requisition.applicationDate,
            projectName: (project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE",
            staffName: applicant == null ? void 0 : applicant.name,
            detail: {
              applicationDate: requisition.applicationDate,
              status: requisition.status,
              itemsCount: `${requisition.items.length}\u9879`,
              approver: requisition.approverId ? ((_a = dataStore.getStaffById(requisition.approverId)) == null ? void 0 : _a.name) || "\u672A\u77E5" : "\u672A\u5BA1\u6279",
              approvalDate: requisition.approvalDate || "-",
              deliveryDate: requisition.deliveryDate || "-",
              rejectReason: requisition.rejectReason || "-"
            },
            extra: {}
          });
        });
      }
      if (types.length === 0 || types.includes("alert")) {
        dataStore.alerts.forEach((alert) => {
          const project = alert.projectId ? dataStore.getProjectById(alert.projectId) : null;
          records.push({
            id: `alert-${alert.id}`,
            type: "alert",
            title: alert.title,
            description: alert.description,
            status: alert.status,
            date: formatDate(alert.createdAt),
            projectName: (project == null ? void 0 : project.name) || "\u65E0",
            detail: {
              alertType: getAlertTypeText(alert.type),
              severity: alert.severity === "critical" ? "\u7D27\u6025" : alert.severity === "warning" ? "\u8B66\u544A" : "\u63D0\u793A",
              status: alert.status,
              createdAt: formatDateTime(alert.createdAt),
              updatedAt: formatDateTime(alert.updatedAt),
              resolvedAt: alert.resolvedAt ? formatDateTime(alert.resolvedAt) : "-",
              resolutionNote: alert.resolutionNote || "-"
            },
            extra: {
              historyCount: `${alert.history.length}\u6761\u5904\u7406\u8BB0\u5F55`
            }
          });
        });
      }
      return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    const filteredRecords = computed(() => {
      return allRecords.value.filter((record) => {
        if (filterStore.global.dateRange) {
          const [start, end] = filterStore.global.dateRange;
          if (record.date < start || record.date > end) {
            return false;
          }
        }
        if (filterStore.global.projectIds.length > 0) {
          const project = dataStore.projects.find((p) => p.name === record.projectName);
          if (!project || !filterStore.global.projectIds.includes(project.id)) {
            return false;
          }
        }
        if (filterStore.global.statuses.length > 0) {
          if (!filterStore.global.statuses.includes(record.status)) {
            return false;
          }
        }
        if (filterStore.global.searchText) {
          const search = filterStore.global.searchText.toLowerCase();
          const searchStr = `${record.title} ${record.description} ${record.projectName} ${record.staffName || ""}`;
          if (!searchStr.toLowerCase().includes(search)) {
            return false;
          }
        }
        return true;
      });
    });
    function handleFilterChange() {
    }
    function getRecordIcon(type) {
      const iconMap = {
        schedule: "\u{1F4C5}",
        punch: "\u{1F550}",
        inspection: "\u2705",
        requisition: "\u{1F4E6}",
        alert: "\u{1F6A8}"
      };
      return iconMap[type] || "\u{1F4C4}";
    }
    function getRecordTypeLabel(type) {
      const labelMap = {
        schedule: "\u6392\u73ED\u8BB0\u5F55",
        punch: "\u6253\u5361\u8BB0\u5F55",
        inspection: "\u8D28\u68C0\u8BB0\u5F55",
        requisition: "\u8017\u6750\u7533\u9886",
        alert: "\u9884\u8B66\u5904\u7406"
      };
      return labelMap[type] || "\u5176\u4ED6";
    }
    function getRecordTypeBg(type) {
      const bgMap = {
        schedule: "bg-blue-100",
        punch: "bg-red-100",
        inspection: "bg-green-100",
        requisition: "bg-purple-100",
        alert: "bg-orange-100"
      };
      return bgMap[type] || "bg-gray-100";
    }
    function getStatusBadgeClass(status) {
      const classMap = {
        scheduled: "bg-blue-100 text-blue-700",
        in_progress: "bg-yellow-100 text-yellow-700",
        completed: "bg-green-100 text-green-700",
        cancelled: "bg-gray-100 text-gray-700",
        normal: "bg-green-100 text-green-700",
        late: "bg-yellow-100 text-yellow-700",
        early_leave: "bg-yellow-100 text-yellow-700",
        absent: "bg-red-100 text-red-700",
        excellent: "bg-green-100 text-green-700",
        good: "bg-blue-100 text-blue-700",
        pass: "bg-green-100 text-green-700",
        fail: "bg-red-100 text-red-700",
        draft: "bg-gray-100 text-gray-700",
        pending: "bg-yellow-100 text-yellow-700",
        approved: "bg-green-100 text-green-700",
        rejected: "bg-red-100 text-red-700",
        delivered: "bg-blue-100 text-blue-700",
        open: "bg-red-100 text-red-700",
        resolved: "bg-green-100 text-green-700"
      };
      return classMap[status] || "bg-gray-100 text-gray-700";
    }
    function getDetailLabel(key) {
      const labelMap = {
        taskType: "\u4EFB\u52A1\u7C7B\u578B",
        startTime: "\u5F00\u59CB\u65F6\u95F4",
        endTime: "\u7ED3\u675F\u65F6\u95F4",
        checkInTime: "\u6253\u5361\u65F6\u95F4",
        checkOutTime: "\u7B7E\u9000\u65F6\u95F4",
        locationVerified: "\u4F4D\u7F6E\u9A8C\u8BC1",
        score: "\u8BC4\u5206",
        overallStatus: "\u6574\u4F53\u8BC4\u4EF7",
        rectificationRequired: "\u9700\u8981\u6574\u6539",
        rectificationDeadline: "\u6574\u6539\u622A\u6B62",
        applicationDate: "\u7533\u8BF7\u65E5\u671F",
        itemsCount: "\u9879\u6570",
        approver: "\u5BA1\u6279\u4EBA",
        approvalDate: "\u5BA1\u6279\u65E5\u671F",
        deliveryDate: "\u53D1\u8D27\u65E5\u671F",
        rejectReason: "\u62D2\u7EDD\u539F\u56E0",
        alertType: "\u9884\u8B66\u7C7B\u578B",
        severity: "\u4E25\u91CD\u7A0B\u5EA6",
        createdAt: "\u521B\u5EFA\u65F6\u95F4",
        updatedAt: "\u66F4\u65B0\u65F6\u95F4",
        resolvedAt: "\u89E3\u51B3\u65F6\u95F4",
        resolutionNote: "\u5904\u7406\u7ED3\u679C",
        itemCount: "\u68C0\u67E5\u9879",
        historyCount: "\u5904\u7406\u8BB0\u5F55",
        status: "\u72B6\u6001",
        note: "\u5907\u6CE8"
      };
      return labelMap[key] || key;
    }
    function formatDetailValue(key, value) {
      if (key === "taskType" && typeof value === "string") {
        return getTaskTypeText(value);
      }
      if (key === "overallStatus" && typeof value === "string") {
        const statusMap = {
          excellent: "\u4F18\u79C0",
          good: "\u826F\u597D",
          pass: "\u5408\u683C",
          fail: "\u4E0D\u5408\u683C"
        };
        return statusMap[value] || value;
      }
      if (key === "severity" && typeof value === "string") {
        const severityMap = {
          critical: "\u7D27\u6025",
          warning: "\u8B66\u544A",
          info: "\u63D0\u793A"
        };
        return severityMap[value] || value;
      }
      return String(value);
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-6" }, _attrs))} data-v-ddde57a3><div class="flex items-center justify-between" data-v-ddde57a3><div data-v-ddde57a3><h1 class="text-2xl font-bold text-gray-900" data-v-ddde57a3>\u5386\u53F2\u8BB0\u5F55\u67E5\u8BE2</h1><p class="text-gray-500 mt-1" data-v-ddde57a3>\u7EDF\u4E00\u67E5\u8BE2\u5404\u7C7B\u4E1A\u52A1\u8BB0\u5F55</p></div>`);
      if (filteredRecords.value.length > 0) {
        _push(`<button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex items-center gap-2" data-v-ddde57a3><span data-v-ddde57a3>\u{1F4E4}</span> \u5BFC\u51FA\u6570\u636E </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        types: recordTypes,
        onFilterChange: handleFilterChange
      }, null, _parent));
      _push(`<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" data-v-ddde57a3><div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between" data-v-ddde57a3><div class="flex items-center gap-4" data-v-ddde57a3><span class="text-sm text-gray-500" data-v-ddde57a3> \u5171 <span class="font-semibold text-gray-900" data-v-ddde57a3>${ssrInterpolate(filteredRecords.value.length)}</span> \u6761\u8BB0\u5F55 </span>`);
      if (activeType.value) {
        _push(`<div class="text-sm text-gray-500" data-v-ddde57a3> \u5F53\u524D\u663E\u793A: <span class="font-medium text-primary-600" data-v-ddde57a3>${ssrInterpolate(activeTypeLabel.value)}</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="divide-y divide-gray-50" data-v-ddde57a3><!--[-->`);
      ssrRenderList(filteredRecords.value, (record) => {
        _push(`<div class="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer" data-v-ddde57a3><div class="flex items-start gap-4" data-v-ddde57a3><div class="${ssrRenderClass([getRecordTypeBg(record.type), "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"])}" data-v-ddde57a3><span class="text-2xl" data-v-ddde57a3>${ssrInterpolate(getRecordIcon(record.type))}</span></div><div class="flex-1 min-w-0" data-v-ddde57a3><div class="flex items-center gap-2 flex-wrap" data-v-ddde57a3><span class="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 flex-shrink-0" data-v-ddde57a3>${ssrInterpolate(getRecordTypeLabel(record.type))}</span><h3 class="font-medium text-gray-900" data-v-ddde57a3>${ssrInterpolate(record.title)}</h3><span class="${ssrRenderClass([getStatusBadgeClass(record.status), "px-2 py-0.5 text-xs rounded-full flex-shrink-0"])}" data-v-ddde57a3>${ssrInterpolate(unref(getStatusText)(record.status))}</span></div><p class="text-sm text-gray-500 mt-1" data-v-ddde57a3>${ssrInterpolate(record.description)}</p><div class="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap" data-v-ddde57a3>`);
        if (record.projectName) {
          _push(`<span data-v-ddde57a3> \u9879\u76EE: ${ssrInterpolate(record.projectName)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (record.staffName) {
          _push(`<span data-v-ddde57a3> \u4EBA\u5458: ${ssrInterpolate(record.staffName)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<span data-v-ddde57a3> \u65F6\u95F4: ${ssrInterpolate(record.date)}</span></div></div><div class="flex items-center gap-2" data-v-ddde57a3><span class="text-gray-300" data-v-ddde57a3>\u2192</span></div></div></div>`);
      });
      _push(`<!--]--></div>`);
      if (filteredRecords.value.length === 0) {
        _push(`<div class="px-6 py-12 text-center text-gray-400" data-v-ddde57a3><span class="text-4xl mb-3 block" data-v-ddde57a3>\u{1F4ED}</span><p data-v-ddde57a3>\u6682\u65E0\u7B26\u5408\u6761\u4EF6\u7684\u8BB0\u5F55</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (detailModal.value.visible) {
        _push(`<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-v-ddde57a3><div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" data-v-ddde57a3><div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between" data-v-ddde57a3><div class="flex items-center gap-3" data-v-ddde57a3><div class="${ssrRenderClass([getRecordTypeBg(((_a = detailModal.value.record) == null ? void 0 : _a.type) || ""), "w-10 h-10 rounded-lg flex items-center justify-center"])}" data-v-ddde57a3><span class="text-xl" data-v-ddde57a3>${ssrInterpolate(getRecordIcon(((_b = detailModal.value.record) == null ? void 0 : _b.type) || ""))}</span></div><div data-v-ddde57a3><h3 class="text-lg font-semibold text-gray-900" data-v-ddde57a3>${ssrInterpolate((_c = detailModal.value.record) == null ? void 0 : _c.title)}</h3><div class="flex items-center gap-2 mt-1" data-v-ddde57a3><span class="text-xs text-gray-500" data-v-ddde57a3>${ssrInterpolate(getRecordTypeLabel(((_d = detailModal.value.record) == null ? void 0 : _d.type) || ""))}</span><span class="${ssrRenderClass([getStatusBadgeClass(((_e = detailModal.value.record) == null ? void 0 : _e.status) || ""), "px-2 py-0.5 text-xs rounded-full"])}" data-v-ddde57a3>${ssrInterpolate(unref(getStatusText)(((_f = detailModal.value.record) == null ? void 0 : _f.status) || ""))}</span></div></div></div><button class="p-2 hover:bg-gray-100 rounded-lg transition-colors" data-v-ddde57a3><span class="text-xl" data-v-ddde57a3>\u2715</span></button></div><div class="flex-1 overflow-y-auto p-6 space-y-6" data-v-ddde57a3><div class="bg-gray-50 rounded-xl p-5" data-v-ddde57a3><h4 class="font-medium text-gray-900 mb-3" data-v-ddde57a3>\u8BB0\u5F55\u8BE6\u60C5</h4><div class="space-y-3" data-v-ddde57a3><!--[-->`);
        ssrRenderList((_g = detailModal.value.record) == null ? void 0 : _g.detail, (value, key) => {
          _push(`<div class="flex items-start gap-2" data-v-ddde57a3><span class="text-gray-500 text-sm w-32 flex-shrink-0" data-v-ddde57a3>${ssrInterpolate(getDetailLabel(key))}:</span><span class="text-gray-900 text-sm" data-v-ddde57a3>${ssrInterpolate(formatDetailValue(key, value))}</span></div>`);
        });
        _push(`<!--]--></div></div>`);
        if (((_h = detailModal.value.record) == null ? void 0 : _h.extra) && Object.keys(detailModal.value.record.extra).length > 0) {
          _push(`<div class="bg-white border border-gray-200 rounded-xl p-5" data-v-ddde57a3><h4 class="font-medium text-gray-900 mb-3" data-v-ddde57a3>\u6269\u5C55\u4FE1\u606F</h4><div class="space-y-2" data-v-ddde57a3><!--[-->`);
          ssrRenderList(detailModal.value.record.extra, (value, key) => {
            _push(`<div class="flex items-start gap-2" data-v-ddde57a3><span class="text-gray-500 text-sm w-32 flex-shrink-0" data-v-ddde57a3>${ssrInterpolate(getDetailLabel(key))}:</span><span class="text-gray-900 text-sm" data-v-ddde57a3>${ssrInterpolate(formatDetailValue(key, value))}</span></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="px-6 py-4 border-t border-gray-100" data-v-ddde57a3><button class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" data-v-ddde57a3> \u5173\u95ED </button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (toast.value.visible) {
        _push(`<div class="fixed top-6 right-6 z-50 animate-fade-in" data-v-ddde57a3><div class="${ssrRenderClass([{
          "bg-green-500 text-white": toast.value.type === "success",
          "bg-red-500 text-white": toast.value.type === "error",
          "bg-blue-500 text-white": toast.value.type === "info"
        }, "px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"])}" data-v-ddde57a3><span data-v-ddde57a3>${ssrInterpolate(toast.value.icon)}</span><span data-v-ddde57a3>${ssrInterpolate(toast.value.message)}</span></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (exportConfirmVisible.value) {
        _push(`<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-v-ddde57a3><div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" data-v-ddde57a3><div class="px-6 py-4 border-b border-gray-100" data-v-ddde57a3><h3 class="text-lg font-semibold text-gray-900" data-v-ddde57a3>\u786E\u8BA4\u5BFC\u51FA</h3></div><div class="px-6 py-4" data-v-ddde57a3><p class="text-gray-600" data-v-ddde57a3> \u786E\u5B9A\u8981\u5BFC\u51FA\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u7684 <span class="font-semibold text-primary-600" data-v-ddde57a3>${ssrInterpolate(filteredRecords.value.length)}</span> \u6761\u8BB0\u5F55\u5417\uFF1F </p><p class="text-sm text-gray-500 mt-2" data-v-ddde57a3>\u5C06\u5BFC\u51FA\u4E3A CSV \u683C\u5F0F\u6587\u4EF6\uFF08\u6A21\u62DF\uFF09</p></div><div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3" data-v-ddde57a3><button class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" data-v-ddde57a3> \u53D6\u6D88 </button><button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors" data-v-ddde57a3> \u786E\u8BA4\u5BFC\u51FA </button></div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/history/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-ddde57a3"]]);

export { index as default };
//# sourceMappingURL=index-Dm6knX7A.mjs.map
