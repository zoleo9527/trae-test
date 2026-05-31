import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderClass } from "vue/server-renderer";
import { u as useDataStore, f as formatDate } from "./data-CvF3Pjf4.js";
import { u as useAuthStore } from "./auth-BO_zE_6L.js";
import { h as getRoleText, g as getAlertTypeText } from "./formatters-B147ECSY.js";
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
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const dataStore = useDataStore();
    const authStore = useAuthStore();
    const selectedRole = ref(authStore.currentRole);
    const todayFormatted = computed(() => {
      const date = /* @__PURE__ */ new Date();
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
    });
    const currentRole = computed(() => authStore.currentRole);
    const statistics = computed(() => dataStore.statistics);
    const openAlerts = computed(() => dataStore.getOpenAlerts);
    const today = computed(() => formatDate(/* @__PURE__ */ new Date()));
    computed(() => dataStore.getSchedulesByDate(today.value));
    const todayPunches = computed(() => dataStore.getPunchRecordsByDate(today.value));
    const todayInspections = computed(() => dataStore.getInspectionsByDate(today.value));
    const todayPunchStats = computed(() => {
      const punches = todayPunches.value;
      return {
        normal: punches.filter((p) => p.status === "normal").length,
        late: punches.filter((p) => p.status === "late").length,
        early_leave: punches.filter((p) => p.status === "early_leave").length,
        absent: punches.filter((p) => p.status === "absent").length,
        pending: punches.filter((p) => p.status === "pending").length
      };
    });
    const todayInspectionStats = computed(() => {
      const inspections = todayInspections.value;
      return {
        excellentGood: inspections.filter((i) => i.overallStatus === "excellent" || i.overallStatus === "good").length,
        pass: inspections.filter((i) => i.overallStatus === "pass").length,
        fail: inspections.filter((i) => i.overallStatus === "fail").length
      };
    });
    const statCards = computed(() => [
      {
        key: "totalProjects",
        label: "项目总数",
        value: statistics.value.totalProjects,
        subLabel: statistics.value.expiringProjects > 0 ? `${statistics.value.expiringProjects} 个即将到期` : void 0,
        icon: "🏢",
        iconBg: "bg-blue-100",
        valueColor: "text-blue-600"
      },
      {
        key: "todaySchedules",
        label: "今日排班",
        value: statistics.value.todaySchedules,
        subLabel: `已完成 ${statistics.value.todayCompleted}`,
        icon: "📅",
        iconBg: "bg-green-100",
        valueColor: "text-green-600"
      },
      {
        key: "pendingRequisitions",
        label: "待处理申领",
        value: statistics.value.pendingRequisitions,
        icon: "📝",
        iconBg: "bg-yellow-100",
        valueColor: "text-yellow-600"
      },
      {
        key: "lowStockCount",
        label: "库存预警",
        value: statistics.value.lowStockCount,
        icon: "📦",
        iconBg: "bg-orange-100",
        valueColor: "text-orange-600"
      },
      {
        key: "pendingRectifications",
        label: "待整改",
        value: statistics.value.pendingRectifications,
        icon: "🔧",
        iconBg: "bg-red-100",
        valueColor: "text-red-600"
      },
      {
        key: "criticalAlerts",
        label: "紧急预警",
        value: statistics.value.criticalAlerts,
        subLabel: statistics.value.openAlerts > 0 ? `共 ${statistics.value.openAlerts} 条预警` : void 0,
        icon: "🚨",
        iconBg: "bg-red-100",
        valueColor: "text-red-600"
      }
    ]);
    const quickActions = computed(() => {
      const role = currentRole.value;
      const actions = [];
      if (role === "project_manager") {
        actions.push(
          { key: "view_projects", label: "查看项目", description: "管理所有项目信息", icon: "🏢", iconBg: "bg-blue-100" },
          { key: "approve_requisitions", label: "审批申领", description: `待处理 ${statistics.value.pendingRequisitions} 条`, icon: "✅", iconBg: "bg-green-100" },
          { key: "view_alerts", label: "预警管理", description: `未处理 ${statistics.value.openAlerts} 条`, icon: "🚨", iconBg: "bg-red-100" },
          { key: "view_reports", label: "数据报表", description: "查看运营数据统计", icon: "📊", iconBg: "bg-purple-100" }
        );
      } else if (role === "scheduling_specialist") {
        actions.push(
          { key: "create_schedule", label: "创建排班", description: "安排人员排班计划", icon: "📅", iconBg: "bg-blue-100" },
          { key: "view_schedules", label: "排班管理", description: `今日 ${statistics.value.todaySchedules} 条排班`, icon: "📋", iconBg: "bg-green-100" },
          { key: "view_punches", label: "打卡记录", description: "查看人员打卡情况", icon: "🕐", iconBg: "bg-yellow-100" },
          { key: "view_staff", label: "人员管理", description: "管理清洁人员信息", icon: "👥", iconBg: "bg-purple-100" }
        );
      } else if (role === "quality_inspector") {
        actions.push(
          { key: "create_inspection", label: "创建质检", description: "发起新的质检任务", icon: "✅", iconBg: "bg-blue-100" },
          { key: "view_inspections", label: "质检记录", description: "查看历史质检记录", icon: "📋", iconBg: "bg-green-100" },
          { key: "view_rectifications", label: "整改管理", description: `待整改 ${statistics.value.pendingRectifications} 项`, icon: "🔧", iconBg: "bg-red-100" },
          { key: "view_supplies", label: "库存管理", description: `库存预警 ${statistics.value.lowStockCount} 项`, icon: "📦", iconBg: "bg-orange-100" }
        );
      }
      return actions;
    });
    const todayTip = computed(() => {
      const role = currentRole.value;
      if (role === "project_manager") {
        return "及时审批申领，关注项目合同到期情况";
      } else if (role === "scheduling_specialist") {
        return "合理安排排班，确保人员覆盖所有项目";
      } else {
        return "认真完成质检，及时跟进整改情况";
      }
    });
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
    function getSeverityText(severity) {
      const textMap = {
        critical: "紧急",
        warning: "警告",
        info: "提示"
      };
      return textMap[severity];
    }
    function getAlertIcon(type) {
      const iconMap = {
        missing_punch: "🕐",
        rectification: "🔧",
        low_stock: "📦",
        contract_expiry: "📄",
        overdue_task: "⚠️"
      };
      return iconMap[type];
    }
    function formatTime(isoString) {
      const date = new Date(isoString);
      const now = /* @__PURE__ */ new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 6e4);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      if (diffMins < 60) {
        return `${diffMins} 分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours} 小时前`;
      } else if (diffDays < 7) {
        return `${diffDays} 天前`;
      } else {
        return date.toLocaleDateString("zh-CN");
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-6" }, _attrs))}><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold text-gray-900">仪表盘</h1><p class="text-gray-500 mt-1">${ssrInterpolate(todayFormatted.value)} · ${ssrInterpolate(unref(getRoleText)(currentRole.value))}</p></div><div class="flex items-center gap-3"><span class="text-sm text-gray-500">切换角色：</span><select class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="project_manager"${ssrIncludeBooleanAttr(Array.isArray(selectedRole.value) ? ssrLooseContain(selectedRole.value, "project_manager") : ssrLooseEqual(selectedRole.value, "project_manager")) ? " selected" : ""}>项目主管</option><option value="scheduling_specialist"${ssrIncludeBooleanAttr(Array.isArray(selectedRole.value) ? ssrLooseContain(selectedRole.value, "scheduling_specialist") : ssrLooseEqual(selectedRole.value, "scheduling_specialist")) ? " selected" : ""}>排班专员</option><option value="quality_inspector"${ssrIncludeBooleanAttr(Array.isArray(selectedRole.value) ? ssrLooseContain(selectedRole.value, "quality_inspector") : ssrLooseEqual(selectedRole.value, "quality_inspector")) ? " selected" : ""}>质检员</option></select></div></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"><!--[-->`);
      ssrRenderList(statCards.value, (card) => {
        _push(`<div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer"><div class="flex items-start justify-between"><div><p class="text-sm text-gray-500 mb-1">${ssrInterpolate(card.label)}</p><p class="${ssrRenderClass([card.valueColor, "text-3xl font-bold"])}">${ssrInterpolate(card.value)}</p>`);
        if (card.subLabel) {
          _push(`<p class="text-xs text-gray-400 mt-2">${ssrInterpolate(card.subLabel)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="${ssrRenderClass([card.iconBg, "w-12 h-12 rounded-xl flex items-center justify-center"])}"><span class="text-2xl">${ssrInterpolate(card.icon)}</span></div></div></div>`);
      });
      _push(`<!--]--></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-2 space-y-6"><div class="bg-white rounded-xl shadow-sm border border-gray-100"><div class="px-6 py-4 border-b border-gray-100"><div class="flex items-center justify-between"><h2 class="text-lg font-semibold text-gray-900">预警列表</h2><span class="text-sm text-gray-500">共 ${ssrInterpolate(openAlerts.value.length)} 条未处理</span></div></div><div class="divide-y divide-gray-50"><!--[-->`);
      ssrRenderList(openAlerts.value, (alert) => {
        _push(`<div class="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"><div class="flex items-start gap-4"><div class="${ssrRenderClass([getAlertSeverityBg(alert.severity), "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"])}"><span class="text-xl">${ssrInterpolate(getAlertIcon(alert.type))}</span></div><div class="flex-1 min-w-0"><div class="flex items-center gap-2"><h3 class="font-medium text-gray-900 truncate">${ssrInterpolate(alert.title)}</h3><span class="${ssrRenderClass([getSeverityBadgeClass(alert.severity), "px-2 py-0.5 text-xs rounded-full flex-shrink-0"])}">${ssrInterpolate(getSeverityText(alert.severity))}</span></div><p class="text-sm text-gray-500 mt-1 line-clamp-2">${ssrInterpolate(alert.description)}</p><div class="flex items-center gap-4 mt-2 text-xs text-gray-400"><span>${ssrInterpolate(unref(getAlertTypeText)(alert.type))}</span><span>${ssrInterpolate(formatTime(alert.createdAt))}</span></div></div><button class="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0"> 处理 </button></div></div>`);
      });
      _push(`<!--]-->`);
      if (openAlerts.value.length === 0) {
        _push(`<div class="px-6 py-12 text-center text-gray-400"><span class="text-4xl mb-3 block">🎉</span><p>暂无预警，一切正常</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="bg-white rounded-xl shadow-sm border border-gray-100"><div class="px-6 py-4 border-b border-gray-100"><h2 class="text-lg font-semibold text-gray-900">今日概览</h2></div><div class="p-6"><div class="grid grid-cols-1 md:grid-cols-3 gap-6"><div class="space-y-4"><div class="flex items-center gap-2"><span class="text-xl">📋</span><h3 class="font-medium text-gray-900">今日排班</h3></div><div class="space-y-2"><div class="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg"><span class="text-sm text-gray-600">排班总数</span><span class="font-semibold text-blue-600">${ssrInterpolate(statistics.value.todaySchedules)}</span></div><div class="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg"><span class="text-sm text-gray-600">已完成</span><span class="font-semibold text-green-600">${ssrInterpolate(statistics.value.todayCompleted)}</span></div><div class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"><span class="text-sm text-gray-600">进行中</span><span class="font-semibold text-gray-600">${ssrInterpolate(statistics.value.todaySchedules - statistics.value.todayCompleted)}</span></div></div></div><div class="space-y-4"><div class="flex items-center gap-2"><span class="text-xl">🕐</span><h3 class="font-medium text-gray-900">打卡情况</h3></div><div class="space-y-2"><div class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"><span class="text-sm text-gray-600">正常打卡</span><span class="font-semibold text-gray-600">${ssrInterpolate(todayPunchStats.value.normal)}</span></div><div class="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded-lg"><span class="text-sm text-gray-600">迟到</span><span class="font-semibold text-yellow-600">${ssrInterpolate(todayPunchStats.value.late)}</span></div><div class="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg"><span class="text-sm text-gray-600">缺勤</span><span class="font-semibold text-red-600">${ssrInterpolate(todayPunchStats.value.absent)}</span></div></div></div><div class="space-y-4"><div class="flex items-center gap-2"><span class="text-xl">✅</span><h3 class="font-medium text-gray-900">质检情况</h3></div><div class="space-y-2"><div class="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg"><span class="text-sm text-gray-600">优秀/良好</span><span class="font-semibold text-green-600">${ssrInterpolate(todayInspectionStats.value.excellentGood)}</span></div><div class="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded-lg"><span class="text-sm text-gray-600">合格</span><span class="font-semibold text-yellow-600">${ssrInterpolate(todayInspectionStats.value.pass)}</span></div><div class="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg"><span class="text-sm text-gray-600">不合格</span><span class="font-semibold text-red-600">${ssrInterpolate(todayInspectionStats.value.fail)}</span></div></div></div></div></div></div></div><div class="space-y-6"><div class="bg-white rounded-xl shadow-sm border border-gray-100"><div class="px-6 py-4 border-b border-gray-100"><h2 class="text-lg font-semibold text-gray-900">快速操作</h2></div><div class="p-4 space-y-2"><!--[-->`);
      ssrRenderList(quickActions.value, (action) => {
        _push(`<button class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"><div class="${ssrRenderClass([action.iconBg, "w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"])}"><span class="text-xl">${ssrInterpolate(action.icon)}</span></div><div class="flex-1"><p class="font-medium text-gray-900">${ssrInterpolate(action.label)}</p><p class="text-xs text-gray-400">${ssrInterpolate(action.description)}</p></div><span class="text-gray-300 group-hover:text-gray-400">→</span></button>`);
      });
      _push(`<!--]--></div></div><div class="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-sm p-6 text-white"><div class="flex items-center gap-3 mb-4"><span class="text-3xl">💡</span><div><h3 class="font-semibold">今日提示</h3><p class="text-primary-100 text-sm">${ssrInterpolate(todayTip.value)}</p></div></div><div class="space-y-2">`);
      if (statistics.value.criticalAlerts > 0) {
        _push(`<div class="flex items-center gap-2 text-sm"><span>⚠️</span><span>${ssrInterpolate(statistics.value.criticalAlerts)} 条紧急预警待处理</span></div>`);
      } else {
        _push(`<!---->`);
      }
      if (statistics.value.lowStockCount > 0) {
        _push(`<div class="flex items-center gap-2 text-sm"><span>📦</span><span>${ssrInterpolate(statistics.value.lowStockCount)} 种耗材库存不足</span></div>`);
      } else {
        _push(`<!---->`);
      }
      if (statistics.value.pendingRectifications > 0) {
        _push(`<div class="flex items-center gap-2 text-sm"><span>🔧</span><span>${ssrInterpolate(statistics.value.pendingRectifications)} 项整改待完成</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=index-BsKw5K7w.js.map
