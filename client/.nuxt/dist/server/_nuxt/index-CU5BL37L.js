import { _ as __nuxt_component_0 } from "./nuxt-link-BqY1MNSU.js";
import { defineComponent, computed, mergeProps, unref, useSSRContext, ref, withCtx, openBlock, createBlock, createVNode, createTextVNode } from "vue";
import { ssrRenderAttrs, ssrRenderClass, ssrInterpolate, ssrRenderStyle, ssrRenderComponent, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrRenderTeleport } from "vue/server-renderer";
import { a as getCategoryText, f as formatCurrency } from "./formatters-B147ECSY.js";
import { u as useDataStore } from "./data-CvF3Pjf4.js";
import { u as useAuthStore } from "./auth-BO_zE_6L.js";
import { f as useRouter, a as _export_sfc } from "../server.mjs";
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
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "SupplyStockCard",
  __ssrInlineRender: true,
  props: {
    supply: {},
    showRestockButton: { type: Boolean, default: true }
  },
  emits: ["restock"],
  setup(__props) {
    const props = __props;
    const stockPercentage = computed(() => {
      const percentage = props.supply.currentStock / props.supply.safeStock * 100;
      return Math.min(percentage, 100);
    });
    const stockStatus = computed(() => {
      if (props.supply.currentStock <= props.supply.warningStock) return "critical";
      if (props.supply.currentStock <= props.supply.safeStock) return "warning";
      return "normal";
    });
    const statusText = computed(() => {
      if (stockStatus.value === "critical") return "库存严重";
      if (stockStatus.value === "warning") return "库存预警";
      return "库存正常";
    });
    const categoryIcon = computed(() => {
      const iconMap = {
        detergent: "🧴",
        tool: "🧹",
        disposable: "🧻",
        protective: "🧤"
      };
      return iconMap[props.supply.category] || "📦";
    });
    const categoryBg = computed(() => {
      const bgMap = {
        detergent: "bg-blue-100",
        tool: "bg-green-100",
        disposable: "bg-purple-100",
        protective: "bg-orange-100"
      };
      return bgMap[props.supply.category] || "bg-gray-100";
    });
    const categoryBadgeClass = computed(() => {
      const classMap = {
        detergent: "bg-blue-100 text-blue-700",
        tool: "bg-green-100 text-green-700",
        disposable: "bg-purple-100 text-purple-700",
        protective: "bg-orange-100 text-orange-700"
      };
      return classMap[props.supply.category] || "bg-gray-100 text-gray-700";
    });
    const statusBadgeClass = computed(() => {
      if (stockStatus.value === "critical") return "bg-red-100 text-red-700";
      if (stockStatus.value === "warning") return "bg-yellow-100 text-yellow-700";
      return "bg-green-100 text-green-700";
    });
    const stockValueClass = computed(() => {
      if (stockStatus.value === "critical") return "text-red-600";
      if (stockStatus.value === "warning") return "text-yellow-600";
      return "text-gray-900";
    });
    const progressBarClass = computed(() => {
      if (stockStatus.value === "critical") return "bg-red-500";
      if (stockStatus.value === "warning") return "bg-yellow-500";
      return "bg-green-500";
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-primary-200 hover:-translate-y-1 transition-all duration-300", {
          "border-yellow-300 bg-yellow-50": stockStatus.value === "warning",
          "border-red-300 bg-red-50": stockStatus.value === "critical"
        }]
      }, _attrs))}><div class="flex items-start justify-between mb-4"><div class="flex items-center gap-3"><div class="${ssrRenderClass([categoryBg.value, "w-12 h-12 rounded-xl flex items-center justify-center"])}"><span class="text-2xl">${ssrInterpolate(categoryIcon.value)}</span></div><div><h3 class="font-semibold text-gray-900">${ssrInterpolate(__props.supply.name)}</h3><span class="${ssrRenderClass([categoryBadgeClass.value, "text-xs px-2 py-0.5 rounded-full"])}">${ssrInterpolate(unref(getCategoryText)(__props.supply.category))}</span></div></div><div class="flex items-center gap-2">`);
      if (stockStatus.value !== "normal") {
        _push(`<span class="${ssrRenderClass([statusBadgeClass.value, "text-xs px-2 py-0.5 rounded-full flex items-center gap-1"])}">`);
        if (stockStatus.value === "warning") {
          _push(`<span>⚠️</span>`);
        } else {
          _push(`<span>🚨</span>`);
        }
        _push(` ${ssrInterpolate(statusText.value)}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="space-y-3"><div class="flex items-center justify-between text-sm"><span class="text-gray-500">当前库存</span><span class="${ssrRenderClass([stockValueClass.value, "font-semibold"])}">${ssrInterpolate(__props.supply.currentStock)} ${ssrInterpolate(__props.supply.unit)}</span></div><div class="relative h-2 bg-gray-100 rounded-full overflow-hidden"><div class="${ssrRenderClass([progressBarClass.value, "absolute left-0 top-0 h-full rounded-full transition-all duration-500"])}" style="${ssrRenderStyle({ width: stockPercentage.value + "%" })}"></div></div><div class="grid grid-cols-2 gap-3 text-xs"><div class="bg-gray-50 rounded-lg p-2"><p class="text-gray-400">安全库存</p><p class="font-medium text-gray-700">${ssrInterpolate(__props.supply.safeStock)} ${ssrInterpolate(__props.supply.unit)}</p></div><div class="bg-gray-50 rounded-lg p-2"><p class="text-gray-400">警告库存</p><p class="font-medium text-gray-700">${ssrInterpolate(__props.supply.warningStock)} ${ssrInterpolate(__props.supply.unit)}</p></div></div><div class="pt-2 border-t border-gray-100"><div class="flex items-center justify-between text-xs text-gray-400"><span>单价: ${ssrInterpolate(unref(formatCurrency)(__props.supply.unitPrice))}</span>`);
      if (__props.supply.lastRestockDate) {
        _push(`<span> 上次补货: ${ssrInterpolate(__props.supply.lastRestockDate)} (+${ssrInterpolate(__props.supply.lastRestockQuantity)}${ssrInterpolate(__props.supply.unit)}) </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (__props.supply.note) {
        _push(`<div class="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">${ssrInterpolate(__props.supply.note)}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.showRestockButton) {
        _push(`<button class="w-full mt-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"> 快速补货 </button>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SupplyStockCard.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const dataStore = useDataStore();
    useAuthStore();
    const router = useRouter();
    const selectedCategory = ref("");
    const selectedStockStatus = ref("");
    const searchText = ref("");
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastType = ref("success");
    const categories = [
      { value: "detergent", label: "清洁剂" },
      { value: "tool", label: "清洁工具" },
      { value: "disposable", label: "一次性用品" },
      { value: "protective", label: "防护用品" }
    ];
    const supplies = computed(() => dataStore.supplies);
    const warningCount = computed(() => {
      return supplies.value.filter(
        (s) => s.currentStock <= s.warningStock && s.currentStock > 2
      ).length;
    });
    const criticalCount = computed(() => {
      return supplies.value.filter((s) => s.currentStock <= 2).length;
    });
    const filteredSupplies = computed(() => {
      let result = [...supplies.value];
      if (selectedCategory.value) {
        result = result.filter((s) => s.category === selectedCategory.value);
      }
      if (selectedStockStatus.value) {
        result = result.filter((s) => {
          const status = getStockStatus(s);
          return status === selectedStockStatus.value;
        });
      }
      if (searchText.value.trim()) {
        const search = searchText.value.toLowerCase().trim();
        result = result.filter(
          (s) => s.name.toLowerCase().includes(search) || getCategoryText(s.category).toLowerCase().includes(search)
        );
      }
      result.sort((a, b) => {
        const statusA = getStockStatus(a);
        const statusB = getStockStatus(b);
        const priority = { critical: 0, warning: 1, normal: 2 };
        return priority[statusA] - priority[statusB];
      });
      return result;
    });
    function getStockStatus(supply) {
      if (supply.currentStock <= supply.warningStock) return "critical";
      if (supply.currentStock <= supply.safeStock) return "warning";
      return "normal";
    }
    function handleQuickRestock(supply) {
      router.push({
        path: "/supplies/requisition/new",
        query: { supplyId: supply.id }
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_SupplyStockCard = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-6" }, _attrs))} data-v-2037689b><div class="flex items-center justify-between" data-v-2037689b><div data-v-2037689b><h1 class="text-2xl font-bold text-gray-900" data-v-2037689b>耗材库存管理</h1><p class="text-gray-500 mt-1" data-v-2037689b> 共 ${ssrInterpolate(supplies.value.length)} 种耗材 · <span class="text-yellow-600" data-v-2037689b>${ssrInterpolate(warningCount.value)} 种预警</span> · <span class="text-red-600" data-v-2037689b>${ssrInterpolate(criticalCount.value)} 种严重不足</span></p></div><div class="flex items-center gap-3" data-v-2037689b>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/supplies/requisitions",
        class: "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-2037689b${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" data-v-2037689b${_scopeId}></path></svg> 申领单管理 `);
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
                  d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                })
              ])),
              createTextVNode(" 申领单管理 ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/supplies/requisition/new",
        class: "px-4 py-2 bg-primary-500 text-white hover:bg-primary-600 rounded-lg transition-colors font-medium flex items-center gap-2"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-2037689b${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" data-v-2037689b${_scopeId}></path></svg> 新建申领 `);
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
                  d: "M12 4v16m8-8H4"
                })
              ])),
              createTextVNode(" 新建申领 ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4" data-v-2037689b><div class="flex flex-wrap items-center gap-4" data-v-2037689b><div class="flex items-center gap-2" data-v-2037689b><label class="text-sm text-gray-500" data-v-2037689b>类别:</label><select class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-2037689b><option value="" data-v-2037689b${ssrIncludeBooleanAttr(Array.isArray(selectedCategory.value) ? ssrLooseContain(selectedCategory.value, "") : ssrLooseEqual(selectedCategory.value, "")) ? " selected" : ""}>全部</option><!--[-->`);
      ssrRenderList(categories, (cat) => {
        _push(`<option${ssrRenderAttr("value", cat.value)} data-v-2037689b${ssrIncludeBooleanAttr(Array.isArray(selectedCategory.value) ? ssrLooseContain(selectedCategory.value, cat.value) : ssrLooseEqual(selectedCategory.value, cat.value)) ? " selected" : ""}>${ssrInterpolate(cat.label)}</option>`);
      });
      _push(`<!--]--></select></div><div class="flex items-center gap-2" data-v-2037689b><label class="text-sm text-gray-500" data-v-2037689b>库存状态:</label><select class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-2037689b><option value="" data-v-2037689b${ssrIncludeBooleanAttr(Array.isArray(selectedStockStatus.value) ? ssrLooseContain(selectedStockStatus.value, "") : ssrLooseEqual(selectedStockStatus.value, "")) ? " selected" : ""}>全部</option><option value="normal" data-v-2037689b${ssrIncludeBooleanAttr(Array.isArray(selectedStockStatus.value) ? ssrLooseContain(selectedStockStatus.value, "normal") : ssrLooseEqual(selectedStockStatus.value, "normal")) ? " selected" : ""}>正常</option><option value="warning" data-v-2037689b${ssrIncludeBooleanAttr(Array.isArray(selectedStockStatus.value) ? ssrLooseContain(selectedStockStatus.value, "warning") : ssrLooseEqual(selectedStockStatus.value, "warning")) ? " selected" : ""}>预警</option><option value="critical" data-v-2037689b${ssrIncludeBooleanAttr(Array.isArray(selectedStockStatus.value) ? ssrLooseContain(selectedStockStatus.value, "critical") : ssrLooseEqual(selectedStockStatus.value, "critical")) ? " selected" : ""}>严重不足</option></select></div><div class="flex items-center gap-2 flex-1 min-w-[200px]" data-v-2037689b><label class="text-sm text-gray-500" data-v-2037689b>搜索:</label><input${ssrRenderAttr("value", searchText.value)} type="text" placeholder="搜索耗材名称..." class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" data-v-2037689b></div><button class="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors" data-v-2037689b> 重置筛选 </button></div></div>`);
      if (filteredSupplies.value.length === 0) {
        _push(`<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center" data-v-2037689b><span class="text-5xl mb-4 block" data-v-2037689b>📦</span><p class="text-gray-500 text-lg" data-v-2037689b>暂无符合条件的耗材</p><p class="text-gray-400 text-sm mt-2" data-v-2037689b>请尝试调整筛选条件</p></div>`);
      } else {
        _push(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-v-2037689b><!--[-->`);
        ssrRenderList(filteredSupplies.value, (supply) => {
          _push(ssrRenderComponent(_component_SupplyStockCard, {
            key: supply.id,
            supply,
            onRestock: handleQuickRestock
          }, null, _parent));
        });
        _push(`<!--]--></div>`);
      }
      ssrRenderTeleport(_push, (_push2) => {
        if (showToast.value) {
          _push2(`<div class="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up" data-v-2037689b>`);
          if (toastType.value === "success") {
            _push2(`<span class="text-green-400" data-v-2037689b>✓</span>`);
          } else {
            _push2(`<span class="text-red-400" data-v-2037689b>✕</span>`);
          }
          _push2(`<span data-v-2037689b>${ssrInterpolate(toastMessage.value)}</span></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/supplies/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-2037689b"]]);
export {
  index as default
};
//# sourceMappingURL=index-CU5BL37L.js.map
