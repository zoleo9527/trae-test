import { i as getStatusText, g as getAlertTypeText } from './formatters-B147ECSY.mjs';
import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrInterpolate, ssrRenderClass, ssrRenderComponent } from 'vue/server-renderer';
import { u as useDataStore, f as formatDate, a as addDays } from './data-CvF3Pjf4.mjs';
import { u as useAuthStore } from './auth-BO_zE_6L.mjs';
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
import 'dayjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "PunchDetailModal",
  __ssrInlineRender: true,
  props: {
    visible: { type: Boolean },
    punch: {}
  },
  emits: ["close", "updated"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const dataStore = useDataStore();
    const authStore = useAuthStore();
    const showSupplementForm = ref(false);
    const submitting = ref(false);
    const supplementForm = ref({
      checkInTime: "",
      checkOutTime: "",
      note: ""
    });
    const canSupplement = computed(() => {
      var _a;
      return authStore.isProjectManager && ((_a = props.punch) == null ? void 0 : _a.status) !== "normal";
    });
    const staffName = computed(() => {
      if (!props.punch) return "";
      const staff = dataStore.getStaffById(props.punch.staffId);
      return (staff == null ? void 0 : staff.name) || "\u672A\u77E5\u5458\u5DE5";
    });
    const projectName = computed(() => {
      if (!props.punch) return "";
      const project = dataStore.getProjectById(props.punch.projectId);
      return (project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE";
    });
    const schedule = computed(() => {
      if (!props.punch) return null;
      return dataStore.schedules.find((s) => s.id === props.punch.scheduleId);
    });
    const relatedAlert = computed(() => {
      if (!props.punch) return null;
      return dataStore.alerts.find(
        (a) => a.relatedId === props.punch.id && a.relatedType === "punch"
      );
    });
    const statusClass = computed(() => {
      if (!props.punch) return "";
      const status = props.punch.status;
      const classes = {
        normal: "bg-green-100 text-green-700",
        late: "bg-yellow-100 text-yellow-700",
        early_leave: "bg-yellow-100 text-yellow-700",
        absent: "bg-red-100 text-red-700",
        pending: "bg-gray-100 text-gray-700"
      };
      return classes[status] || "bg-gray-100 text-gray-700";
    });
    const getSeverityText = (severity) => {
      const texts = {
        info: "\u63D0\u793A",
        warning: "\u8B66\u544A",
        critical: "\u4E25\u91CD"
      };
      return texts[severity] || severity;
    };
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" }, _attrs))}><div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"><div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between"><h3 class="text-lg font-semibold text-gray-900">\u6253\u5361\u8BE6\u60C5</h3><button class="p-1 hover:bg-gray-200 rounded-lg transition-colors"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`);
      if (__props.punch) {
        _push(`<div class="flex-1 overflow-y-auto p-6"><div class="flex items-start justify-between mb-6"><div class="flex items-center gap-3"><div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center"><span class="text-primary-600 font-semibold">${ssrInterpolate(staffName.value.charAt(0))}</span></div><div><h4 class="font-medium text-gray-900">${ssrInterpolate(staffName.value)}</h4><p class="text-sm text-gray-500">${ssrInterpolate(projectName.value)}</p></div></div><span class="${ssrRenderClass([
          "px-3 py-1 text-sm font-medium rounded-full",
          statusClass.value
        ])}">${ssrInterpolate(("getStatusText" in _ctx ? _ctx.getStatusText : unref(getStatusText))(__props.punch.status))}</span></div><div class="grid grid-cols-2 gap-4 mb-6"><div class="bg-gray-50 rounded-lg p-4"><p class="text-sm text-gray-500 mb-1">\u4E0A\u73ED\u6253\u5361</p><p class="text-xl font-semibold text-gray-900">${ssrInterpolate(__props.punch.checkInTime || "--:--")}</p><p class="text-xs text-gray-400 mt-1">\u5E94\u5230: ${ssrInterpolate(((_a = schedule.value) == null ? void 0 : _a.startTime) || "--:--")}</p></div><div class="bg-gray-50 rounded-lg p-4"><p class="text-sm text-gray-500 mb-1">\u4E0B\u73ED\u6253\u5361</p><p class="text-xl font-semibold text-gray-900">${ssrInterpolate(__props.punch.checkOutTime || "--:--")}</p><p class="text-xs text-gray-400 mt-1">\u5E94\u9000: ${ssrInterpolate(((_b = schedule.value) == null ? void 0 : _b.endTime) || "--:--")}</p></div></div><div class="space-y-4 mb-6"><div class="flex items-center gap-4"><div class="flex items-center gap-2"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-sm text-gray-600">${ssrInterpolate(__props.punch.date)}</span></div><div class="flex items-center gap-2"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg><span class="${ssrRenderClass([
          "text-sm",
          __props.punch.locationVerified ? "text-green-600" : "text-red-600"
        ])}">${ssrInterpolate(__props.punch.locationVerified ? "\u4F4D\u7F6E\u9A8C\u8BC1\u901A\u8FC7" : "\u4F4D\u7F6E\u9A8C\u8BC1\u5931\u8D25")}</span></div></div>`);
        if (__props.punch.note) {
          _push(`<div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"><p class="text-sm text-yellow-800">${ssrInterpolate(__props.punch.note)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (__props.punch.checkInPhoto || __props.punch.checkOutPhoto) {
          _push(`<div class="mb-6"><h5 class="text-sm font-medium text-gray-700 mb-3">\u6253\u5361\u7167\u7247</h5><div class="grid grid-cols-2 gap-4">`);
          if (__props.punch.checkInPhoto) {
            _push(`<div class="relative"><p class="text-xs text-gray-500 mb-1">\u4E0A\u73ED\u6253\u5361\u7167\u7247</p><img${ssrRenderAttr("src", __props.punch.checkInPhoto)} alt="\u4E0A\u73ED\u6253\u5361\u7167\u7247" class="w-full h-32 object-cover rounded-lg border border-gray-200"></div>`);
          } else {
            _push(`<!---->`);
          }
          if (__props.punch.checkOutPhoto) {
            _push(`<div class="relative"><p class="text-xs text-gray-500 mb-1">\u4E0B\u73ED\u6253\u5361\u7167\u7247</p><img${ssrRenderAttr("src", __props.punch.checkOutPhoto)} alt="\u4E0B\u73ED\u6253\u5361\u7167\u7247" class="w-full h-32 object-cover rounded-lg border border-gray-200"></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (relatedAlert.value) {
          _push(`<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><div class="flex items-start gap-3"><svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><div><p class="text-sm font-medium text-red-800">\u5173\u8054\u9884\u8B66</p><p class="text-sm text-red-600">${ssrInterpolate(relatedAlert.value.title)}</p><p class="text-xs text-red-500 mt-1">${ssrInterpolate(("getAlertTypeText" in _ctx ? _ctx.getAlertTypeText : unref(getAlertTypeText))(relatedAlert.value.type))} \xB7 ${ssrInterpolate(getSeverityText(relatedAlert.value.severity))}</p></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (canSupplement.value && !showSupplementForm.value) {
          _push(`<div class="border-t border-gray-200 pt-4"><button class="w-full py-2 px-4 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"> \u4EBA\u5DE5\u8865\u5361 </button></div>`);
        } else {
          _push(`<!---->`);
        }
        if (showSupplementForm.value) {
          _push(`<div class="border-t border-gray-200 pt-4"><h5 class="text-sm font-medium text-gray-700 mb-3">\u4EBA\u5DE5\u8865\u5361</h5><div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div><label class="block text-xs text-gray-500 mb-1">\u4E0A\u73ED\u6253\u5361\u65F6\u95F4</label><input${ssrRenderAttr("value", supplementForm.value.checkInTime)} type="time" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"></div><div><label class="block text-xs text-gray-500 mb-1">\u4E0B\u73ED\u6253\u5361\u65F6\u95F4</label><input${ssrRenderAttr("value", supplementForm.value.checkOutTime)} type="time" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"></div></div><div><label class="block text-xs text-gray-500 mb-1">\u8865\u5361\u8BF4\u660E</label><textarea rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" placeholder="\u8BF7\u586B\u5199\u8865\u5361\u539F\u56E0...">${ssrInterpolate(supplementForm.value.note)}</textarea></div><div class="flex gap-2"><button class="flex-1 py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"> \u53D6\u6D88 </button><button${ssrIncludeBooleanAttr(submitting.value) ? " disabled" : ""} class="flex-1 py-2 px-4 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50">${ssrInterpolate(submitting.value ? "\u63D0\u4EA4\u4E2D..." : "\u786E\u8BA4\u8865\u5361")}</button></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PunchDetailModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const pageSize = 20;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const dataStore = useDataStore();
    useAuthStore();
    const today = formatDate(/* @__PURE__ */ new Date());
    const thirtyDaysAgo = addDays(today, -30);
    const filterStartDate = ref(thirtyDaysAgo);
    const filterEndDate = ref(today);
    const filterProjectId = ref("");
    const filterStaffId = ref("");
    const filterStatus = ref("");
    const currentPage = ref(1);
    const detailModalVisible = ref(false);
    const selectedRecord = ref(null);
    const projects = computed(() => dataStore.projects);
    const staff = computed(() => dataStore.staff);
    const allRecords = computed(() => {
      return [...dataStore.punchRecords].sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return (b.checkInTime || "").localeCompare(a.checkInTime || "");
      });
    });
    const filteredRecords = computed(() => {
      let records = allRecords.value;
      if (filterStartDate.value) {
        records = records.filter((r) => r.date >= filterStartDate.value);
      }
      if (filterEndDate.value) {
        records = records.filter((r) => r.date <= filterEndDate.value);
      }
      if (filterProjectId.value) {
        records = records.filter((r) => r.projectId === filterProjectId.value);
      }
      if (filterStaffId.value) {
        records = records.filter((r) => r.staffId === filterStaffId.value);
      }
      if (filterStatus.value) {
        records = records.filter((r) => r.status === filterStatus.value);
      }
      const start = (currentPage.value - 1) * pageSize;
      return records.slice(start, start + pageSize);
    });
    const totalRecords = computed(() => {
      let records = allRecords.value;
      if (filterStartDate.value) {
        records = records.filter((r) => r.date >= filterStartDate.value);
      }
      if (filterEndDate.value) {
        records = records.filter((r) => r.date <= filterEndDate.value);
      }
      if (filterProjectId.value) {
        records = records.filter((r) => r.projectId === filterProjectId.value);
      }
      if (filterStaffId.value) {
        records = records.filter((r) => r.staffId === filterStaffId.value);
      }
      if (filterStatus.value) {
        records = records.filter((r) => r.status === filterStatus.value);
      }
      return records.length;
    });
    const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize));
    const visiblePages = computed(() => {
      const pages = [];
      const total = totalPages.value;
      const current = currentPage.value;
      let start = Math.max(1, current - 2);
      let end = Math.min(total, current + 2);
      if (end - start < 4) {
        if (start === 1) {
          end = Math.min(5, total);
        } else {
          start = Math.max(1, total - 4);
        }
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    });
    const stats = computed(() => {
      const records = allRecords.value.filter((r) => {
        if (filterStartDate.value && r.date < filterStartDate.value) return false;
        if (filterEndDate.value && r.date > filterEndDate.value) return false;
        if (filterProjectId.value && r.projectId !== filterProjectId.value) return false;
        if (filterStaffId.value && r.staffId !== filterStaffId.value) return false;
        return true;
      });
      return {
        normal: records.filter((r) => r.status === "normal").length,
        late: records.filter((r) => r.status === "late").length,
        early_leave: records.filter((r) => r.status === "early_leave").length,
        absent: records.filter((r) => r.status === "absent").length,
        pending: records.filter((r) => r.status === "pending").length
      };
    });
    const hasActiveFilters = computed(() => {
      return filterStartDate.value !== thirtyDaysAgo || filterEndDate.value !== today || filterProjectId.value !== "" || filterStaffId.value !== "" || filterStatus.value !== "";
    });
    function getStaffName(staffId) {
      const s = staff.value.find((s2) => s2.id === staffId);
      return (s == null ? void 0 : s.name) || "\u672A\u77E5";
    }
    function getStaffPosition(staffId) {
      const s = staff.value.find((s2) => s2.id === staffId);
      return (s == null ? void 0 : s.position) === "supervisor" ? "\u4E3B\u7BA1" : "\u4FDD\u6D01\u5458";
    }
    function getProjectName(projectId) {
      const p = projects.value.find((p2) => p2.id === projectId);
      return (p == null ? void 0 : p.name) || "\u672A\u77E5\u9879\u76EE";
    }
    function getScheduleStartTime(scheduleId) {
      const s = dataStore.schedules.find((s2) => s2.id === scheduleId);
      return (s == null ? void 0 : s.startTime) || "--:--";
    }
    function getScheduleEndTime(scheduleId) {
      const s = dataStore.schedules.find((s2) => s2.id === scheduleId);
      return (s == null ? void 0 : s.endTime) || "--:--";
    }
    function getWeekDay(dateStr) {
      const days = ["\u5468\u65E5", "\u5468\u4E00", "\u5468\u4E8C", "\u5468\u4E09", "\u5468\u56DB", "\u5468\u4E94", "\u5468\u516D"];
      const date = new Date(dateStr);
      return days[date.getDay()];
    }
    function getRowHighlightClass(status) {
      if (status === "absent") return "bg-red-50 hover:bg-red-100";
      if (status === "late" || status === "early_leave") return "bg-yellow-50 hover:bg-yellow-100";
      return "hover:bg-gray-50";
    }
    function getStatusClass(status) {
      const classes = {
        normal: "bg-green-100 text-green-700",
        late: "bg-yellow-100 text-yellow-700",
        early_leave: "bg-yellow-100 text-yellow-700",
        absent: "bg-red-100 text-red-700",
        pending: "bg-gray-100 text-gray-700"
      };
      return classes[status] || "bg-gray-100 text-gray-700";
    }
    function getCheckInTimeClass(record) {
      if (!record.checkInTime) return "text-gray-400";
      const schedule = dataStore.schedules.find((s) => s.id === record.scheduleId);
      if (!schedule) return "text-gray-900";
      if (record.checkInTime > schedule.startTime) return "text-yellow-600";
      return "text-gray-900";
    }
    function getCheckOutTimeClass(record) {
      if (!record.checkOutTime) return "text-gray-400";
      const schedule = dataStore.schedules.find((s) => s.id === record.scheduleId);
      if (!schedule) return "text-gray-900";
      if (record.checkOutTime < schedule.endTime) return "text-yellow-600";
      return "text-gray-900";
    }
    function hasAlert(punchId) {
      return dataStore.alerts.some(
        (a) => a.relatedId === punchId && a.relatedType === "punch" && a.status !== "resolved"
      );
    }
    function handleRecordUpdated() {
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PunchDetailModal = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-50" }, _attrs))}><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><div class="mb-6"><h1 class="text-2xl font-bold text-gray-900">\u6253\u5361\u7BA1\u7406</h1><p class="text-gray-500 mt-1">\u67E5\u770B\u548C\u7BA1\u7406\u5458\u5DE5\u6253\u5361\u8BB0\u5F55\uFF0C\u5904\u7406\u5F02\u5E38\u6253\u5361</p></div><div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6"><div class="px-4 py-3 border-b border-gray-200"><div class="flex flex-wrap items-center gap-4"><div class="flex items-center gap-2"><label class="text-sm font-medium text-gray-700">\u65E5\u671F\u8303\u56F4:</label><input${ssrRenderAttr("value", filterStartDate.value)} type="date" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"><span class="text-gray-500">\u81F3</span><input${ssrRenderAttr("value", filterEndDate.value)} type="date" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"></div><div class="flex items-center gap-2"><label class="text-sm font-medium text-gray-700">\u9879\u76EE:</label><select class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filterProjectId.value) ? ssrLooseContain(filterProjectId.value, "") : ssrLooseEqual(filterProjectId.value, "")) ? " selected" : ""}>\u5168\u90E8\u9879\u76EE</option><!--[-->`);
      ssrRenderList(projects.value, (project) => {
        _push(`<option${ssrRenderAttr("value", project.id)}${ssrIncludeBooleanAttr(Array.isArray(filterProjectId.value) ? ssrLooseContain(filterProjectId.value, project.id) : ssrLooseEqual(filterProjectId.value, project.id)) ? " selected" : ""}>${ssrInterpolate(project.name)}</option>`);
      });
      _push(`<!--]--></select></div><div class="flex items-center gap-2"><label class="text-sm font-medium text-gray-700">\u5458\u5DE5:</label><select class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filterStaffId.value) ? ssrLooseContain(filterStaffId.value, "") : ssrLooseEqual(filterStaffId.value, "")) ? " selected" : ""}>\u5168\u90E8\u5458\u5DE5</option><!--[-->`);
      ssrRenderList(staff.value, (staff2) => {
        _push(`<option${ssrRenderAttr("value", staff2.id)}${ssrIncludeBooleanAttr(Array.isArray(filterStaffId.value) ? ssrLooseContain(filterStaffId.value, staff2.id) : ssrLooseEqual(filterStaffId.value, staff2.id)) ? " selected" : ""}>${ssrInterpolate(staff2.name)}</option>`);
      });
      _push(`<!--]--></select></div><div class="flex items-center gap-2"><label class="text-sm font-medium text-gray-700">\u72B6\u6001:</label><select class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filterStatus.value) ? ssrLooseContain(filterStatus.value, "") : ssrLooseEqual(filterStatus.value, "")) ? " selected" : ""}>\u5168\u90E8\u72B6\u6001</option><option value="normal"${ssrIncludeBooleanAttr(Array.isArray(filterStatus.value) ? ssrLooseContain(filterStatus.value, "normal") : ssrLooseEqual(filterStatus.value, "normal")) ? " selected" : ""}>\u6B63\u5E38</option><option value="late"${ssrIncludeBooleanAttr(Array.isArray(filterStatus.value) ? ssrLooseContain(filterStatus.value, "late") : ssrLooseEqual(filterStatus.value, "late")) ? " selected" : ""}>\u8FDF\u5230</option><option value="early_leave"${ssrIncludeBooleanAttr(Array.isArray(filterStatus.value) ? ssrLooseContain(filterStatus.value, "early_leave") : ssrLooseEqual(filterStatus.value, "early_leave")) ? " selected" : ""}>\u65E9\u9000</option><option value="absent"${ssrIncludeBooleanAttr(Array.isArray(filterStatus.value) ? ssrLooseContain(filterStatus.value, "absent") : ssrLooseEqual(filterStatus.value, "absent")) ? " selected" : ""}>\u7F3A\u52E4</option><option value="pending"${ssrIncludeBooleanAttr(Array.isArray(filterStatus.value) ? ssrLooseContain(filterStatus.value, "pending") : ssrLooseEqual(filterStatus.value, "pending")) ? " selected" : ""}>\u5F85\u786E\u8BA4</option></select></div><div class="flex items-center gap-2 ml-auto">`);
      if (hasActiveFilters.value) {
        _push(`<button class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"> \u6E05\u9664\u7B5B\u9009 </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> \u5BFC\u51FA </button></div></div></div><div class="px-4 py-3 bg-gray-50 border-b border-gray-200"><div class="flex items-center gap-6 text-sm"><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-green-500"></span><span class="text-gray-600">\u6B63\u5E38: ${ssrInterpolate(stats.value.normal)}</span></div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-yellow-500"></span><span class="text-gray-600">\u8FDF\u5230: ${ssrInterpolate(stats.value.late)}</span></div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-yellow-500"></span><span class="text-gray-600">\u65E9\u9000: ${ssrInterpolate(stats.value.early_leave)}</span></div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-red-500"></span><span class="text-gray-600">\u7F3A\u52E4: ${ssrInterpolate(stats.value.absent)}</span></div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-gray-400"></span><span class="text-gray-600">\u5F85\u786E\u8BA4: ${ssrInterpolate(stats.value.pending)}</span></div></div></div><div class="overflow-x-auto"><table class="w-full"><thead class="bg-gray-50"><tr><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\u65E5\u671F</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\u5458\u5DE5</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\u9879\u76EE</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\u4E0A\u73ED\u6253\u5361</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\u4E0B\u73ED\u6253\u5361</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\u72B6\u6001</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\u4F4D\u7F6E\u9A8C\u8BC1</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\u9884\u8B66</th><th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">\u64CD\u4F5C</th></tr></thead><tbody class="divide-y divide-gray-200"><!--[-->`);
      ssrRenderList(filteredRecords.value, (record) => {
        _push(`<tr class="${ssrRenderClass([
          "cursor-pointer transition-colors",
          getRowHighlightClass(record.status)
        ])}"><td class="px-4 py-3 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${ssrInterpolate(record.date)}</div><div class="text-xs text-gray-500">${ssrInterpolate(getWeekDay(record.date))}</div></td><td class="px-4 py-3 whitespace-nowrap"><div class="flex items-center gap-3"><div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center"><span class="text-primary-600 font-semibold text-xs">${ssrInterpolate(getStaffName(record.staffId).charAt(0))}</span></div><div><div class="text-sm font-medium text-gray-900">${ssrInterpolate(getStaffName(record.staffId))}</div><div class="text-xs text-gray-500">${ssrInterpolate(getStaffPosition(record.staffId))}</div></div></div></td><td class="px-4 py-3 whitespace-nowrap"><div class="text-sm text-gray-900">${ssrInterpolate(getProjectName(record.projectId))}</div></td><td class="px-4 py-3 whitespace-nowrap"><div class="${ssrRenderClass(["text-sm font-medium", getCheckInTimeClass(record)])}">${ssrInterpolate(record.checkInTime || "--:--")}</div>`);
        if (record.checkInTime) {
          _push(`<div class="text-xs text-gray-400"> \u5E94\u5230: ${ssrInterpolate(getScheduleStartTime(record.scheduleId))}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</td><td class="px-4 py-3 whitespace-nowrap"><div class="${ssrRenderClass(["text-sm font-medium", getCheckOutTimeClass(record)])}">${ssrInterpolate(record.checkOutTime || "--:--")}</div>`);
        if (record.checkOutTime) {
          _push(`<div class="text-xs text-gray-400"> \u5E94\u9000: ${ssrInterpolate(getScheduleEndTime(record.scheduleId))}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</td><td class="px-4 py-3 whitespace-nowrap"><span class="${ssrRenderClass([
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          getStatusClass(record.status)
        ])}">${ssrInterpolate(("getStatusText" in _ctx ? _ctx.getStatusText : unref(getStatusText))(record.status))}</span></td><td class="px-4 py-3 whitespace-nowrap"><span class="${ssrRenderClass([
          "inline-flex items-center gap-1 text-xs",
          record.locationVerified ? "text-green-600" : "text-red-600"
        ])}">`);
        if (record.locationVerified) {
          _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`);
        } else {
          _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`);
        }
        _push(` ${ssrInterpolate(record.locationVerified ? "\u901A\u8FC7" : "\u5931\u8D25")}</span></td><td class="px-4 py-3 whitespace-nowrap">`);
        if (hasAlert(record.id)) {
          _push(`<div class="flex items-center gap-1 text-xs text-red-600"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> \u5DF2\u9884\u8B66 </div>`);
        } else {
          _push(`<span class="text-xs text-gray-400">-</span>`);
        }
        _push(`</td><td class="px-4 py-3 whitespace-nowrap text-right"><button class="text-sm text-primary-600 hover:text-primary-700"> \u67E5\u770B\u8BE6\u60C5 </button></td></tr>`);
      });
      _push(`<!--]-->`);
      if (filteredRecords.value.length === 0) {
        _push(`<tr><td colspan="9" class="px-4 py-12 text-center"><svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg><p class="text-gray-500">\u6682\u65E0\u6253\u5361\u8BB0\u5F55</p></td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</tbody></table></div>`);
      if (totalPages.value > 1) {
        _push(`<div class="px-4 py-3 border-t border-gray-200 flex items-center justify-between"><div class="text-sm text-gray-500"> \u5171 ${ssrInterpolate(totalRecords.value)} \u6761\u8BB0\u5F55\uFF0C\u7B2C ${ssrInterpolate(currentPage.value)} / ${ssrInterpolate(totalPages.value)} \u9875 </div><div class="flex items-center gap-2"><button${ssrIncludeBooleanAttr(currentPage.value === 1) ? " disabled" : ""} class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"> \u4E0A\u4E00\u9875 </button><!--[-->`);
        ssrRenderList(visiblePages.value, (page) => {
          _push(`<button class="${ssrRenderClass([
            "px-3 py-1 text-sm rounded-lg transition-colors",
            currentPage.value === page ? "bg-primary-600 text-white" : "border border-gray-300 hover:bg-gray-50"
          ])}">${ssrInterpolate(page)}</button>`);
        });
        _push(`<!--]--><button${ssrIncludeBooleanAttr(currentPage.value === totalPages.value) ? " disabled" : ""} class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"> \u4E0B\u4E00\u9875 </button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_PunchDetailModal, {
        visible: detailModalVisible.value,
        punch: selectedRecord.value,
        onClose: ($event) => detailModalVisible.value = false,
        onUpdated: handleRecordUpdated
      }, null, _parent));
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/punch/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-B7G-VuzF.mjs.map
