import { _ as __nuxt_component_0 } from "./nuxt-link-BqY1MNSU.js";
import { defineComponent, computed, mergeProps, withCtx, openBlock, createBlock, createVNode, createCommentVNode, unref, toDisplayString, useSSRContext, ref, createTextVNode } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderClass, ssrRenderAttr } from "vue/server-renderer";
import { c as useRoute, _ as __nuxt_component_2 } from "../server.mjs";
import { u as useAuthStore } from "./auth-BO_zE_6L.js";
import { u as useDataStore, m as mockUsers } from "./data-CvF3Pjf4.js";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/hookable/dist/index.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/ufo/dist/index.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/defu/dist/defu.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/unctx/dist/index.mjs";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/Users/zhangliu/Documents/private/model-test/trae-test-5/client/node_modules/klona/dist/index.mjs";
import "dayjs";
import "dayjs/locale/zh-cn.js";
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "Sidebar",
  __ssrInlineRender: true,
  props: {
    collapsed: { type: Boolean }
  },
  emits: ["toggle"],
  setup(__props) {
    const route = useRoute();
    const authStore = useAuthStore();
    const dataStore = useDataStore();
    const isActive = (path) => {
      return route.path === path || route.path.startsWith(path + "/");
    };
    const openAlertsCount = computed(() => dataStore.alerts.filter((a) => a.status === "open").length);
    const menuConfig = computed(() => ({
      project_manager: [
        { path: "/dashboard", label: "仪表盘", iconKey: "dashboard" },
        { path: "/calendar", label: "日历视图", iconKey: "calendar" },
        { path: "/scheduling", label: "排班管理", iconKey: "schedule" },
        { path: "/supplies", label: "耗材管理", iconKey: "supplies" },
        { path: "/quality", label: "质检管理", iconKey: "inspection" },
        { path: "/rectification", label: "整改追踪", iconKey: "rectification" },
        { path: "/alerts", label: "预警中心", iconKey: "alert", badge: openAlertsCount.value },
        { path: "/history", label: "历史记录", iconKey: "history" }
      ],
      scheduling_specialist: [
        { path: "/dashboard", label: "仪表盘", iconKey: "dashboard" },
        { path: "/calendar", label: "日历视图", iconKey: "calendar" },
        { path: "/scheduling", label: "排班管理", iconKey: "schedule" },
        { path: "/punch", label: "打卡管理", iconKey: "punch" },
        { path: "/alerts", label: "预警中心", iconKey: "alert", badge: openAlertsCount.value }
      ],
      quality_inspector: [
        { path: "/dashboard", label: "仪表盘", iconKey: "dashboard" },
        { path: "/calendar", label: "日历视图", iconKey: "calendar" },
        { path: "/quality", label: "质检管理", iconKey: "inspection" },
        { path: "/rectification", label: "整改追踪", iconKey: "rectification" },
        { path: "/alerts", label: "预警中心", iconKey: "alert", badge: openAlertsCount.value }
      ]
    }));
    const menuItems = computed(() => menuConfig.value[authStore.currentRole] || []);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<aside${ssrRenderAttrs(mergeProps({
        class: [
          "bg-white shadow-lg transition-all duration-300 flex flex-col",
          __props.collapsed ? "w-16 md:w-20" : "w-64"
        ]
      }, _attrs))}><div class="h-16 flex items-center justify-center border-b border-gray-100">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "flex items-center gap-2 text-primary-600 font-bold"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"${_scopeId}></path></svg>`);
            if (!__props.collapsed) {
              _push2(`<span class="text-lg"${_scopeId}>清洁管理系统</span>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              (openBlock(), createBlock("svg", {
                class: "w-8 h-8",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24"
              }, [
                createVNode("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "stroke-width": "2",
                  d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                })
              ])),
              !__props.collapsed ? (openBlock(), createBlock("span", {
                key: 0,
                class: "text-lg"
              }, "清洁管理系统")) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><nav class="flex-1 py-4 overflow-y-auto"><ul class="space-y-1 px-2"><!--[-->`);
      ssrRenderList(unref(menuItems), (item) => {
        _push(`<li>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: item.path,
          class: ["flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group", {
            "bg-primary-50 text-primary-600": isActive(item.path),
            "text-gray-600 hover:bg-gray-50 hover:text-gray-900": !isActive(item.path)
          }]
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              if (item.iconKey === "dashboard") {
                _push2(`<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"${_scopeId}></path></svg>`);
              } else if (item.iconKey === "calendar") {
                _push2(`<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"${_scopeId}></path></svg>`);
              } else if (item.iconKey === "schedule") {
                _push2(`<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg>`);
              } else if (item.iconKey === "supplies") {
                _push2(`<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"${_scopeId}></path></svg>`);
              } else if (item.iconKey === "inspection") {
                _push2(`<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"${_scopeId}></path></svg>`);
              } else if (item.iconKey === "alert") {
                _push2(`<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"${_scopeId}></path></svg>`);
              } else if (item.iconKey === "history") {
                _push2(`<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"${_scopeId}></path></svg>`);
              } else if (item.iconKey === "punch") {
                _push2(`<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"${_scopeId}></path></svg>`);
              } else if (item.iconKey === "rectification") {
                _push2(`<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"${_scopeId}></path></svg>`);
              } else {
                _push2(`<!---->`);
              }
              if (!__props.collapsed) {
                _push2(`<span class="text-sm font-medium"${_scopeId}>${ssrInterpolate(item.label)}</span>`);
              } else {
                _push2(`<!---->`);
              }
              if (item.badge && !__props.collapsed) {
                _push2(`<span class="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"${_scopeId}>${ssrInterpolate(item.badge)}</span>`);
              } else {
                _push2(`<!---->`);
              }
            } else {
              return [
                item.iconKey === "dashboard" ? (openBlock(), createBlock("svg", {
                  key: 0,
                  class: "w-5 h-5 flex-shrink-0",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  })
                ])) : item.iconKey === "calendar" ? (openBlock(), createBlock("svg", {
                  key: 1,
                  class: "w-5 h-5 flex-shrink-0",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  })
                ])) : item.iconKey === "schedule" ? (openBlock(), createBlock("svg", {
                  key: 2,
                  class: "w-5 h-5 flex-shrink-0",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  })
                ])) : item.iconKey === "supplies" ? (openBlock(), createBlock("svg", {
                  key: 3,
                  class: "w-5 h-5 flex-shrink-0",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  })
                ])) : item.iconKey === "inspection" ? (openBlock(), createBlock("svg", {
                  key: 4,
                  class: "w-5 h-5 flex-shrink-0",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  })
                ])) : item.iconKey === "alert" ? (openBlock(), createBlock("svg", {
                  key: 5,
                  class: "w-5 h-5 flex-shrink-0",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  })
                ])) : item.iconKey === "history" ? (openBlock(), createBlock("svg", {
                  key: 6,
                  class: "w-5 h-5 flex-shrink-0",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  })
                ])) : item.iconKey === "punch" ? (openBlock(), createBlock("svg", {
                  key: 7,
                  class: "w-5 h-5 flex-shrink-0",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  })
                ])) : item.iconKey === "rectification" ? (openBlock(), createBlock("svg", {
                  key: 8,
                  class: "w-5 h-5 flex-shrink-0",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  })
                ])) : createCommentVNode("", true),
                !__props.collapsed ? (openBlock(), createBlock("span", {
                  key: 9,
                  class: "text-sm font-medium"
                }, toDisplayString(item.label), 1)) : createCommentVNode("", true),
                item.badge && !__props.collapsed ? (openBlock(), createBlock("span", {
                  key: 10,
                  class: "ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
                }, toDisplayString(item.badge), 1)) : createCommentVNode("", true)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul></nav><div class="p-2 border-t border-gray-100"><button class="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">`);
      if (__props.collapsed) {
        _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>`);
      } else {
        _push(`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>`);
      }
      if (!__props.collapsed) {
        _push(`<span class="text-sm">收起菜单</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</button></div></aside>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Sidebar.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "TopBar",
  __ssrInlineRender: true,
  emits: ["toggle-sidebar"],
  setup(__props) {
    const authStore = useAuthStore();
    const dataStore = useDataStore();
    const showAlerts = ref(false);
    const showRoleSelector = ref(false);
    const showUserMenu = ref(false);
    const currentDate = computed(() => {
      const now = /* @__PURE__ */ new Date();
      return now.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
      });
    });
    const roleLabel = computed(() => getRoleLabel(authStore.currentRole));
    const openAlerts = computed(() => dataStore.getOpenAlerts);
    const openAlertsCount = computed(() => openAlerts.value.length);
    function getRoleLabel(role) {
      const labels = {
        project_manager: "项目主管",
        scheduling_specialist: "排班专员",
        quality_inspector: "质检员"
      };
      return labels[role] || role;
    }
    function getRoleUser(role) {
      const user = mockUsers.find((u) => u.role === role);
      return user?.name || "";
    }
    function formatTime(dateStr) {
      const date = new Date(dateStr);
      const now = /* @__PURE__ */ new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / (1e3 * 60));
      const hours = Math.floor(diff / (1e3 * 60 * 60));
      const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
      if (minutes < 60) return `${minutes}分钟前`;
      if (hours < 24) return `${hours}小时前`;
      if (days < 7) return `${days}天前`;
      return date.toLocaleDateString("zh-CN");
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<header${ssrRenderAttrs(mergeProps({ class: "h-16 bg-white shadow-sm border-b border-gray-100 flex items-center justify-between px-4 md:px-6" }, _attrs))}><div class="flex items-center gap-4"><button class="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg></button><div class="hidden sm:flex items-center gap-2 text-sm text-gray-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>${ssrInterpolate(unref(currentDate))}</span></div></div><div class="flex items-center gap-2 md:gap-4"><div class="relative"><button class="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>`);
      if (unref(openAlertsCount) > 0) {
        _push(`<span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">${ssrInterpolate(unref(openAlertsCount) > 9 ? "9+" : unref(openAlertsCount))}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</button>`);
      if (unref(showAlerts)) {
        _push(`<div class="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-100 z-50 max-h-96 overflow-hidden"><div class="p-4 border-b border-gray-100 flex items-center justify-between"><h3 class="font-semibold text-gray-900">预警提醒</h3>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/alerts",
          class: "text-sm text-primary-600 hover:text-primary-700"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`查看全部`);
            } else {
              return [
                createTextVNode("查看全部")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div><div class="overflow-y-auto max-h-72">`);
        if (unref(openAlerts).length === 0) {
          _push(`<div class="p-8 text-center text-gray-500"><svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><p>暂无预警</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(openAlerts).slice(0, 5), (alert) => {
          _push(`<div class="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"><div class="flex items-start gap-3"><div class="${ssrRenderClass([
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            alert.severity === "critical" ? "bg-red-100 text-red-600" : alert.severity === "warning" ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-blue-600"
          ])}">`);
          if (alert.severity === "critical") {
            _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`);
          } else if (alert.severity === "warning") {
            _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
          } else {
            _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);
          }
          _push(`</div><div class="flex-1 min-w-0"><p class="text-sm font-medium text-gray-900 truncate">${ssrInterpolate(alert.title)}</p><p class="text-xs text-gray-500 mt-1 line-clamp-2">${ssrInterpolate(alert.description)}</p><p class="text-xs text-gray-400 mt-1">${ssrInterpolate(formatTime(alert.createdAt))}</p></div></div></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="relative"><button class="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"><div class="${ssrRenderClass([
        "w-2 h-2 rounded-full",
        unref(authStore).isProjectManager ? "bg-primary-500" : unref(authStore).isSchedulingSpecialist ? "bg-green-500" : "bg-purple-500"
      ])}"></div><span class="text-sm text-gray-700">${ssrInterpolate(unref(roleLabel))}</span><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></button>`);
      if (unref(showRoleSelector)) {
        _push(`<div class="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 z-50"><div class="p-2"><p class="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">切换角色</p><!--[-->`);
        ssrRenderList(unref(authStore).availableRoles, (role) => {
          _push(`<button class="${ssrRenderClass([{
            "bg-primary-50 text-primary-600": unref(authStore).currentRole === role,
            "hover:bg-gray-50 text-gray-700": unref(authStore).currentRole !== role
          }, "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"])}"><div class="${ssrRenderClass([
            "w-8 h-8 rounded-full flex items-center justify-center",
            role === "project_manager" ? "bg-primary-100 text-primary-600" : role === "scheduling_specialist" ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-600"
          ])}">`);
          if (role === "project_manager") {
            _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>`);
          } else if (role === "scheduling_specialist") {
            _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`);
          } else {
            _push(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>`);
          }
          _push(`</div><div class="flex-1 text-left"><p class="text-sm font-medium">${ssrInterpolate(getRoleLabel(role))}</p><p class="text-xs text-gray-500">${ssrInterpolate(getRoleUser(role))}</p></div>`);
          if (unref(authStore).currentRole === role) {
            _push(`<svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</button>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="relative"><button class="flex items-center gap-2 md:gap-3 p-1 md:p-1.5 hover:bg-gray-100 rounded-full transition-colors">`);
      if (unref(authStore).currentUser?.avatar) {
        _push(`<img${ssrRenderAttr("src", unref(authStore).currentUser.avatar)}${ssrRenderAttr("alt", unref(authStore).currentUser.name)} class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-200">`);
      } else {
        _push(`<div class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-200 flex items-center justify-center"><span class="text-sm font-medium text-gray-600">${ssrInterpolate(unref(authStore).currentUser?.name?.charAt(0) || "U")}</span></div>`);
      }
      _push(`<div class="hidden md:block text-left"><p class="text-sm font-medium text-gray-900">${ssrInterpolate(unref(authStore).currentUser?.name || "用户")}</p><p class="text-xs text-gray-500">${ssrInterpolate(unref(roleLabel))}</p></div></button>`);
      if (unref(showUserMenu)) {
        _push(`<div class="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-50"><div class="p-4 border-b border-gray-100"><div class="flex items-center gap-3">`);
        if (unref(authStore).currentUser?.avatar) {
          _push(`<img${ssrRenderAttr("src", unref(authStore).currentUser.avatar)}${ssrRenderAttr("alt", unref(authStore).currentUser.name)} class="w-12 h-12 rounded-full bg-gray-200">`);
        } else {
          _push(`<div class="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center"><span class="text-lg font-medium text-gray-600">${ssrInterpolate(unref(authStore).currentUser?.name?.charAt(0) || "U")}</span></div>`);
        }
        _push(`<div><p class="font-medium text-gray-900">${ssrInterpolate(unref(authStore).currentUser?.name || "用户")}</p><p class="text-sm text-gray-500">${ssrInterpolate(unref(authStore).currentUser?.phone || "")}</p></div></div></div><div class="p-2"><button class="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> 个人资料 </button><button class="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> 系统设置 </button><div class="border-t border-gray-100 my-2"></div><button class="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> 退出登录 </button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></header>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/TopBar.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "default",
  __ssrInlineRender: true,
  setup(__props) {
    const sidebarCollapsed = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Sidebar = _sfc_main$2;
      const _component_TopBar = _sfc_main$1;
      const _component_NuxtPage = __nuxt_component_2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-50 flex" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_Sidebar, {
        collapsed: unref(sidebarCollapsed),
        onToggle: ($event) => sidebarCollapsed.value = !unref(sidebarCollapsed)
      }, null, _parent));
      _push(`<div class="flex-1 flex flex-col min-w-0">`);
      _push(ssrRenderComponent(_component_TopBar, {
        onToggleSidebar: ($event) => sidebarCollapsed.value = !unref(sidebarCollapsed)
      }, null, _parent));
      _push(`<main class="flex-1 p-4 md:p-6 overflow-auto">`);
      _push(ssrRenderComponent(_component_NuxtPage, null, null, _parent));
      _push(`</main></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=default-zSVlb0zG.js.map
