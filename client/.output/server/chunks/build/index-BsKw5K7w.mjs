import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
import { u as useDataStore, f as formatDate } from './data-CvF3Pjf4.mjs';
import { u as useAuthStore } from './auth-BO_zE_6L.mjs';
import { h as getRoleText, g as getAlertTypeText } from './formatters-B147ECSY.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const dataStore = useDataStore();
    const authStore = useAuthStore();
    const selectedRole = ref(authStore.currentRole);
    const todayFormatted = computed(() => {
      const date = /* @__PURE__ */ new Date();
      const weekdays = ["\u5468\u65E5", "\u5468\u4E00", "\u5468\u4E8C", "\u5468\u4E09", "\u5468\u56DB", "\u5468\u4E94", "\u5468\u516D"];
      return `${date.getFullYear()}\u5E74${date.getMonth() + 1}\u6708${date.getDate()}\u65E5 ${weekdays[date.getDay()]}`;
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
        label: "\u9879\u76EE\u603B\u6570",
        value: statistics.value.totalProjects,
        subLabel: statistics.value.expiringProjects > 0 ? `${statistics.value.expiringProjects} \u4E2A\u5373\u5C06\u5230\u671F` : void 0,
        icon: "\u{1F3E2}",
        iconBg: "bg-blue-100",
        valueColor: "text-blue-600"
      },
      {
        key: "todaySchedules",
        label: "\u4ECA\u65E5\u6392\u73ED",
        value: statistics.value.todaySchedules,
        subLabel: `\u5DF2\u5B8C\u6210 ${statistics.value.todayCompleted}`,
        icon: "\u{1F4C5}",
        iconBg: "bg-green-100",
        valueColor: "text-green-600"
      },
      {
        key: "pendingRequisitions",
        label: "\u5F85\u5904\u7406\u7533\u9886",
        value: statistics.value.pendingRequisitions,
        icon: "\u{1F4DD}",
        iconBg: "bg-yellow-100",
        valueColor: "text-yellow-600"
      },
      {
        key: "lowStockCount",
        label: "\u5E93\u5B58\u9884\u8B66",
        value: statistics.value.lowStockCount,
        icon: "\u{1F4E6}",
        iconBg: "bg-orange-100",
        valueColor: "text-orange-600"
      },
      {
        key: "pendingRectifications",
        label: "\u5F85\u6574\u6539",
        value: statistics.value.pendingRectifications,
        icon: "\u{1F527}",
        iconBg: "bg-red-100",
        valueColor: "text-red-600"
      },
      {
        key: "criticalAlerts",
        label: "\u7D27\u6025\u9884\u8B66",
        value: statistics.value.criticalAlerts,
        subLabel: statistics.value.openAlerts > 0 ? `\u5171 ${statistics.value.openAlerts} \u6761\u9884\u8B66` : void 0,
        icon: "\u{1F6A8}",
        iconBg: "bg-red-100",
        valueColor: "text-red-600"
      }
    ]);
    const quickActions = computed(() => {
      const role = currentRole.value;
      const actions = [];
      if (role === "project_manager") {
        actions.push(
          { key: "view_projects", label: "\u67E5\u770B\u9879\u76EE", description: "\u7BA1\u7406\u6240\u6709\u9879\u76EE\u4FE1\u606F", icon: "\u{1F3E2}", iconBg: "bg-blue-100" },
          { key: "approve_requisitions", label: "\u5BA1\u6279\u7533\u9886", description: `\u5F85\u5904\u7406 ${statistics.value.pendingRequisitions} \u6761`, icon: "\u2705", iconBg: "bg-green-100" },
          { key: "view_alerts", label: "\u9884\u8B66\u7BA1\u7406", description: `\u672A\u5904\u7406 ${statistics.value.openAlerts} \u6761`, icon: "\u{1F6A8}", iconBg: "bg-red-100" },
          { key: "view_reports", label: "\u6570\u636E\u62A5\u8868", description: "\u67E5\u770B\u8FD0\u8425\u6570\u636E\u7EDF\u8BA1", icon: "\u{1F4CA}", iconBg: "bg-purple-100" }
        );
      } else if (role === "scheduling_specialist") {
        actions.push(
          { key: "create_schedule", label: "\u521B\u5EFA\u6392\u73ED", description: "\u5B89\u6392\u4EBA\u5458\u6392\u73ED\u8BA1\u5212", icon: "\u{1F4C5}", iconBg: "bg-blue-100" },
          { key: "view_schedules", label: "\u6392\u73ED\u7BA1\u7406", description: `\u4ECA\u65E5 ${statistics.value.todaySchedules} \u6761\u6392\u73ED`, icon: "\u{1F4CB}", iconBg: "bg-green-100" },
          { key: "view_punches", label: "\u6253\u5361\u8BB0\u5F55", description: "\u67E5\u770B\u4EBA\u5458\u6253\u5361\u60C5\u51B5", icon: "\u{1F550}", iconBg: "bg-yellow-100" },
          { key: "view_staff", label: "\u4EBA\u5458\u7BA1\u7406", description: "\u7BA1\u7406\u6E05\u6D01\u4EBA\u5458\u4FE1\u606F", icon: "\u{1F465}", iconBg: "bg-purple-100" }
        );
      } else if (role === "quality_inspector") {
        actions.push(
          { key: "create_inspection", label: "\u521B\u5EFA\u8D28\u68C0", description: "\u53D1\u8D77\u65B0\u7684\u8D28\u68C0\u4EFB\u52A1", icon: "\u2705", iconBg: "bg-blue-100" },
          { key: "view_inspections", label: "\u8D28\u68C0\u8BB0\u5F55", description: "\u67E5\u770B\u5386\u53F2\u8D28\u68C0\u8BB0\u5F55", icon: "\u{1F4CB}", iconBg: "bg-green-100" },
          { key: "view_rectifications", label: "\u6574\u6539\u7BA1\u7406", description: `\u5F85\u6574\u6539 ${statistics.value.pendingRectifications} \u9879`, icon: "\u{1F527}", iconBg: "bg-red-100" },
          { key: "view_supplies", label: "\u5E93\u5B58\u7BA1\u7406", description: `\u5E93\u5B58\u9884\u8B66 ${statistics.value.lowStockCount} \u9879`, icon: "\u{1F4E6}", iconBg: "bg-orange-100" }
        );
      }
      return actions;
    });
    const todayTip = computed(() => {
      const role = currentRole.value;
      if (role === "project_manager") {
        return "\u53CA\u65F6\u5BA1\u6279\u7533\u9886\uFF0C\u5173\u6CE8\u9879\u76EE\u5408\u540C\u5230\u671F\u60C5\u51B5";
      } else if (role === "scheduling_specialist") {
        return "\u5408\u7406\u5B89\u6392\u6392\u73ED\uFF0C\u786E\u4FDD\u4EBA\u5458\u8986\u76D6\u6240\u6709\u9879\u76EE";
      } else {
        return "\u8BA4\u771F\u5B8C\u6210\u8D28\u68C0\uFF0C\u53CA\u65F6\u8DDF\u8FDB\u6574\u6539\u60C5\u51B5";
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
        critical: "\u7D27\u6025",
        warning: "\u8B66\u544A",
        info: "\u63D0\u793A"
      };
      return textMap[severity];
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
    function formatTime(isoString) {
      const date = new Date(isoString);
      const now = /* @__PURE__ */ new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 6e4);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      if (diffMins < 60) {
        return `${diffMins} \u5206\u949F\u524D`;
      } else if (diffHours < 24) {
        return `${diffHours} \u5C0F\u65F6\u524D`;
      } else if (diffDays < 7) {
        return `${diffDays} \u5929\u524D`;
      } else {
        return date.toLocaleDateString("zh-CN");
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-6" }, _attrs))}><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold text-gray-900">\u4EEA\u8868\u76D8</h1><p class="text-gray-500 mt-1">${ssrInterpolate(todayFormatted.value)} \xB7 ${ssrInterpolate(unref(getRoleText)(currentRole.value))}</p></div><div class="flex items-center gap-3"><span class="text-sm text-gray-500">\u5207\u6362\u89D2\u8272\uFF1A</span><select class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="project_manager"${ssrIncludeBooleanAttr(Array.isArray(selectedRole.value) ? ssrLooseContain(selectedRole.value, "project_manager") : ssrLooseEqual(selectedRole.value, "project_manager")) ? " selected" : ""}>\u9879\u76EE\u4E3B\u7BA1</option><option value="scheduling_specialist"${ssrIncludeBooleanAttr(Array.isArray(selectedRole.value) ? ssrLooseContain(selectedRole.value, "scheduling_specialist") : ssrLooseEqual(selectedRole.value, "scheduling_specialist")) ? " selected" : ""}>\u6392\u73ED\u4E13\u5458</option><option value="quality_inspector"${ssrIncludeBooleanAttr(Array.isArray(selectedRole.value) ? ssrLooseContain(selectedRole.value, "quality_inspector") : ssrLooseEqual(selectedRole.value, "quality_inspector")) ? " selected" : ""}>\u8D28\u68C0\u5458</option></select></div></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"><!--[-->`);
      ssrRenderList(statCards.value, (card) => {
        _push(`<div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer"><div class="flex items-start justify-between"><div><p class="text-sm text-gray-500 mb-1">${ssrInterpolate(card.label)}</p><p class="${ssrRenderClass([card.valueColor, "text-3xl font-bold"])}">${ssrInterpolate(card.value)}</p>`);
        if (card.subLabel) {
          _push(`<p class="text-xs text-gray-400 mt-2">${ssrInterpolate(card.subLabel)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="${ssrRenderClass([card.iconBg, "w-12 h-12 rounded-xl flex items-center justify-center"])}"><span class="text-2xl">${ssrInterpolate(card.icon)}</span></div></div></div>`);
      });
      _push(`<!--]--></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-2 space-y-6"><div class="bg-white rounded-xl shadow-sm border border-gray-100"><div class="px-6 py-4 border-b border-gray-100"><div class="flex items-center justify-between"><h2 class="text-lg font-semibold text-gray-900">\u9884\u8B66\u5217\u8868</h2><span class="text-sm text-gray-500">\u5171 ${ssrInterpolate(openAlerts.value.length)} \u6761\u672A\u5904\u7406</span></div></div><div class="divide-y divide-gray-50"><!--[-->`);
      ssrRenderList(openAlerts.value, (alert) => {
        _push(`<div class="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"><div class="flex items-start gap-4"><div class="${ssrRenderClass([getAlertSeverityBg(alert.severity), "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"])}"><span class="text-xl">${ssrInterpolate(getAlertIcon(alert.type))}</span></div><div class="flex-1 min-w-0"><div class="flex items-center gap-2"><h3 class="font-medium text-gray-900 truncate">${ssrInterpolate(alert.title)}</h3><span class="${ssrRenderClass([getSeverityBadgeClass(alert.severity), "px-2 py-0.5 text-xs rounded-full flex-shrink-0"])}">${ssrInterpolate(getSeverityText(alert.severity))}</span></div><p class="text-sm text-gray-500 mt-1 line-clamp-2">${ssrInterpolate(alert.description)}</p><div class="flex items-center gap-4 mt-2 text-xs text-gray-400"><span>${ssrInterpolate(unref(getAlertTypeText)(alert.type))}</span><span>${ssrInterpolate(formatTime(alert.createdAt))}</span></div></div><button class="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0"> \u5904\u7406 </button></div></div>`);
      });
      _push(`<!--]-->`);
      if (openAlerts.value.length === 0) {
        _push(`<div class="px-6 py-12 text-center text-gray-400"><span class="text-4xl mb-3 block">\u{1F389}</span><p>\u6682\u65E0\u9884\u8B66\uFF0C\u4E00\u5207\u6B63\u5E38</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="bg-white rounded-xl shadow-sm border border-gray-100"><div class="px-6 py-4 border-b border-gray-100"><h2 class="text-lg font-semibold text-gray-900">\u4ECA\u65E5\u6982\u89C8</h2></div><div class="p-6"><div class="grid grid-cols-1 md:grid-cols-3 gap-6"><div class="space-y-4"><div class="flex items-center gap-2"><span class="text-xl">\u{1F4CB}</span><h3 class="font-medium text-gray-900">\u4ECA\u65E5\u6392\u73ED</h3></div><div class="space-y-2"><div class="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg"><span class="text-sm text-gray-600">\u6392\u73ED\u603B\u6570</span><span class="font-semibold text-blue-600">${ssrInterpolate(statistics.value.todaySchedules)}</span></div><div class="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg"><span class="text-sm text-gray-600">\u5DF2\u5B8C\u6210</span><span class="font-semibold text-green-600">${ssrInterpolate(statistics.value.todayCompleted)}</span></div><div class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"><span class="text-sm text-gray-600">\u8FDB\u884C\u4E2D</span><span class="font-semibold text-gray-600">${ssrInterpolate(statistics.value.todaySchedules - statistics.value.todayCompleted)}</span></div></div></div><div class="space-y-4"><div class="flex items-center gap-2"><span class="text-xl">\u{1F550}</span><h3 class="font-medium text-gray-900">\u6253\u5361\u60C5\u51B5</h3></div><div class="space-y-2"><div class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"><span class="text-sm text-gray-600">\u6B63\u5E38\u6253\u5361</span><span class="font-semibold text-gray-600">${ssrInterpolate(todayPunchStats.value.normal)}</span></div><div class="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded-lg"><span class="text-sm text-gray-600">\u8FDF\u5230</span><span class="font-semibold text-yellow-600">${ssrInterpolate(todayPunchStats.value.late)}</span></div><div class="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg"><span class="text-sm text-gray-600">\u7F3A\u52E4</span><span class="font-semibold text-red-600">${ssrInterpolate(todayPunchStats.value.absent)}</span></div></div></div><div class="space-y-4"><div class="flex items-center gap-2"><span class="text-xl">\u2705</span><h3 class="font-medium text-gray-900">\u8D28\u68C0\u60C5\u51B5</h3></div><div class="space-y-2"><div class="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg"><span class="text-sm text-gray-600">\u4F18\u79C0/\u826F\u597D</span><span class="font-semibold text-green-600">${ssrInterpolate(todayInspectionStats.value.excellentGood)}</span></div><div class="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded-lg"><span class="text-sm text-gray-600">\u5408\u683C</span><span class="font-semibold text-yellow-600">${ssrInterpolate(todayInspectionStats.value.pass)}</span></div><div class="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg"><span class="text-sm text-gray-600">\u4E0D\u5408\u683C</span><span class="font-semibold text-red-600">${ssrInterpolate(todayInspectionStats.value.fail)}</span></div></div></div></div></div></div></div><div class="space-y-6"><div class="bg-white rounded-xl shadow-sm border border-gray-100"><div class="px-6 py-4 border-b border-gray-100"><h2 class="text-lg font-semibold text-gray-900">\u5FEB\u901F\u64CD\u4F5C</h2></div><div class="p-4 space-y-2"><!--[-->`);
      ssrRenderList(quickActions.value, (action) => {
        _push(`<button class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"><div class="${ssrRenderClass([action.iconBg, "w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"])}"><span class="text-xl">${ssrInterpolate(action.icon)}</span></div><div class="flex-1"><p class="font-medium text-gray-900">${ssrInterpolate(action.label)}</p><p class="text-xs text-gray-400">${ssrInterpolate(action.description)}</p></div><span class="text-gray-300 group-hover:text-gray-400">\u2192</span></button>`);
      });
      _push(`<!--]--></div></div><div class="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-sm p-6 text-white"><div class="flex items-center gap-3 mb-4"><span class="text-3xl">\u{1F4A1}</span><div><h3 class="font-semibold">\u4ECA\u65E5\u63D0\u793A</h3><p class="text-primary-100 text-sm">${ssrInterpolate(todayTip.value)}</p></div></div><div class="space-y-2">`);
      if (statistics.value.criticalAlerts > 0) {
        _push(`<div class="flex items-center gap-2 text-sm"><span>\u26A0\uFE0F</span><span>${ssrInterpolate(statistics.value.criticalAlerts)} \u6761\u7D27\u6025\u9884\u8B66\u5F85\u5904\u7406</span></div>`);
      } else {
        _push(`<!---->`);
      }
      if (statistics.value.lowStockCount > 0) {
        _push(`<div class="flex items-center gap-2 text-sm"><span>\u{1F4E6}</span><span>${ssrInterpolate(statistics.value.lowStockCount)} \u79CD\u8017\u6750\u5E93\u5B58\u4E0D\u8DB3</span></div>`);
      } else {
        _push(`<!---->`);
      }
      if (statistics.value.pendingRectifications > 0) {
        _push(`<div class="flex items-center gap-2 text-sm"><span>\u{1F527}</span><span>${ssrInterpolate(statistics.value.pendingRectifications)} \u9879\u6574\u6539\u5F85\u5B8C\u6210</span></div>`);
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

export { _sfc_main as default };
//# sourceMappingURL=index-BsKw5K7w.mjs.map
