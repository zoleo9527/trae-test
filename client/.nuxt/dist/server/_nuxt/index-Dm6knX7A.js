import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderComponent } from "vue/server-renderer";
import { u as useDataStore, b as formatDateTime, f as formatDate } from "./data-CvF3Pjf4.js";
import { u as useFilterStore } from "./filter-GkuypMRw.js";
import { i as getStatusText, j as getTaskTypeText, g as getAlertTypeText } from "./formatters-B147ECSY.js";
import { a as _export_sfc } from "../server.mjs";
import "dayjs";
import "dayjs/locale/zh-cn.js";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/hookable/dist/index.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/unctx/dist/index.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/defu/dist/defu.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/ufo/dist/index.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/klona/dist/index.mjs";
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
          { value: "scheduled", label: "已排期" },
          { value: "in_progress", label: "进行中" },
          { value: "completed", label: "已完成" },
          { value: "cancelled", label: "已取消" }
        );
      }
      if (types.includes("punch") || types.length === 0) {
        statuses.push(
          { value: "normal", label: "正常" },
          { value: "late", label: "迟到" },
          { value: "early_leave", label: "早退" },
          { value: "absent", label: "缺勤" }
        );
      }
      if (types.includes("inspection") || types.length === 0) {
        statuses.push(
          { value: "excellent", label: "优秀" },
          { value: "good", label: "良好" },
          { value: "pass", label: "合格" },
          { value: "fail", label: "不合格" }
        );
      }
      if (types.includes("requisition") || types.length === 0) {
        statuses.push(
          { value: "draft", label: "草稿" },
          { value: "pending", label: "待审核" },
          { value: "approved", label: "已通过" },
          { value: "rejected", label: "已拒绝" },
          { value: "delivered", label: "已发货" },
          { value: "completed", label: "已完成" }
        );
      }
      if (types.includes("alert") || types.length === 0) {
        statuses.push(
          { value: "open", label: "未处理" },
          { value: "in_progress", label: "处理中" },
          { value: "resolved", label: "已解决" }
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
          label: `日期: ${filterStore.global.dateRange[0]} 至 ${filterStore.global.dateRange[1]}`,
          onRemove: () => filterStore.setDateRange(null)
        });
      }
      filterStore.global.projectIds.forEach((id) => {
        const project = dataStore.getProjectById(id);
        if (project) {
          tags.push({
            key: `project-${id}`,
            label: `项目: ${project.name}`,
            onRemove: () => filterStore.toggleProjectId(id)
          });
        }
      });
      filterStore.global.statuses.forEach((status) => {
        tags.push({
          key: `status-${status}`,
          label: `状态: ${getStatusText(status)}`,
          onRemove: () => filterStore.toggleStatus(status)
        });
      });
      filterStore.global.types.forEach((type) => {
        const typeConfig = props.types.find((t) => t.value === type);
        if (typeConfig) {
          tags.push({
            key: `type-${type}`,
            label: `类型: ${typeConfig.label}`,
            onRemove: () => filterStore.toggleType(type)
          });
        }
      });
      if (filterStore.global.searchText) {
        tags.push({
          key: "search",
          label: `搜索: ${filterStore.global.searchText}`,
          onRemove: () => {
            localSearchText.value = "";
            filterStore.setSearchText("");
          }
        });
      }
      return tags;
    });
    function getProjectName(projectId) {
      return dataStore.getProjectById(projectId)?.name || "未知项目";
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4" }, _attrs))}><div class="flex items-center justify-between"><h3 class="font-semibold text-gray-900">筛选条件</h3>`);
      if (hasActiveFilters.value) {
        _push(`<button class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"><span>✕</span> 清除全部 </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="space-y-4"><div><label class="block text-sm font-medium text-gray-700 mb-2">记录类型</label><div class="flex flex-wrap gap-2"><!--[-->`);
      ssrRenderList(__props.types, (type) => {
        _push(`<button class="${ssrRenderClass([
          "px-3 py-1.5 text-sm rounded-lg border transition-colors",
          selectedTypes.value.includes(type.value) ? `${type.bgClass} ${type.textClass} ${type.borderClass}` : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
        ])}"><span class="flex items-center gap-1.5"><span>${ssrInterpolate(type.icon)}</span> ${ssrInterpolate(type.label)}</span></button>`);
      });
      _push(`<!--]--></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-2">日期范围</label><div class="flex items-center gap-2"><input type="date"${ssrRenderAttr("value", unref(filterStore).global.dateRange?.[0] || "")} class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><span class="text-gray-400">至</span><input type="date"${ssrRenderAttr("value", unref(filterStore).global.dateRange?.[1] || "")} class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></div></div><div><label class="block text-sm font-medium text-gray-700 mb-2">关键词搜索</label><div class="relative"><input${ssrRenderAttr("value", localSearchText.value)} type="text" placeholder="搜索标题、描述、人员..." class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span></div></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-2"> 项目筛选 `);
      if (unref(filterStore).global.projectIds.length > 0) {
        _push(`<span class="text-primary-600 ml-1"> (已选 ${ssrInterpolate(unref(filterStore).global.projectIds.length)}) </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</label><div class="relative"><button class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-between">`);
      if (unref(filterStore).global.projectIds.length === 0) {
        _push(`<span class="text-gray-400"> 请选择项目 </span>`);
      } else if (unref(filterStore).global.projectIds.length <= 2) {
        _push(`<span>${ssrInterpolate(unref(filterStore).global.projectIds.map((id) => getProjectName(id)).join("、"))}</span>`);
      } else {
        _push(`<span> 已选择 ${ssrInterpolate(unref(filterStore).global.projectIds.length)} 个项目 </span>`);
      }
      _push(`<span class="text-gray-400">▼</span></button>`);
      if (showProjectDropdown.value) {
        _push(`<div class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"><!--[-->`);
        ssrRenderList(projects.value, (project) => {
          _push(`<div class="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"><input type="checkbox"${ssrIncludeBooleanAttr(unref(filterStore).global.projectIds.includes(project.id)) ? " checked" : ""} class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"><span class="text-sm text-gray-700">${ssrInterpolate(project.name)}</span></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div><label class="block text-sm font-medium text-gray-700 mb-2"> 状态筛选 `);
      if (unref(filterStore).global.statuses.length > 0) {
        _push(`<span class="text-primary-600 ml-1"> (已选 ${ssrInterpolate(unref(filterStore).global.statuses.length)}) </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</label><div class="relative"><button class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-between">`);
      if (unref(filterStore).global.statuses.length === 0) {
        _push(`<span class="text-gray-400"> 请选择状态 </span>`);
      } else if (unref(filterStore).global.statuses.length <= 2) {
        _push(`<span>${ssrInterpolate(unref(filterStore).global.statuses.map((s) => unref(getStatusText)(s)).join("、"))}</span>`);
      } else {
        _push(`<span> 已选择 ${ssrInterpolate(unref(filterStore).global.statuses.length)} 个状态 </span>`);
      }
      _push(`<span class="text-gray-400">▼</span></button>`);
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
          _push(`<div class="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"><span>${ssrInterpolate(tag.label)}</span><button class="hover:text-primary-900">✕</button></div>`);
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
      { value: "schedule", label: "排班记录", icon: "📅", bgClass: "bg-blue-50", textClass: "text-blue-700", borderClass: "border-blue-300" },
      { value: "punch", label: "打卡记录", icon: "🕐", bgClass: "bg-red-50", textClass: "text-red-700", borderClass: "border-red-300" },
      { value: "inspection", label: "质检记录", icon: "✅", bgClass: "bg-green-50", textClass: "text-green-700", borderClass: "border-green-300" },
      { value: "requisition", label: "耗材申领", icon: "📦", bgClass: "bg-purple-50", textClass: "text-purple-700", borderClass: "border-purple-300" },
      { value: "alert", label: "预警处理", icon: "🚨", bgClass: "bg-orange-50", textClass: "text-orange-700", borderClass: "border-orange-300" }
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
        return "全部类型";
      }
      const typeConfig = recordTypes.find((t) => t.value === activeType.value);
      return typeConfig?.label || "全部类型";
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
            title: `${staff?.name || "未知"} - ${project?.name || "未知项目"}`,
            description: `${getTaskTypeText(schedule.taskType)} ${schedule.startTime}-${schedule.endTime}`,
            status: schedule.status,
            date: schedule.date,
            projectName: project?.name || "未知项目",
            staffName: staff?.name,
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
            title: `${staff?.name || "未知"} - 打卡记录`,
            description: punch.status === "normal" ? "正常打卡" : punch.status === "late" ? "迟到" : punch.status === "early_leave" ? "早退" : "缺勤",
            status: punch.status,
            date: punch.date,
            projectName: project?.name || "未知项目",
            staffName: staff?.name,
            detail: {
              checkInTime: punch.checkInTime || "-",
              checkOutTime: punch.checkOutTime || "-",
              locationVerified: punch.locationVerified ? "是" : "否",
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
            title: `质检 - ${project?.name || "未知项目"}`,
            description: `评分: ${inspection.score}分 - ${inspection.overallStatus === "excellent" ? "优秀" : inspection.overallStatus === "good" ? "良好" : inspection.overallStatus === "pass" ? "合格" : "不合格"}`,
            status: inspection.overallStatus,
            date: inspection.date,
            projectName: project?.name || "未知项目",
            staffName: inspector?.name,
            detail: {
              score: `${inspection.score}分`,
              overallStatus: inspection.overallStatus,
              rectificationRequired: inspection.rectificationRequired ? "需要" : "不需要",
              rectificationDeadline: inspection.rectificationDeadline || "-",
              note: inspection.note || "-"
            },
            extra: {
              itemCount: `${inspection.items.length}项检查项`
            }
          });
        });
      }
      if (types.length === 0 || types.includes("requisition")) {
        dataStore.requisitions.forEach((requisition) => {
          const project = dataStore.getProjectById(requisition.projectId);
          const applicant = dataStore.getStaffById(requisition.applicantId);
          records.push({
            id: `requisition-${requisition.id}`,
            type: "requisition",
            title: `耗材申领 - ${project?.name || "未知项目"}`,
            description: `${requisition.items.length}项耗材`,
            status: requisition.status,
            date: requisition.applicationDate,
            projectName: project?.name || "未知项目",
            staffName: applicant?.name,
            detail: {
              applicationDate: requisition.applicationDate,
              status: requisition.status,
              itemsCount: `${requisition.items.length}项`,
              approver: requisition.approverId ? dataStore.getStaffById(requisition.approverId)?.name || "未知" : "未审批",
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
            projectName: project?.name || "无",
            detail: {
              alertType: getAlertTypeText(alert.type),
              severity: alert.severity === "critical" ? "紧急" : alert.severity === "warning" ? "警告" : "提示",
              status: alert.status,
              createdAt: formatDateTime(alert.createdAt),
              updatedAt: formatDateTime(alert.updatedAt),
              resolvedAt: alert.resolvedAt ? formatDateTime(alert.resolvedAt) : "-",
              resolutionNote: alert.resolutionNote || "-"
            },
            extra: {
              historyCount: `${alert.history.length}条处理记录`
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
        schedule: "📅",
        punch: "🕐",
        inspection: "✅",
        requisition: "📦",
        alert: "🚨"
      };
      return iconMap[type] || "📄";
    }
    function getRecordTypeLabel(type) {
      const labelMap = {
        schedule: "排班记录",
        punch: "打卡记录",
        inspection: "质检记录",
        requisition: "耗材申领",
        alert: "预警处理"
      };
      return labelMap[type] || "其他";
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
        taskType: "任务类型",
        startTime: "开始时间",
        endTime: "结束时间",
        checkInTime: "打卡时间",
        checkOutTime: "签退时间",
        locationVerified: "位置验证",
        score: "评分",
        overallStatus: "整体评价",
        rectificationRequired: "需要整改",
        rectificationDeadline: "整改截止",
        applicationDate: "申请日期",
        itemsCount: "项数",
        approver: "审批人",
        approvalDate: "审批日期",
        deliveryDate: "发货日期",
        rejectReason: "拒绝原因",
        alertType: "预警类型",
        severity: "严重程度",
        createdAt: "创建时间",
        updatedAt: "更新时间",
        resolvedAt: "解决时间",
        resolutionNote: "处理结果",
        itemCount: "检查项",
        historyCount: "处理记录",
        status: "状态",
        note: "备注"
      };
      return labelMap[key] || key;
    }
    function formatDetailValue(key, value) {
      if (key === "taskType" && typeof value === "string") {
        return getTaskTypeText(value);
      }
      if (key === "overallStatus" && typeof value === "string") {
        const statusMap = {
          excellent: "优秀",
          good: "良好",
          pass: "合格",
          fail: "不合格"
        };
        return statusMap[value] || value;
      }
      if (key === "severity" && typeof value === "string") {
        const severityMap = {
          critical: "紧急",
          warning: "警告",
          info: "提示"
        };
        return severityMap[value] || value;
      }
      return String(value);
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-6" }, _attrs))} data-v-ddde57a3><div class="flex items-center justify-between" data-v-ddde57a3><div data-v-ddde57a3><h1 class="text-2xl font-bold text-gray-900" data-v-ddde57a3>历史记录查询</h1><p class="text-gray-500 mt-1" data-v-ddde57a3>统一查询各类业务记录</p></div>`);
      if (filteredRecords.value.length > 0) {
        _push(`<button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex items-center gap-2" data-v-ddde57a3><span data-v-ddde57a3>📤</span> 导出数据 </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        types: recordTypes,
        onFilterChange: handleFilterChange
      }, null, _parent));
      _push(`<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" data-v-ddde57a3><div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between" data-v-ddde57a3><div class="flex items-center gap-4" data-v-ddde57a3><span class="text-sm text-gray-500" data-v-ddde57a3> 共 <span class="font-semibold text-gray-900" data-v-ddde57a3>${ssrInterpolate(filteredRecords.value.length)}</span> 条记录 </span>`);
      if (activeType.value) {
        _push(`<div class="text-sm text-gray-500" data-v-ddde57a3> 当前显示: <span class="font-medium text-primary-600" data-v-ddde57a3>${ssrInterpolate(activeTypeLabel.value)}</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="divide-y divide-gray-50" data-v-ddde57a3><!--[-->`);
      ssrRenderList(filteredRecords.value, (record) => {
        _push(`<div class="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer" data-v-ddde57a3><div class="flex items-start gap-4" data-v-ddde57a3><div class="${ssrRenderClass([getRecordTypeBg(record.type), "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"])}" data-v-ddde57a3><span class="text-2xl" data-v-ddde57a3>${ssrInterpolate(getRecordIcon(record.type))}</span></div><div class="flex-1 min-w-0" data-v-ddde57a3><div class="flex items-center gap-2 flex-wrap" data-v-ddde57a3><span class="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 flex-shrink-0" data-v-ddde57a3>${ssrInterpolate(getRecordTypeLabel(record.type))}</span><h3 class="font-medium text-gray-900" data-v-ddde57a3>${ssrInterpolate(record.title)}</h3><span class="${ssrRenderClass([getStatusBadgeClass(record.status), "px-2 py-0.5 text-xs rounded-full flex-shrink-0"])}" data-v-ddde57a3>${ssrInterpolate(unref(getStatusText)(record.status))}</span></div><p class="text-sm text-gray-500 mt-1" data-v-ddde57a3>${ssrInterpolate(record.description)}</p><div class="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap" data-v-ddde57a3>`);
        if (record.projectName) {
          _push(`<span data-v-ddde57a3> 项目: ${ssrInterpolate(record.projectName)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (record.staffName) {
          _push(`<span data-v-ddde57a3> 人员: ${ssrInterpolate(record.staffName)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<span data-v-ddde57a3> 时间: ${ssrInterpolate(record.date)}</span></div></div><div class="flex items-center gap-2" data-v-ddde57a3><span class="text-gray-300" data-v-ddde57a3>→</span></div></div></div>`);
      });
      _push(`<!--]--></div>`);
      if (filteredRecords.value.length === 0) {
        _push(`<div class="px-6 py-12 text-center text-gray-400" data-v-ddde57a3><span class="text-4xl mb-3 block" data-v-ddde57a3>📭</span><p data-v-ddde57a3>暂无符合条件的记录</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (detailModal.value.visible) {
        _push(`<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-v-ddde57a3><div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" data-v-ddde57a3><div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between" data-v-ddde57a3><div class="flex items-center gap-3" data-v-ddde57a3><div class="${ssrRenderClass([getRecordTypeBg(detailModal.value.record?.type || ""), "w-10 h-10 rounded-lg flex items-center justify-center"])}" data-v-ddde57a3><span class="text-xl" data-v-ddde57a3>${ssrInterpolate(getRecordIcon(detailModal.value.record?.type || ""))}</span></div><div data-v-ddde57a3><h3 class="text-lg font-semibold text-gray-900" data-v-ddde57a3>${ssrInterpolate(detailModal.value.record?.title)}</h3><div class="flex items-center gap-2 mt-1" data-v-ddde57a3><span class="text-xs text-gray-500" data-v-ddde57a3>${ssrInterpolate(getRecordTypeLabel(detailModal.value.record?.type || ""))}</span><span class="${ssrRenderClass([getStatusBadgeClass(detailModal.value.record?.status || ""), "px-2 py-0.5 text-xs rounded-full"])}" data-v-ddde57a3>${ssrInterpolate(unref(getStatusText)(detailModal.value.record?.status || ""))}</span></div></div></div><button class="p-2 hover:bg-gray-100 rounded-lg transition-colors" data-v-ddde57a3><span class="text-xl" data-v-ddde57a3>✕</span></button></div><div class="flex-1 overflow-y-auto p-6 space-y-6" data-v-ddde57a3><div class="bg-gray-50 rounded-xl p-5" data-v-ddde57a3><h4 class="font-medium text-gray-900 mb-3" data-v-ddde57a3>记录详情</h4><div class="space-y-3" data-v-ddde57a3><!--[-->`);
        ssrRenderList(detailModal.value.record?.detail, (value, key) => {
          _push(`<div class="flex items-start gap-2" data-v-ddde57a3><span class="text-gray-500 text-sm w-32 flex-shrink-0" data-v-ddde57a3>${ssrInterpolate(getDetailLabel(key))}:</span><span class="text-gray-900 text-sm" data-v-ddde57a3>${ssrInterpolate(formatDetailValue(key, value))}</span></div>`);
        });
        _push(`<!--]--></div></div>`);
        if (detailModal.value.record?.extra && Object.keys(detailModal.value.record.extra).length > 0) {
          _push(`<div class="bg-white border border-gray-200 rounded-xl p-5" data-v-ddde57a3><h4 class="font-medium text-gray-900 mb-3" data-v-ddde57a3>扩展信息</h4><div class="space-y-2" data-v-ddde57a3><!--[-->`);
          ssrRenderList(detailModal.value.record.extra, (value, key) => {
            _push(`<div class="flex items-start gap-2" data-v-ddde57a3><span class="text-gray-500 text-sm w-32 flex-shrink-0" data-v-ddde57a3>${ssrInterpolate(getDetailLabel(key))}:</span><span class="text-gray-900 text-sm" data-v-ddde57a3>${ssrInterpolate(formatDetailValue(key, value))}</span></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="px-6 py-4 border-t border-gray-100" data-v-ddde57a3><button class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" data-v-ddde57a3> 关闭 </button></div></div></div>`);
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
        _push(`<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-v-ddde57a3><div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" data-v-ddde57a3><div class="px-6 py-4 border-b border-gray-100" data-v-ddde57a3><h3 class="text-lg font-semibold text-gray-900" data-v-ddde57a3>确认导出</h3></div><div class="px-6 py-4" data-v-ddde57a3><p class="text-gray-600" data-v-ddde57a3> 确定要导出当前筛选条件下的 <span class="font-semibold text-primary-600" data-v-ddde57a3>${ssrInterpolate(filteredRecords.value.length)}</span> 条记录吗？ </p><p class="text-sm text-gray-500 mt-2" data-v-ddde57a3>将导出为 CSV 格式文件（模拟）</p></div><div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3" data-v-ddde57a3><button class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" data-v-ddde57a3> 取消 </button><button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors" data-v-ddde57a3> 确认导出 </button></div></div></div>`);
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
export {
  index as default
};
//# sourceMappingURL=index-Dm6knX7A.js.map
