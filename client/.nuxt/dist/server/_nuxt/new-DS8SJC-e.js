import { _ as __nuxt_component_0 } from "./nuxt-link-BqY1MNSU.js";
import { defineComponent, ref, computed, mergeProps, withCtx, openBlock, createBlock, createVNode, createTextVNode, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderTeleport } from "vue/server-renderer";
import { u as useDataStore, f as formatDate } from "./data-CvF3Pjf4.js";
import { u as useAuthStore } from "./auth-BO_zE_6L.js";
import { f as formatCurrency } from "./formatters-B147ECSY.js";
import { c as useRoute, f as useRouter, a as _export_sfc } from "../server.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/ufo/dist/index.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/defu/dist/defu.mjs";
import "dayjs";
import "dayjs/locale/zh-cn.js";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/hookable/dist/index.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/unctx/dist/index.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/klona/dist/index.mjs";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "new",
  __ssrInlineRender: true,
  setup(__props) {
    useRoute();
    useRouter();
    const dataStore = useDataStore();
    useAuthStore();
    const selectedProjectId = ref("");
    const note = ref("");
    const items = ref([]);
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastType = ref("success");
    const today = computed(() => formatDate(/* @__PURE__ */ new Date()));
    const projects = computed(() => dataStore.projects.filter((p) => p.status === "active"));
    const supplies = computed(() => dataStore.supplies);
    const availableSupplies = computed(() => {
      return supplies.value.sort((a, b) => {
        const statusA = a.currentStock <= a.warningStock ? 0 : a.currentStock <= a.safeStock ? 1 : 2;
        const statusB = b.currentStock <= b.warningStock ? 0 : b.currentStock <= b.safeStock ? 1 : 2;
        return statusA - statusB;
      });
    });
    const totalQuantity = computed(() => {
      return items.value.reduce((sum, item) => sum + (item.quantity || 0), 0);
    });
    const totalAmount = computed(() => {
      return items.value.reduce((sum, item) => sum + getItemAmount(item), 0);
    });
    const canSubmit = computed(() => {
      return selectedProjectId.value && items.value.length > 0 && items.value.every((item) => item.supplyId && item.quantity > 0);
    });
    const canSave = computed(() => {
      return selectedProjectId.value || items.value.length > 0;
    });
    function isSupplySelected(supplyId, currentIndex) {
      return items.value.some((item, idx) => idx !== currentIndex && item.supplyId === supplyId);
    }
    function getSupplyUnit(supplyId) {
      const supply = supplies.value.find((s) => s.id === supplyId);
      return supply?.unit || "";
    }
    function getItemAmount(item) {
      if (item.unitPrice && item.quantity) {
        return item.unitPrice * item.quantity;
      }
      return 0;
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-6" }, _attrs))} data-v-a94b3ca3><div class="flex items-center justify-between" data-v-a94b3ca3><div data-v-a94b3ca3><h1 class="text-2xl font-bold text-gray-900" data-v-a94b3ca3>新建申领单</h1><p class="text-gray-500 mt-1" data-v-a94b3ca3>选择项目和耗材，提交申领</p></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/supplies/requisitions",
        class: "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a94b3ca3${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" data-v-a94b3ca3${_scopeId}></path></svg> 返回列表 `);
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
                  d: "M15 19l-7-7 7-7"
                })
              ])),
              createTextVNode(" 返回列表 ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="grid grid-cols-1 lg:grid-cols-3 gap-6" data-v-a94b3ca3><div class="lg:col-span-2 space-y-6" data-v-a94b3ca3><div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-v-a94b3ca3><h2 class="text-lg font-semibold text-gray-900 mb-4" data-v-a94b3ca3>基本信息</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-4" data-v-a94b3ca3><div data-v-a94b3ca3><label class="block text-sm font-medium text-gray-700 mb-2" data-v-a94b3ca3> 申领项目 <span class="text-red-500" data-v-a94b3ca3>*</span></label><select class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-a94b3ca3><option value="" data-v-a94b3ca3${ssrIncludeBooleanAttr(Array.isArray(selectedProjectId.value) ? ssrLooseContain(selectedProjectId.value, "") : ssrLooseEqual(selectedProjectId.value, "")) ? " selected" : ""}>请选择项目</option><!--[-->`);
      ssrRenderList(projects.value, (project) => {
        _push(`<option${ssrRenderAttr("value", project.id)} data-v-a94b3ca3${ssrIncludeBooleanAttr(Array.isArray(selectedProjectId.value) ? ssrLooseContain(selectedProjectId.value, project.id) : ssrLooseEqual(selectedProjectId.value, project.id)) ? " selected" : ""}>${ssrInterpolate(project.name)}</option>`);
      });
      _push(`<!--]--></select></div><div data-v-a94b3ca3><label class="block text-sm font-medium text-gray-700 mb-2" data-v-a94b3ca3> 申领日期 </label><input${ssrRenderAttr("value", today.value)} disabled class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" data-v-a94b3ca3></div></div></div><div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-v-a94b3ca3><div class="flex items-center justify-between mb-4" data-v-a94b3ca3><h2 class="text-lg font-semibold text-gray-900" data-v-a94b3ca3>申领明细</h2><button class="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium flex items-center gap-2" data-v-a94b3ca3><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a94b3ca3><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" data-v-a94b3ca3></path></svg> 添加耗材 </button></div>`);
      if (items.value.length === 0) {
        _push(`<div class="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl" data-v-a94b3ca3><span class="text-5xl mb-4 block" data-v-a94b3ca3>📦</span><p class="text-gray-500" data-v-a94b3ca3>暂无申领明细</p><button class="mt-4 px-4 py-2 bg-primary-500 text-white hover:bg-primary-600 rounded-lg transition-colors text-sm font-medium" data-v-a94b3ca3> 添加第一项耗材 </button></div>`);
      } else {
        _push(`<div class="space-y-3" data-v-a94b3ca3><!--[-->`);
        ssrRenderList(items.value, (item, index) => {
          _push(`<div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors" data-v-a94b3ca3><div class="flex-1" data-v-a94b3ca3><select class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-a94b3ca3><option value="" data-v-a94b3ca3${ssrIncludeBooleanAttr(Array.isArray(item.supplyId) ? ssrLooseContain(item.supplyId, "") : ssrLooseEqual(item.supplyId, "")) ? " selected" : ""}>请选择耗材</option><!--[-->`);
          ssrRenderList(availableSupplies.value, (supply) => {
            _push(`<option${ssrRenderAttr("value", supply.id)}${ssrIncludeBooleanAttr(isSupplySelected(supply.id, index)) ? " disabled" : ""} data-v-a94b3ca3${ssrIncludeBooleanAttr(Array.isArray(item.supplyId) ? ssrLooseContain(item.supplyId, supply.id) : ssrLooseEqual(item.supplyId, supply.id)) ? " selected" : ""}>${ssrInterpolate(supply.name)} (库存: ${ssrInterpolate(supply.currentStock)}${ssrInterpolate(supply.unit)}) </option>`);
          });
          _push(`<!--]--></select></div><div class="w-32" data-v-a94b3ca3><input${ssrRenderAttr("value", item.quantity)} type="number" min="1" placeholder="数量" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-a94b3ca3></div><div class="w-24 text-sm text-gray-600 text-center" data-v-a94b3ca3>${ssrInterpolate(getSupplyUnit(item.supplyId))}</div><div class="w-28 text-sm font-medium text-gray-900 text-right" data-v-a94b3ca3>${ssrInterpolate(unref(formatCurrency)(getItemAmount(item)))}</div><button class="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" data-v-a94b3ca3><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a94b3ca3><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" data-v-a94b3ca3></path></svg></button></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div><div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-v-a94b3ca3><h2 class="text-lg font-semibold text-gray-900 mb-4" data-v-a94b3ca3>备注</h2><textarea placeholder="请输入备注信息（选填）..." class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" rows="3" data-v-a94b3ca3>${ssrInterpolate(note.value)}</textarea></div></div><div class="space-y-6" data-v-a94b3ca3><div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6" data-v-a94b3ca3><h2 class="text-lg font-semibold text-gray-900 mb-4" data-v-a94b3ca3>申领汇总</h2><div class="space-y-4" data-v-a94b3ca3><div class="flex items-center justify-between text-sm" data-v-a94b3ca3><span class="text-gray-500" data-v-a94b3ca3>耗材项数</span><span class="font-medium text-gray-900" data-v-a94b3ca3>${ssrInterpolate(items.value.length)} 项</span></div><div class="flex items-center justify-between text-sm" data-v-a94b3ca3><span class="text-gray-500" data-v-a94b3ca3>总数量</span><span class="font-medium text-gray-900" data-v-a94b3ca3>${ssrInterpolate(totalQuantity.value)} 件</span></div><div class="border-t border-gray-100 pt-4" data-v-a94b3ca3><div class="flex items-center justify-between" data-v-a94b3ca3><span class="text-gray-500" data-v-a94b3ca3>合计金额</span><span class="text-2xl font-bold text-primary-600" data-v-a94b3ca3>${ssrInterpolate(unref(formatCurrency)(totalAmount.value))}</span></div></div></div><div class="mt-6 space-y-3" data-v-a94b3ca3><button${ssrIncludeBooleanAttr(!canSubmit.value) ? " disabled" : ""} class="w-full px-4 py-3 bg-primary-500 text-white hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors font-medium" data-v-a94b3ca3> 提交审核 </button><button${ssrIncludeBooleanAttr(!canSave.value) ? " disabled" : ""} class="w-full px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors font-medium" data-v-a94b3ca3> 保存草稿 </button></div>`);
      if (items.value.length > 0) {
        _push(`<div class="mt-6 p-4 bg-yellow-50 rounded-xl" data-v-a94b3ca3><h3 class="font-medium text-yellow-900 mb-2 flex items-center gap-2" data-v-a94b3ca3><span data-v-a94b3ca3>⚠️</span> 温馨提示 </h3><ul class="text-xs text-yellow-700 space-y-1" data-v-a94b3ca3><li data-v-a94b3ca3>• 提交后将进入待审核状态</li><li data-v-a94b3ca3>• 项目主管审核通过后将安排发货</li><li data-v-a94b3ca3>• 库存不足的耗材可能需要等待补货</li></ul></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (showToast.value) {
          _push2(`<div class="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up" data-v-a94b3ca3>`);
          if (toastType.value === "success") {
            _push2(`<span class="text-green-400" data-v-a94b3ca3>✓</span>`);
          } else {
            _push2(`<span class="text-red-400" data-v-a94b3ca3>✕</span>`);
          }
          _push2(`<span data-v-a94b3ca3>${ssrInterpolate(toastMessage.value)}</span></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/supplies/requisition/new.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _new = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-a94b3ca3"]]);
export {
  _new as default
};
//# sourceMappingURL=new-DS8SJC-e.js.map
