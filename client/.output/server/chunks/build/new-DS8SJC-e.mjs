import { _ as __nuxt_component_0 } from './nuxt-link-BqY1MNSU.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, openBlock, createBlock, createVNode, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderTeleport } from 'vue/server-renderer';
import { u as useDataStore, f as formatDate } from './data-CvF3Pjf4.mjs';
import { u as useAuthStore } from './auth-BO_zE_6L.mjs';
import { f as formatCurrency } from './formatters-B147ECSY.mjs';
import { a as _export_sfc, c as useRoute, f as useRouter } from './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'dayjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'vue-router';

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
      return (supply == null ? void 0 : supply.unit) || "";
    }
    function getItemAmount(item) {
      if (item.unitPrice && item.quantity) {
        return item.unitPrice * item.quantity;
      }
      return 0;
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-6" }, _attrs))} data-v-a94b3ca3><div class="flex items-center justify-between" data-v-a94b3ca3><div data-v-a94b3ca3><h1 class="text-2xl font-bold text-gray-900" data-v-a94b3ca3>\u65B0\u5EFA\u7533\u9886\u5355</h1><p class="text-gray-500 mt-1" data-v-a94b3ca3>\u9009\u62E9\u9879\u76EE\u548C\u8017\u6750\uFF0C\u63D0\u4EA4\u7533\u9886</p></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/supplies/requisitions",
        class: "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a94b3ca3${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" data-v-a94b3ca3${_scopeId}></path></svg> \u8FD4\u56DE\u5217\u8868 `);
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
              createTextVNode(" \u8FD4\u56DE\u5217\u8868 ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="grid grid-cols-1 lg:grid-cols-3 gap-6" data-v-a94b3ca3><div class="lg:col-span-2 space-y-6" data-v-a94b3ca3><div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-v-a94b3ca3><h2 class="text-lg font-semibold text-gray-900 mb-4" data-v-a94b3ca3>\u57FA\u672C\u4FE1\u606F</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-4" data-v-a94b3ca3><div data-v-a94b3ca3><label class="block text-sm font-medium text-gray-700 mb-2" data-v-a94b3ca3> \u7533\u9886\u9879\u76EE <span class="text-red-500" data-v-a94b3ca3>*</span></label><select class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-a94b3ca3><option value="" data-v-a94b3ca3${ssrIncludeBooleanAttr(Array.isArray(selectedProjectId.value) ? ssrLooseContain(selectedProjectId.value, "") : ssrLooseEqual(selectedProjectId.value, "")) ? " selected" : ""}>\u8BF7\u9009\u62E9\u9879\u76EE</option><!--[-->`);
      ssrRenderList(projects.value, (project) => {
        _push(`<option${ssrRenderAttr("value", project.id)} data-v-a94b3ca3${ssrIncludeBooleanAttr(Array.isArray(selectedProjectId.value) ? ssrLooseContain(selectedProjectId.value, project.id) : ssrLooseEqual(selectedProjectId.value, project.id)) ? " selected" : ""}>${ssrInterpolate(project.name)}</option>`);
      });
      _push(`<!--]--></select></div><div data-v-a94b3ca3><label class="block text-sm font-medium text-gray-700 mb-2" data-v-a94b3ca3> \u7533\u9886\u65E5\u671F </label><input${ssrRenderAttr("value", today.value)} disabled class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" data-v-a94b3ca3></div></div></div><div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-v-a94b3ca3><div class="flex items-center justify-between mb-4" data-v-a94b3ca3><h2 class="text-lg font-semibold text-gray-900" data-v-a94b3ca3>\u7533\u9886\u660E\u7EC6</h2><button class="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium flex items-center gap-2" data-v-a94b3ca3><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a94b3ca3><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" data-v-a94b3ca3></path></svg> \u6DFB\u52A0\u8017\u6750 </button></div>`);
      if (items.value.length === 0) {
        _push(`<div class="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl" data-v-a94b3ca3><span class="text-5xl mb-4 block" data-v-a94b3ca3>\u{1F4E6}</span><p class="text-gray-500" data-v-a94b3ca3>\u6682\u65E0\u7533\u9886\u660E\u7EC6</p><button class="mt-4 px-4 py-2 bg-primary-500 text-white hover:bg-primary-600 rounded-lg transition-colors text-sm font-medium" data-v-a94b3ca3> \u6DFB\u52A0\u7B2C\u4E00\u9879\u8017\u6750 </button></div>`);
      } else {
        _push(`<div class="space-y-3" data-v-a94b3ca3><!--[-->`);
        ssrRenderList(items.value, (item, index) => {
          _push(`<div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors" data-v-a94b3ca3><div class="flex-1" data-v-a94b3ca3><select class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-a94b3ca3><option value="" data-v-a94b3ca3${ssrIncludeBooleanAttr(Array.isArray(item.supplyId) ? ssrLooseContain(item.supplyId, "") : ssrLooseEqual(item.supplyId, "")) ? " selected" : ""}>\u8BF7\u9009\u62E9\u8017\u6750</option><!--[-->`);
          ssrRenderList(availableSupplies.value, (supply) => {
            _push(`<option${ssrRenderAttr("value", supply.id)}${ssrIncludeBooleanAttr(isSupplySelected(supply.id, index)) ? " disabled" : ""} data-v-a94b3ca3${ssrIncludeBooleanAttr(Array.isArray(item.supplyId) ? ssrLooseContain(item.supplyId, supply.id) : ssrLooseEqual(item.supplyId, supply.id)) ? " selected" : ""}>${ssrInterpolate(supply.name)} (\u5E93\u5B58: ${ssrInterpolate(supply.currentStock)}${ssrInterpolate(supply.unit)}) </option>`);
          });
          _push(`<!--]--></select></div><div class="w-32" data-v-a94b3ca3><input${ssrRenderAttr("value", item.quantity)} type="number" min="1" placeholder="\u6570\u91CF" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-a94b3ca3></div><div class="w-24 text-sm text-gray-600 text-center" data-v-a94b3ca3>${ssrInterpolate(getSupplyUnit(item.supplyId))}</div><div class="w-28 text-sm font-medium text-gray-900 text-right" data-v-a94b3ca3>${ssrInterpolate(unref(formatCurrency)(getItemAmount(item)))}</div><button class="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" data-v-a94b3ca3><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-a94b3ca3><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" data-v-a94b3ca3></path></svg></button></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div><div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6" data-v-a94b3ca3><h2 class="text-lg font-semibold text-gray-900 mb-4" data-v-a94b3ca3>\u5907\u6CE8</h2><textarea placeholder="\u8BF7\u8F93\u5165\u5907\u6CE8\u4FE1\u606F\uFF08\u9009\u586B\uFF09..." class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" rows="3" data-v-a94b3ca3>${ssrInterpolate(note.value)}</textarea></div></div><div class="space-y-6" data-v-a94b3ca3><div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6" data-v-a94b3ca3><h2 class="text-lg font-semibold text-gray-900 mb-4" data-v-a94b3ca3>\u7533\u9886\u6C47\u603B</h2><div class="space-y-4" data-v-a94b3ca3><div class="flex items-center justify-between text-sm" data-v-a94b3ca3><span class="text-gray-500" data-v-a94b3ca3>\u8017\u6750\u9879\u6570</span><span class="font-medium text-gray-900" data-v-a94b3ca3>${ssrInterpolate(items.value.length)} \u9879</span></div><div class="flex items-center justify-between text-sm" data-v-a94b3ca3><span class="text-gray-500" data-v-a94b3ca3>\u603B\u6570\u91CF</span><span class="font-medium text-gray-900" data-v-a94b3ca3>${ssrInterpolate(totalQuantity.value)} \u4EF6</span></div><div class="border-t border-gray-100 pt-4" data-v-a94b3ca3><div class="flex items-center justify-between" data-v-a94b3ca3><span class="text-gray-500" data-v-a94b3ca3>\u5408\u8BA1\u91D1\u989D</span><span class="text-2xl font-bold text-primary-600" data-v-a94b3ca3>${ssrInterpolate(unref(formatCurrency)(totalAmount.value))}</span></div></div></div><div class="mt-6 space-y-3" data-v-a94b3ca3><button${ssrIncludeBooleanAttr(!canSubmit.value) ? " disabled" : ""} class="w-full px-4 py-3 bg-primary-500 text-white hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors font-medium" data-v-a94b3ca3> \u63D0\u4EA4\u5BA1\u6838 </button><button${ssrIncludeBooleanAttr(!canSave.value) ? " disabled" : ""} class="w-full px-4 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors font-medium" data-v-a94b3ca3> \u4FDD\u5B58\u8349\u7A3F </button></div>`);
      if (items.value.length > 0) {
        _push(`<div class="mt-6 p-4 bg-yellow-50 rounded-xl" data-v-a94b3ca3><h3 class="font-medium text-yellow-900 mb-2 flex items-center gap-2" data-v-a94b3ca3><span data-v-a94b3ca3>\u26A0\uFE0F</span> \u6E29\u99A8\u63D0\u793A </h3><ul class="text-xs text-yellow-700 space-y-1" data-v-a94b3ca3><li data-v-a94b3ca3>\u2022 \u63D0\u4EA4\u540E\u5C06\u8FDB\u5165\u5F85\u5BA1\u6838\u72B6\u6001</li><li data-v-a94b3ca3>\u2022 \u9879\u76EE\u4E3B\u7BA1\u5BA1\u6838\u901A\u8FC7\u540E\u5C06\u5B89\u6392\u53D1\u8D27</li><li data-v-a94b3ca3>\u2022 \u5E93\u5B58\u4E0D\u8DB3\u7684\u8017\u6750\u53EF\u80FD\u9700\u8981\u7B49\u5F85\u8865\u8D27</li></ul></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (showToast.value) {
          _push2(`<div class="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up" data-v-a94b3ca3>`);
          if (toastType.value === "success") {
            _push2(`<span class="text-green-400" data-v-a94b3ca3>\u2713</span>`);
          } else {
            _push2(`<span class="text-red-400" data-v-a94b3ca3>\u2715</span>`);
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

export { _new as default };
//# sourceMappingURL=new-DS8SJC-e.mjs.map
