import { i as getStatusText, g as getAlertTypeText } from "./formatters-B147ECSY.js";
import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderComponent } from "vue/server-renderer";
import { u as useDataStore, f as formatDate, a as addDays } from "./data-CvF3Pjf4.js";
import { u as useAuthStore } from "./auth-BO_zE_6L.js";
import "../server.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/hookable/dist/index.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/unctx/dist/index.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/defu/dist/defu.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/ufo/dist/index.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/klona/dist/index.mjs";
import "dayjs";
import "dayjs/locale/zh-cn.js";
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
      return authStore.isProjectManager && props.punch?.status !== "normal";
    });
    const staffName = computed(() => {
      if (!props.punch) return "";
      const staff = dataStore.getStaffById(props.punch.staffId);
      return staff?.name || "未知员工";
    });
    const projectName = computed(() => {
      if (!props.punch) return "";
      const project = dataStore.getProjectById(props.punch.projectId);
      return project?.name || "未知项目";
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
        info: "提示",
        warning: "警告",
        critical: "严重"
      };
      return texts[severity] || severity;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" }, _attrs))}><div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"><div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between"><h3 class="text-lg font-semibold text-gray-900">打卡详情</h3><button class="p-1 hover:bg-gray-200 rounded-lg transition-colors"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`);
      if (__props.punch) {
        _push(`<div class="flex-1 overflow-y-auto p-6"><div class="flex items-start justify-between mb-6"><div class="flex items-center gap-3"><div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center"><span class="text-primary-600 font-semibold">${ssrInterpolate(staffName.value.charAt(0))}</span></div><div><h4 class="font-medium text-gray-900">${ssrInterpolate(staffName.value)}</h4><p class="text-sm text-gray-500">${ssrInterpolate(projectName.value)}</p></div></div><span class="${ssrRenderClass([
          "px-3 py-1 text-sm font-medium rounded-full",
          statusClass.value
        ])}">${ssrInterpolate(("getStatusText" in _ctx ? _ctx.getStatusText : unref(getStatusText))(__props.punch.status))}</span></div><div class="grid grid-cols-2 gap-4 mb-6"><div class="bg-gray-50 rounded-lg p-4"><p class="text-sm text-gray-500 mb-1">上班打卡</p><p class="text-xl font-semibold text-gray-900">${ssrInterpolate(__props.punch.checkInTime || "--:--")}</p><p class="text-xs text-gray-400 mt-1">应到: ${ssrInterpolate(schedule.value?.startTime || "--:--")}</p></div><div class="bg-gray-50 rounded-lg p-4"><p class="text-sm text-gray-500 mb-1">下班打卡</p><p class="text-xl font-semibold text-gray-900">${ssrInterpolate(__props.punch.checkOutTime || "--:--")}</p><p class="text-xs text-gray-400 mt-1">应退: ${ssrInterpolate(schedule.value?.endTime || "--:--")}</p></div></div><div class="space-y-4 mb-6"><div class="flex items-center gap-4"><div class="flex items-center gap-2"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-sm text-gray-600">${ssrInterpolate(__props.punch.date)}</span></div><div class="flex items-center gap-2"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg><span class="${ssrRenderClass([
          "text-sm",
          __props.punch.locationVerified ? "text-green-600" : "text-red-600"
        ])}">${ssrInterpolate(__props.punch.locationVerified ? "位置验证通过" : "位置验证失败")}</span></div></div>`);
        if (__props.punch.note) {
          _push(`<div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"><p class="text-sm text-yellow-800">${ssrInterpolate(__props.punch.note)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (__props.punch.checkInPhoto || __props.punch.checkOutPhoto) {
          _push(`<div class="mb-6"><h5 class="text-sm font-medium text-gray-700 mb-3">打卡照片</h5><div class="grid grid-cols-2 gap-4">`);
          if (__props.punch.checkInPhoto) {
            _push(`<div class="relative"><p class="text-xs text-gray-500 mb-1">上班打卡照片</p><img${ssrRenderAttr("src", __props.punch.checkInPhoto)} alt="上班打卡照片" class="w-full h-32 object-cover rounded-lg border border-gray-200"></div>`);
          } else {
            _push(`<!---->`);
          }
          if (__props.punch.checkOutPhoto) {
            _push(`<div class="relative"><p class="text-xs text-gray-500 mb-1">下班打卡照片</p><img${ssrRenderAttr("src", __props.punch.checkOutPhoto)} alt="下班打卡照片" class="w-full h-32 object-cover rounded-lg border border-gray-200"></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (relatedAlert.value) {
          _push(`<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><div class="flex items-start gap-3"><svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><div><p class="text-sm font-medium text-red-800">关联预警</p><p class="text-sm text-red-600">${ssrInterpolate(relatedAlert.value.title)}</p><p class="text-xs text-red-500 mt-1">${ssrInterpolate(("getAlertTypeText" in _ctx ? _ctx.getAlertTypeText : unref(getAlertTypeText))(relatedAlert.value.type))} · ${ssrInterpolate(getSeverityText(relatedAlert.value.severity))}</p></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (canSupplement.value && !showSupplementForm.value) {
          _push(`<div class="border-t border-gray-200 pt-4"><button class="w-full py-2 px-4 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"> 人工补卡 </button></div>`);
        } else {
          _push(`<!---->`);
        }
        if (showSupplementForm.value) {
          _push(`<div class="border-t border-gray-200 pt-4"><h5 class="text-sm font-medium text-gray-700 mb-3">人工补卡</h5><div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div><label class="block text-xs text-gray-500 mb-1">上班打卡时间</label><input${ssrRenderAttr("value", supplementForm.value.checkInTime)} type="time" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"></div><div><label class="block text-xs text-gray-500 mb-1">下班打卡时间</label><input${ssrRenderAttr("value", supplementForm.value.checkOutTime)} type="time" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"></div></div><div><label class="block text-xs text-gray-500 mb-1">补卡说明</label><textarea rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" placeholder="请填写补卡原因...">${ssrInterpolate(supplementForm.value.note)}</textarea></div><div class="flex gap-2"><button class="flex-1 py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"> 取消 </button><button${ssrIncludeBooleanAttr(submitting.value) ? " disabled" : ""} class="flex-1 py-2 px-4 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50">${ssrInterpolate(submitting.value ? "提交中..." : "确认补卡")}</button></div></div></div>`);
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
      return s?.name || "未知";
    }
    function getStaffPosition(staffId) {
      const s = staff.value.find((s2) => s2.id === staffId);
      return s?.position === "supervisor" ? "主管" : "保洁员";
    }
    function getProjectName(projectId) {
      const p = projects.value.find((p2) => p2.id === projectId);
      return p?.name || "未知项目";
    }
    function getScheduleStartTime(scheduleId) {
      const s = dataStore.schedules.find((s2) => s2.id === scheduleId);
      return s?.startTime || "--:--";
    }
    function getScheduleEndTime(scheduleId) {
      const s = dataStore.schedules.find((s2) => s2.id === scheduleId);
      return s?.endTime || "--:--";
    }
    function getWeekDay(dateStr) {
      const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-50" }, _attrs))}><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><div class="mb-6"><h1 class="text-2xl font-bold text-gray-900">打卡管理</h1><p class="text-gray-500 mt-1">查看和管理员工打卡记录，处理异常打卡</p></div><div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6"><div class="px-4 py-3 border-b border-gray-200"><div class="flex flex-wrap items-center gap-4"><div class="flex items-center gap-2"><label class="text-sm font-medium text-gray-700">日期范围:</label><input${ssrRenderAttr("value", filterStartDate.value)} type="date" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"><span class="text-gray-500">至</span><input${ssrRenderAttr("value", filterEndDate.value)} type="date" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"></div><div class="flex items-center gap-2"><label class="text-sm font-medium text-gray-700">项目:</label><select class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filterProjectId.value) ? ssrLooseContain(filterProjectId.value, "") : ssrLooseEqual(filterProjectId.value, "")) ? " selected" : ""}>全部项目</option><!--[-->`);
      ssrRenderList(projects.value, (project) => {
        _push(`<option${ssrRenderAttr("value", project.id)}${ssrIncludeBooleanAttr(Array.isArray(filterProjectId.value) ? ssrLooseContain(filterProjectId.value, project.id) : ssrLooseEqual(filterProjectId.value, project.id)) ? " selected" : ""}>${ssrInterpolate(project.name)}</option>`);
      });
      _push(`<!--]--></select></div><div class="flex items-center gap-2"><label class="text-sm font-medium text-gray-700">员工:</label><select class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filterStaffId.value) ? ssrLooseContain(filterStaffId.value, "") : ssrLooseEqual(filterStaffId.value, "")) ? " selected" : ""}>全部员工</option><!--[-->`);
      ssrRenderList(staff.value, (staff2) => {
        _push(`<option${ssrRenderAttr("value", staff2.id)}${ssrIncludeBooleanAttr(Array.isArray(filterStaffId.value) ? ssrLooseContain(filterStaffId.value, staff2.id) : ssrLooseEqual(filterStaffId.value, staff2.id)) ? " selected" : ""}>${ssrInterpolate(staff2.name)}</option>`);
      });
      _push(`<!--]--></select></div><div class="flex items-center gap-2"><label class="text-sm font-medium text-gray-700">状态:</label><select class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filterStatus.value) ? ssrLooseContain(filterStatus.value, "") : ssrLooseEqual(filterStatus.value, "")) ? " selected" : ""}>全部状态</option><option value="normal"${ssrIncludeBooleanAttr(Array.isArray(filterStatus.value) ? ssrLooseContain(filterStatus.value, "normal") : ssrLooseEqual(filterStatus.value, "normal")) ? " selected" : ""}>正常</option><option value="late"${ssrIncludeBooleanAttr(Array.isArray(filterStatus.value) ? ssrLooseContain(filterStatus.value, "late") : ssrLooseEqual(filterStatus.value, "late")) ? " selected" : ""}>迟到</option><option value="early_leave"${ssrIncludeBooleanAttr(Array.isArray(filterStatus.value) ? ssrLooseContain(filterStatus.value, "early_leave") : ssrLooseEqual(filterStatus.value, "early_leave")) ? " selected" : ""}>早退</option><option value="absent"${ssrIncludeBooleanAttr(Array.isArray(filterStatus.value) ? ssrLooseContain(filterStatus.value, "absent") : ssrLooseEqual(filterStatus.value, "absent")) ? " selected" : ""}>缺勤</option><option value="pending"${ssrIncludeBooleanAttr(Array.isArray(filterStatus.value) ? ssrLooseContain(filterStatus.value, "pending") : ssrLooseEqual(filterStatus.value, "pending")) ? " selected" : ""}>待确认</option></select></div><div class="flex items-center gap-2 ml-auto">`);
      if (hasActiveFilters.value) {
        _push(`<button class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"> 清除筛选 </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> 导出 </button></div></div></div><div class="px-4 py-3 bg-gray-50 border-b border-gray-200"><div class="flex items-center gap-6 text-sm"><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-green-500"></span><span class="text-gray-600">正常: ${ssrInterpolate(stats.value.normal)}</span></div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-yellow-500"></span><span class="text-gray-600">迟到: ${ssrInterpolate(stats.value.late)}</span></div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-yellow-500"></span><span class="text-gray-600">早退: ${ssrInterpolate(stats.value.early_leave)}</span></div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-red-500"></span><span class="text-gray-600">缺勤: ${ssrInterpolate(stats.value.absent)}</span></div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-gray-400"></span><span class="text-gray-600">待确认: ${ssrInterpolate(stats.value.pending)}</span></div></div></div><div class="overflow-x-auto"><table class="w-full"><thead class="bg-gray-50"><tr><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">员工</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上班打卡</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下班打卡</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">位置验证</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预警</th><th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th></tr></thead><tbody class="divide-y divide-gray-200"><!--[-->`);
      ssrRenderList(filteredRecords.value, (record) => {
        _push(`<tr class="${ssrRenderClass([
          "cursor-pointer transition-colors",
          getRowHighlightClass(record.status)
        ])}"><td class="px-4 py-3 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${ssrInterpolate(record.date)}</div><div class="text-xs text-gray-500">${ssrInterpolate(getWeekDay(record.date))}</div></td><td class="px-4 py-3 whitespace-nowrap"><div class="flex items-center gap-3"><div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center"><span class="text-primary-600 font-semibold text-xs">${ssrInterpolate(getStaffName(record.staffId).charAt(0))}</span></div><div><div class="text-sm font-medium text-gray-900">${ssrInterpolate(getStaffName(record.staffId))}</div><div class="text-xs text-gray-500">${ssrInterpolate(getStaffPosition(record.staffId))}</div></div></div></td><td class="px-4 py-3 whitespace-nowrap"><div class="text-sm text-gray-900">${ssrInterpolate(getProjectName(record.projectId))}</div></td><td class="px-4 py-3 whitespace-nowrap"><div class="${ssrRenderClass(["text-sm font-medium", getCheckInTimeClass(record)])}">${ssrInterpolate(record.checkInTime || "--:--")}</div>`);
        if (record.checkInTime) {
          _push(`<div class="text-xs text-gray-400"> 应到: ${ssrInterpolate(getScheduleStartTime(record.scheduleId))}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</td><td class="px-4 py-3 whitespace-nowrap"><div class="${ssrRenderClass(["text-sm font-medium", getCheckOutTimeClass(record)])}">${ssrInterpolate(record.checkOutTime || "--:--")}</div>`);
        if (record.checkOutTime) {
          _push(`<div class="text-xs text-gray-400"> 应退: ${ssrInterpolate(getScheduleEndTime(record.scheduleId))}</div>`);
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
        _push(` ${ssrInterpolate(record.locationVerified ? "通过" : "失败")}</span></td><td class="px-4 py-3 whitespace-nowrap">`);
        if (hasAlert(record.id)) {
          _push(`<div class="flex items-center gap-1 text-xs text-red-600"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> 已预警 </div>`);
        } else {
          _push(`<span class="text-xs text-gray-400">-</span>`);
        }
        _push(`</td><td class="px-4 py-3 whitespace-nowrap text-right"><button class="text-sm text-primary-600 hover:text-primary-700"> 查看详情 </button></td></tr>`);
      });
      _push(`<!--]-->`);
      if (filteredRecords.value.length === 0) {
        _push(`<tr><td colspan="9" class="px-4 py-12 text-center"><svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg><p class="text-gray-500">暂无打卡记录</p></td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</tbody></table></div>`);
      if (totalPages.value > 1) {
        _push(`<div class="px-4 py-3 border-t border-gray-200 flex items-center justify-between"><div class="text-sm text-gray-500"> 共 ${ssrInterpolate(totalRecords.value)} 条记录，第 ${ssrInterpolate(currentPage.value)} / ${ssrInterpolate(totalPages.value)} 页 </div><div class="flex items-center gap-2"><button${ssrIncludeBooleanAttr(currentPage.value === 1) ? " disabled" : ""} class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"> 上一页 </button><!--[-->`);
        ssrRenderList(visiblePages.value, (page) => {
          _push(`<button class="${ssrRenderClass([
            "px-3 py-1 text-sm rounded-lg transition-colors",
            currentPage.value === page ? "bg-primary-600 text-white" : "border border-gray-300 hover:bg-gray-50"
          ])}">${ssrInterpolate(page)}</button>`);
        });
        _push(`<!--]--><button${ssrIncludeBooleanAttr(currentPage.value === totalPages.value) ? " disabled" : ""} class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"> 下一页 </button></div></div>`);
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
export {
  _sfc_main as default
};
//# sourceMappingURL=index-B7G-VuzF.js.map
