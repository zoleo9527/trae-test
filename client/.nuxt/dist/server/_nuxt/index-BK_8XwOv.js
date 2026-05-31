import { defineComponent, computed, unref, useSSRContext, reactive, ref, mergeProps } from "vue";
import { ssrRenderTeleport, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrRenderStyle, ssrRenderAttr, ssrRenderAttrs, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderComponent } from "vue/server-renderer";
import { u as useDataStore, f as formatDate, a as addDays } from "./data-CvF3Pjf4.js";
import { u as useAuthStore } from "./auth-BO_zE_6L.js";
import { b as getOverallStatusColor, c as getOverallStatusText, d as getRectificationStatusColor, e as getRectificationStatusText } from "./formatters-B147ECSY.js";
import { f as useRouter } from "../server.mjs";
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
      return project?.name || "未知项目";
    });
    const inspectorName = computed(() => {
      if (!props.inspection) return "";
      const user = dataStore.staff.find((s) => s.id === props.inspection.inspectorId) || dataStore.staff.find((s) => s.id === props.inspection.inspectorId);
      return user?.name || "未知质检员";
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
        if (__props.visible) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"><div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"><div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between"><div><h2 class="text-xl font-bold text-gray-900">质检详情</h2><p class="text-sm text-gray-500 mt-1">${ssrInterpolate(projectName.value)} · ${ssrInterpolate(__props.inspection?.date)}</p></div><button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`);
          if (__props.inspection) {
            _push2(`<div class="flex-1 overflow-y-auto p-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"><div class="space-y-4"><div><p class="text-sm text-gray-500">质检员</p><p class="font-medium text-gray-900">${ssrInterpolate(inspectorName.value)}</p></div><div><p class="text-sm text-gray-500">总体评分</p><div class="flex items-end gap-2"><span class="${ssrRenderClass([getScoreColor(__props.inspection.score), "text-4xl font-bold"])}">${ssrInterpolate(__props.inspection.score)}</span><span class="text-gray-400 mb-1">/ 100</span></div></div><div><p class="text-sm text-gray-500">总体评价</p><span class="${ssrRenderClass([unref(getOverallStatusColor)(__props.inspection.overallStatus), "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1"])}">${ssrInterpolate(unref(getOverallStatusText)(__props.inspection.overallStatus))}</span></div></div><div class="space-y-4">`);
            if (__props.inspection.rectificationRequired) {
              _push2(`<div><p class="text-sm text-gray-500">整改要求</p><div class="mt-1 p-3 bg-red-50 rounded-lg border border-red-100"><div class="flex items-center gap-2 text-red-700"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><span class="font-medium">需要整改</span></div><p class="text-sm text-red-600 mt-1">截止日期：${ssrInterpolate(__props.inspection.rectificationDeadline)}</p></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div><p class="text-sm text-gray-500">备注</p><p class="text-gray-900 mt-1">${ssrInterpolate(__props.inspection.note || "无")}</p></div></div></div><div class="mb-6"><h3 class="text-lg font-semibold text-gray-900 mb-4">分项评分</h3><div class="space-y-3"><!--[-->`);
            ssrRenderList(__props.inspection.items, (item, index) => {
              _push2(`<div class="${ssrRenderClass([item.passed ? "bg-gray-50 border-gray-100" : "bg-red-50 border-red-100", "p-4 rounded-xl border transition-colors"])}"><div class="flex items-start justify-between"><div class="flex-1"><div class="flex items-center gap-2"><h4 class="font-medium text-gray-900">${ssrInterpolate(item.name)}</h4>`);
              if (!item.passed) {
                _push2(`<span class="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700"> 不合格 </span>`);
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
              _push2(`<div><h3 class="text-lg font-semibold text-gray-900 mb-4">质检照片</h3><div class="grid grid-cols-2 md:grid-cols-3 gap-3"><!--[-->`);
              ssrRenderList(__props.inspection.photos, (photo, index) => {
                _push2(`<div class="aspect-video rounded-lg overflow-hidden bg-gray-100"><img${ssrRenderAttr("src", photo)}${ssrRenderAttr("alt", `质检照片 ${index + 1}`)} class="w-full h-full object-cover"></div>`);
              });
              _push2(`<!--]--></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`<div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3"><button class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"> 关闭 </button>`);
          if (canViewRectification.value && __props.inspection?.rectificationRequired) {
            _push2(`<button class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"> 查看整改 </button>`);
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
      return project?.name || "未知项目";
    }
    function getInspectorName(inspectorId) {
      const staff = dataStore.staff.find((s) => s.id === inspectorId);
      return staff?.name || "未知质检员";
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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-6" }, _attrs))}><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold text-gray-900">质检管理</h1><p class="text-gray-500 mt-1">管理所有项目的质检记录</p></div>`);
      if (canCreate.value) {
        _push(`<button class="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> 新建质检 </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4"><div class="flex flex-wrap gap-4"><div class="flex-1 min-w-[200px]"><label class="block text-sm font-medium text-gray-700 mb-1">日期范围</label><div class="flex gap-2"><input${ssrRenderAttr("value", filters.startDate)} type="date" class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><span class="flex items-center text-gray-400">至</span><input${ssrRenderAttr("value", filters.endDate)} type="date" class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></div></div><div class="min-w-[180px]"><label class="block text-sm font-medium text-gray-700 mb-1">项目</label><select class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.projectId) ? ssrLooseContain(filters.projectId, "") : ssrLooseEqual(filters.projectId, "")) ? " selected" : ""}>全部项目</option><!--[-->`);
      ssrRenderList(unref(dataStore).projects, (project) => {
        _push(`<option${ssrRenderAttr("value", project.id)}${ssrIncludeBooleanAttr(Array.isArray(filters.projectId) ? ssrLooseContain(filters.projectId, project.id) : ssrLooseEqual(filters.projectId, project.id)) ? " selected" : ""}>${ssrInterpolate(project.name)}</option>`);
      });
      _push(`<!--]--></select></div><div class="min-w-[150px]"><label class="block text-sm font-medium text-gray-700 mb-1">评分等级</label><select class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "") : ssrLooseEqual(filters.status, "")) ? " selected" : ""}>全部</option><option value="excellent"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "excellent") : ssrLooseEqual(filters.status, "excellent")) ? " selected" : ""}>优秀</option><option value="good"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "good") : ssrLooseEqual(filters.status, "good")) ? " selected" : ""}>良好</option><option value="pass"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "pass") : ssrLooseEqual(filters.status, "pass")) ? " selected" : ""}>合格</option><option value="fail"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "fail") : ssrLooseEqual(filters.status, "fail")) ? " selected" : ""}>不合格</option></select></div><div class="flex items-end gap-2"><button class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"> 重置 </button></div></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-4"><div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p class="text-sm text-gray-500">总质检次数</p><p class="text-2xl font-bold text-gray-900 mt-1">${ssrInterpolate(filteredInspections.value.length)}</p></div><div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p class="text-sm text-gray-500">优秀/良好</p><p class="text-2xl font-bold text-green-600 mt-1">${ssrInterpolate(stats.value.excellentGood)}</p></div><div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p class="text-sm text-gray-500">合格率</p><p class="text-2xl font-bold text-blue-600 mt-1">${ssrInterpolate(stats.value.passRate)}%</p></div><div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p class="text-sm text-gray-500">需整改</p><p class="text-2xl font-bold text-red-600 mt-1">${ssrInterpolate(stats.value.needRectification)}</p></div></div><div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"><div class="overflow-x-auto"><table class="w-full"><thead><tr class="bg-gray-50 border-b border-gray-100"><th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">日期</th><th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">项目</th><th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">质检员</th><th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">评分</th><th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">总体评价</th><th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">整改状态</th><th class="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th></tr></thead><tbody class="divide-y divide-gray-50"><!--[-->`);
      ssrRenderList(filteredInspections.value, (inspection) => {
        _push(`<tr class="${ssrRenderClass([{ "bg-red-50": inspection.overallStatus === "fail" }, "transition-colors hover:bg-gray-50"])}"><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${ssrInterpolate(inspection.date)}</td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${ssrInterpolate(getProjectName(inspection.projectId))}</div></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${ssrInterpolate(getInspectorName(inspection.inspectorId))}</td><td class="px-6 py-4 whitespace-nowrap"><span class="${ssrRenderClass([getScoreColor(inspection.score), "text-lg font-bold"])}">${ssrInterpolate(inspection.score)}</span></td><td class="px-6 py-4 whitespace-nowrap"><span class="${ssrRenderClass([unref(getOverallStatusColor)(inspection.overallStatus), "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"])}">${ssrInterpolate(unref(getOverallStatusText)(inspection.overallStatus))}</span></td><td class="px-6 py-4 whitespace-nowrap">`);
        if (inspection.rectificationRequired) {
          _push(`<div class="flex items-center gap-2"><span class="${ssrRenderClass([unref(getRectificationStatusColor)(inspection.rectificationStatus), "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"])}">${ssrInterpolate(unref(getRectificationStatusText)(inspection.rectificationStatus))}</span>`);
          if (inspection.rectificationStatus === "overdue") {
            _push(`<span class="text-red-500 text-xs">⚠️ 逾期</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<span class="text-sm text-gray-400">无需整改</span>`);
        }
        _push(`</td><td class="px-6 py-4 whitespace-nowrap text-right text-sm"><button class="text-primary-600 hover:text-primary-800 font-medium"> 查看详情 </button></td></tr>`);
      });
      _push(`<!--]-->`);
      if (filteredInspections.value.length === 0) {
        _push(`<tr><td colspan="7" class="px-6 py-12 text-center text-gray-400"><span class="text-4xl mb-3 block">📋</span><p>暂无质检记录</p></td></tr>`);
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
export {
  _sfc_main as default
};
//# sourceMappingURL=index-BK_8XwOv.js.map
