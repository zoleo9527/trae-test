import { defineComponent, reactive, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrInterpolate, ssrRenderClass, ssrRenderComponent, ssrRenderTeleport, ssrRenderStyle } from 'vue/server-renderer';
import { u as useDataStore, f as formatDate, a as addDays } from './data-CvF3Pjf4.mjs';
import { u as useAuthStore } from './auth-BO_zE_6L.mjs';
import { b as getOverallStatusColor, c as getOverallStatusText, d as getRectificationStatusColor, e as getRectificationStatusText } from './formatters-B147ECSY.mjs';
import { f as useRouter } from './server.mjs';
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
  __name: "InspectionDetailModal",
  __ssrInlineRender: true,
  props: {
    visible: { type: Boolean },
    inspection: {}
  },
  emits: ["close", "viewRectification"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const dataStore = useDataStore();
    const authStore = useAuthStore();
    const projectName = computed(() => {
      if (!props.inspection) return "";
      const project = dataStore.getProjectById(props.inspection.projectId);
      return (project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE";
    });
    const inspectorName = computed(() => {
      if (!props.inspection) return "";
      const user = dataStore.staff.find((s) => s.id === props.inspection.inspectorId) || dataStore.staff.find((s) => s.id === props.inspection.inspectorId);
      return (user == null ? void 0 : user.name) || "\u672A\u77E5\u8D28\u68C0\u5458";
    });
    const canViewRectification = computed(() => {
      return authStore.hasPermission(["project_manager", "quality_inspector"]);
    });
    function getScoreColor(score) {
      if (score >= 90) return "text-green-600";
      if (score >= 80) return "text-blue-600";
      if (score >= 60) return "text-yellow-600";
      return "text-red-600";
    }
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderTeleport(_push, (_push2) => {
        var _a, _b;
        if (__props.visible) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"><div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"><div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between"><div><h2 class="text-xl font-bold text-gray-900">\u8D28\u68C0\u8BE6\u60C5</h2><p class="text-sm text-gray-500 mt-1">${ssrInterpolate(projectName.value)} \xB7 ${ssrInterpolate((_a = __props.inspection) == null ? void 0 : _a.date)}</p></div><button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`);
          if (__props.inspection) {
            _push2(`<div class="flex-1 overflow-y-auto p-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"><div class="space-y-4"><div><p class="text-sm text-gray-500">\u8D28\u68C0\u5458</p><p class="font-medium text-gray-900">${ssrInterpolate(inspectorName.value)}</p></div><div><p class="text-sm text-gray-500">\u603B\u4F53\u8BC4\u5206</p><div class="flex items-end gap-2"><span class="${ssrRenderClass([getScoreColor(__props.inspection.score), "text-4xl font-bold"])}">${ssrInterpolate(__props.inspection.score)}</span><span class="text-gray-400 mb-1">/ 100</span></div></div><div><p class="text-sm text-gray-500">\u603B\u4F53\u8BC4\u4EF7</p><span class="${ssrRenderClass([unref(getOverallStatusColor)(__props.inspection.overallStatus), "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1"])}">${ssrInterpolate(unref(getOverallStatusText)(__props.inspection.overallStatus))}</span></div></div><div class="space-y-4">`);
            if (__props.inspection.rectificationRequired) {
              _push2(`<div><p class="text-sm text-gray-500">\u6574\u6539\u8981\u6C42</p><div class="mt-1 p-3 bg-red-50 rounded-lg border border-red-100"><div class="flex items-center gap-2 text-red-700"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><span class="font-medium">\u9700\u8981\u6574\u6539</span></div><p class="text-sm text-red-600 mt-1">\u622A\u6B62\u65E5\u671F\uFF1A${ssrInterpolate(__props.inspection.rectificationDeadline)}</p></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div><p class="text-sm text-gray-500">\u5907\u6CE8</p><p class="text-gray-900 mt-1">${ssrInterpolate(__props.inspection.note || "\u65E0")}</p></div></div></div><div class="mb-6"><h3 class="text-lg font-semibold text-gray-900 mb-4">\u5206\u9879\u8BC4\u5206</h3><div class="space-y-3"><!--[-->`);
            ssrRenderList(__props.inspection.items, (item, index) => {
              _push2(`<div class="${ssrRenderClass([item.passed ? "bg-gray-50 border-gray-100" : "bg-red-50 border-red-100", "p-4 rounded-xl border transition-colors"])}"><div class="flex items-start justify-between"><div class="flex-1"><div class="flex items-center gap-2"><h4 class="font-medium text-gray-900">${ssrInterpolate(item.name)}</h4>`);
              if (!item.passed) {
                _push2(`<span class="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700"> \u4E0D\u5408\u683C </span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
              if (item.note) {
                _push2(`<p class="text-sm text-gray-500 mt-1">${ssrInterpolate(item.note)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="text-right ml-4"><span class="${ssrRenderClass([item.passed ? "text-green-600" : "text-red-600", "text-2xl font-bold"])}">${ssrInterpolate(item.score)}</span><span class="text-gray-400"> / ${ssrInterpolate(item.maxScore)}</span></div></div><div class="mt-3 w-full bg-gray-200 rounded-full h-2"><div class="${ssrRenderClass([item.passed ? "bg-green-500" : "bg-red-500", "h-2 rounded-full transition-all"])}" style="${ssrRenderStyle({ width: `${item.score / item.maxScore * 100}%` })}"></div></div></div>`);
            });
            _push2(`<!--]--></div></div>`);
            if (__props.inspection.photos.length > 0) {
              _push2(`<div><h3 class="text-lg font-semibold text-gray-900 mb-4">\u8D28\u68C0\u7167\u7247</h3><div class="grid grid-cols-2 md:grid-cols-3 gap-3"><!--[-->`);
              ssrRenderList(__props.inspection.photos, (photo, index) => {
                _push2(`<div class="aspect-video rounded-lg overflow-hidden bg-gray-100"><img${ssrRenderAttr("src", photo)}${ssrRenderAttr("alt", `\u8D28\u68C0\u7167\u7247 ${index + 1}`)} class="w-full h-full object-cover"></div>`);
              });
              _push2(`<!--]--></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`<div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3"><button class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"> \u5173\u95ED </button>`);
          if (canViewRectification.value && ((_b = __props.inspection) == null ? void 0 : _b.rectificationRequired)) {
            _push2(`<button class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"> \u67E5\u770B\u6574\u6539 </button>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/InspectionDetailModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const dataStore = useDataStore();
    const authStore = useAuthStore();
    const router = useRouter();
    const filters = reactive({
      startDate: addDays(formatDate(/* @__PURE__ */ new Date()), -30),
      endDate: formatDate(/* @__PURE__ */ new Date()),
      projectId: "",
      status: ""
    });
    const detailModalVisible = ref(false);
    const selectedInspection = ref(null);
    const canCreate = computed(() => {
      return authStore.hasPermission(["quality_inspector", "project_manager"]);
    });
    const filteredInspections = computed(() => {
      return dataStore.inspections.filter((inspection) => {
        if (filters.startDate && inspection.date < filters.startDate) return false;
        if (filters.endDate && inspection.date > filters.endDate) return false;
        if (filters.projectId && inspection.projectId !== filters.projectId) return false;
        if (filters.status && inspection.overallStatus !== filters.status) return false;
        return true;
      }).sort((a, b) => b.date.localeCompare(a.date));
    });
    const stats = computed(() => {
      const inspections = filteredInspections.value;
      const excellentGood = inspections.filter((i) => i.overallStatus === "excellent" || i.overallStatus === "good").length;
      const passed = inspections.filter((i) => i.overallStatus !== "fail").length;
      const needRectification = inspections.filter((i) => i.rectificationRequired).length;
      return {
        excellentGood,
        passRate: inspections.length > 0 ? Math.round(passed / inspections.length * 100) : 0,
        needRectification
      };
    });
    function getProjectName(projectId) {
      const project = dataStore.getProjectById(projectId);
      return (project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE";
    }
    function getInspectorName(inspectorId) {
      const staff = dataStore.staff.find((s) => s.id === inspectorId);
      return (staff == null ? void 0 : staff.name) || "\u672A\u77E5\u8D28\u68C0\u5458";
    }
    function getScoreColor(score) {
      if (score >= 90) return "text-green-600";
      if (score >= 80) return "text-blue-600";
      if (score >= 60) return "text-yellow-600";
      return "text-red-600";
    }
    function handleViewRectification(inspectionId) {
      detailModalVisible.value = false;
      router.push({ path: "/rectification", query: { inspectionId } });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-6" }, _attrs))}><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold text-gray-900">\u8D28\u68C0\u7BA1\u7406</h1><p class="text-gray-500 mt-1">\u7BA1\u7406\u6240\u6709\u9879\u76EE\u7684\u8D28\u68C0\u8BB0\u5F55</p></div>`);
      if (canCreate.value) {
        _push(`<button class="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> \u65B0\u5EFA\u8D28\u68C0 </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4"><div class="flex flex-wrap gap-4"><div class="flex-1 min-w-[200px]"><label class="block text-sm font-medium text-gray-700 mb-1">\u65E5\u671F\u8303\u56F4</label><div class="flex gap-2"><input${ssrRenderAttr("value", filters.startDate)} type="date" class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><span class="flex items-center text-gray-400">\u81F3</span><input${ssrRenderAttr("value", filters.endDate)} type="date" class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></div></div><div class="min-w-[180px]"><label class="block text-sm font-medium text-gray-700 mb-1">\u9879\u76EE</label><select class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.projectId) ? ssrLooseContain(filters.projectId, "") : ssrLooseEqual(filters.projectId, "")) ? " selected" : ""}>\u5168\u90E8\u9879\u76EE</option><!--[-->`);
      ssrRenderList(unref(dataStore).projects, (project) => {
        _push(`<option${ssrRenderAttr("value", project.id)}${ssrIncludeBooleanAttr(Array.isArray(filters.projectId) ? ssrLooseContain(filters.projectId, project.id) : ssrLooseEqual(filters.projectId, project.id)) ? " selected" : ""}>${ssrInterpolate(project.name)}</option>`);
      });
      _push(`<!--]--></select></div><div class="min-w-[150px]"><label class="block text-sm font-medium text-gray-700 mb-1">\u8BC4\u5206\u7B49\u7EA7</label><select class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "") : ssrLooseEqual(filters.status, "")) ? " selected" : ""}>\u5168\u90E8</option><option value="excellent"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "excellent") : ssrLooseEqual(filters.status, "excellent")) ? " selected" : ""}>\u4F18\u79C0</option><option value="good"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "good") : ssrLooseEqual(filters.status, "good")) ? " selected" : ""}>\u826F\u597D</option><option value="pass"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "pass") : ssrLooseEqual(filters.status, "pass")) ? " selected" : ""}>\u5408\u683C</option><option value="fail"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "fail") : ssrLooseEqual(filters.status, "fail")) ? " selected" : ""}>\u4E0D\u5408\u683C</option></select></div><div class="flex items-end gap-2"><button class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"> \u91CD\u7F6E </button></div></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-4"><div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p class="text-sm text-gray-500">\u603B\u8D28\u68C0\u6B21\u6570</p><p class="text-2xl font-bold text-gray-900 mt-1">${ssrInterpolate(filteredInspections.value.length)}</p></div><div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p class="text-sm text-gray-500">\u4F18\u79C0/\u826F\u597D</p><p class="text-2xl font-bold text-green-600 mt-1">${ssrInterpolate(stats.value.excellentGood)}</p></div><div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p class="text-sm text-gray-500">\u5408\u683C\u7387</p><p class="text-2xl font-bold text-blue-600 mt-1">${ssrInterpolate(stats.value.passRate)}%</p></div><div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p class="text-sm text-gray-500">\u9700\u6574\u6539</p><p class="text-2xl font-bold text-red-600 mt-1">${ssrInterpolate(stats.value.needRectification)}</p></div></div><div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"><div class="overflow-x-auto"><table class="w-full"><thead><tr class="bg-gray-50 border-b border-gray-100"><th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">\u65E5\u671F</th><th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">\u9879\u76EE</th><th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">\u8D28\u68C0\u5458</th><th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">\u8BC4\u5206</th><th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">\u603B\u4F53\u8BC4\u4EF7</th><th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">\u6574\u6539\u72B6\u6001</th><th class="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">\u64CD\u4F5C</th></tr></thead><tbody class="divide-y divide-gray-50"><!--[-->`);
      ssrRenderList(filteredInspections.value, (inspection) => {
        _push(`<tr class="${ssrRenderClass([{ "bg-red-50": inspection.overallStatus === "fail" }, "transition-colors hover:bg-gray-50"])}"><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${ssrInterpolate(inspection.date)}</td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${ssrInterpolate(getProjectName(inspection.projectId))}</div></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${ssrInterpolate(getInspectorName(inspection.inspectorId))}</td><td class="px-6 py-4 whitespace-nowrap"><span class="${ssrRenderClass([getScoreColor(inspection.score), "text-lg font-bold"])}">${ssrInterpolate(inspection.score)}</span></td><td class="px-6 py-4 whitespace-nowrap"><span class="${ssrRenderClass([unref(getOverallStatusColor)(inspection.overallStatus), "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"])}">${ssrInterpolate(unref(getOverallStatusText)(inspection.overallStatus))}</span></td><td class="px-6 py-4 whitespace-nowrap">`);
        if (inspection.rectificationRequired) {
          _push(`<div class="flex items-center gap-2"><span class="${ssrRenderClass([unref(getRectificationStatusColor)(inspection.rectificationStatus), "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"])}">${ssrInterpolate(unref(getRectificationStatusText)(inspection.rectificationStatus))}</span>`);
          if (inspection.rectificationStatus === "overdue") {
            _push(`<span class="text-red-500 text-xs">\u26A0\uFE0F \u903E\u671F</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<span class="text-sm text-gray-400">\u65E0\u9700\u6574\u6539</span>`);
        }
        _push(`</td><td class="px-6 py-4 whitespace-nowrap text-right text-sm"><button class="text-primary-600 hover:text-primary-800 font-medium"> \u67E5\u770B\u8BE6\u60C5 </button></td></tr>`);
      });
      _push(`<!--]-->`);
      if (filteredInspections.value.length === 0) {
        _push(`<tr><td colspan="7" class="px-6 py-12 text-center text-gray-400"><span class="text-4xl mb-3 block">\u{1F4CB}</span><p>\u6682\u65E0\u8D28\u68C0\u8BB0\u5F55</p></td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</tbody></table></div></div>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        visible: detailModalVisible.value,
        inspection: selectedInspection.value,
        onClose: ($event) => detailModalVisible.value = false,
        onViewRectification: handleViewRectification
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/quality/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BK_8XwOv.mjs.map
