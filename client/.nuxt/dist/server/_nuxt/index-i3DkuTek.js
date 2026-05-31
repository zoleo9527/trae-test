import { defineComponent, ref, watch, mergeProps, useSSRContext, reactive, computed, unref } from "vue";
import { ssrRenderAttrs, ssrRenderClass, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderStyle, ssrRenderTeleport, ssrRenderComponent } from "vue/server-renderer";
import { u as useDataStore, i as isPast, d as daysBetween, f as formatDate } from "./data-CvF3Pjf4.js";
import { u as useAuthStore } from "./auth-BO_zE_6L.js";
import { d as getRectificationStatusColor, e as getRectificationStatusText } from "./formatters-B147ECSY.js";
import { c as useRoute, f as useRouter } from "../server.mjs";
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
  __name: "RectificationItem",
  __ssrInlineRender: true,
  props: {
    item: {},
    itemIndex: {},
    rectId: {},
    readonly: { type: Boolean, default: false }
  },
  emits: ["update"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const authStore = useAuthStore();
    const localNote = ref(props.item.note);
    watch(() => props.item.note, (newNote) => {
      localNote.value = newNote;
    });
    const canEdit = ref(!props.readonly && authStore.currentRole !== "quality_inspector");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["p-4 rounded-xl border transition-all duration-200", [
          __props.item.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200 hover:border-primary-300 hover:shadow-sm"
        ]]
      }, _attrs))}><div class="flex items-start gap-4"><div class="flex-shrink-0 mt-0.5">`);
      if (canEdit.value) {
        _push(`<button class="${ssrRenderClass([__props.item.completed ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-primary-500", "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"])}">`);
        if (__props.item.completed) {
          _push(`<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</button>`);
      } else {
        _push(`<div class="${ssrRenderClass([__props.item.completed ? "bg-green-500 border-green-500" : "border-gray-300", "w-6 h-6 rounded-full border-2 flex items-center justify-center"])}">`);
        if (__props.item.completed) {
          _push(`<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</div><div class="flex-1 min-w-0"><p class="${ssrRenderClass([{ "line-through text-gray-400": __props.item.completed }, "font-medium text-gray-900"])}">${ssrInterpolate(__props.item.description)}</p><div class="flex flex-wrap items-center gap-4 mt-2">`);
      if (__props.item.completedDate) {
        _push(`<span class="text-sm text-gray-500 flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> ${ssrInterpolate(__props.item.completedDate)}</span>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.item.completed) {
        _push(`<span class="text-sm text-green-600 flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> 已完成 </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (canEdit.value && !__props.item.completed) {
        _push(`<div class="mt-3"><input${ssrRenderAttr("value", localNote.value)} type="text" placeholder="添加备注..." class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"></div>`);
      } else if (__props.item.note) {
        _push(`<p class="text-sm text-gray-500 mt-2"> 💬 ${ssrInterpolate(__props.item.note)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/RectificationItem.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    useRoute();
    useRouter();
    const dataStore = useDataStore();
    const authStore = useAuthStore();
    const filters = reactive({
      status: "",
      projectId: "",
      startDeadline: "",
      endDeadline: ""
    });
    const detailModalVisible = ref(false);
    const selectedRect = ref(null);
    const assignForm = reactive({
      assigneeId: ""
    });
    const reviewForm = reactive({
      note: ""
    });
    const canAssign = computed(() => {
      return authStore.currentRole === "project_manager";
    });
    const canReview = computed(() => {
      return authStore.currentRole === "quality_inspector";
    });
    const canEditItems = computed(() => {
      return authStore.currentRole !== "quality_inspector";
    });
    const projectSupervisors = computed(() => {
      if (!selectedRect.value) return [];
      const project = dataStore.getProjectById(selectedRect.value.projectId);
      if (!project) return [];
      return dataStore.staff.filter(
        (s) => s.projects.includes(selectedRect.value.projectId) && s.position === "supervisor" && s.status === "active"
      );
    });
    const filteredRectifications = computed(() => {
      return dataStore.rectifications.filter((rect) => {
        if (filters.status && rect.status !== filters.status) return false;
        if (filters.projectId && rect.projectId !== filters.projectId) return false;
        if (filters.startDeadline && rect.deadline < filters.startDeadline) return false;
        if (filters.endDeadline && rect.deadline > filters.endDeadline) return false;
        return true;
      }).sort((a, b) => {
        const statusOrder = { overdue: 0, pending: 1, in_progress: 2, completed: 3 };
        return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      });
    });
    const stats = computed(() => {
      const rects = dataStore.rectifications;
      return {
        pending: rects.filter((r) => r.status === "pending").length,
        inProgress: rects.filter((r) => r.status === "in_progress").length,
        overdue: rects.filter((r) => r.status === "overdue").length,
        completed: rects.filter((r) => r.status === "completed").length
      };
    });
    function getProjectName(projectId) {
      const project = dataStore.getProjectById(projectId);
      return project?.name || "未知项目";
    }
    function getStaffName(staffId) {
      if (!staffId) return "未分配";
      const staff = dataStore.staff.find((s) => s.id === staffId);
      return staff?.name || "未知";
    }
    function getProgress(rect) {
      if (rect.items.length === 0) return 0;
      const completed = rect.items.filter((item) => item.completed).length;
      return Math.round(completed / rect.items.length * 100);
    }
    function completedCount(rect) {
      return rect.items.filter((item) => item.completed).length;
    }
    function getProgressColor(rect) {
      const progress = getProgress(rect);
      if (rect.status === "overdue") return "bg-red-500";
      if (progress === 100) return "bg-green-500";
      if (progress >= 50) return "bg-blue-500";
      return "bg-yellow-500";
    }
    function isOverdue(rect) {
      return rect.status === "overdue" || rect.status !== "completed" && isPast(rect.deadline);
    }
    function daysOverdue(rect) {
      return daysBetween(rect.deadline, formatDate(/* @__PURE__ */ new Date()));
    }
    async function handleItemUpdate(itemIndex, completed, note) {
      if (!selectedRect.value) return;
      if (selectedRect.value.status === "pending" && canEditItems.value) {
        await dataStore.updateRectificationStatus(selectedRect.value.id, "in_progress");
      }
      await dataStore.updateRectificationItem(selectedRect.value.id, itemIndex, completed, note);
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-6" }, _attrs))}><div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold text-gray-900">整改追踪</h1><p class="text-gray-500 mt-1">管理和跟踪所有整改任务</p></div></div><div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4"><div class="flex flex-wrap gap-4"><div class="min-w-[180px]"><label class="block text-sm font-medium text-gray-700 mb-1">状态</label><select class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "") : ssrLooseEqual(filters.status, "")) ? " selected" : ""}>全部状态</option><option value="pending"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "pending") : ssrLooseEqual(filters.status, "pending")) ? " selected" : ""}>待处理</option><option value="in_progress"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "in_progress") : ssrLooseEqual(filters.status, "in_progress")) ? " selected" : ""}>进行中</option><option value="completed"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "completed") : ssrLooseEqual(filters.status, "completed")) ? " selected" : ""}>已完成</option><option value="overdue"${ssrIncludeBooleanAttr(Array.isArray(filters.status) ? ssrLooseContain(filters.status, "overdue") : ssrLooseEqual(filters.status, "overdue")) ? " selected" : ""}>已逾期</option></select></div><div class="min-w-[180px]"><label class="block text-sm font-medium text-gray-700 mb-1">项目</label><select class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filters.projectId) ? ssrLooseContain(filters.projectId, "") : ssrLooseEqual(filters.projectId, "")) ? " selected" : ""}>全部项目</option><!--[-->`);
      ssrRenderList(unref(dataStore).projects, (project) => {
        _push(`<option${ssrRenderAttr("value", project.id)}${ssrIncludeBooleanAttr(Array.isArray(filters.projectId) ? ssrLooseContain(filters.projectId, project.id) : ssrLooseEqual(filters.projectId, project.id)) ? " selected" : ""}>${ssrInterpolate(project.name)}</option>`);
      });
      _push(`<!--]--></select></div><div class="flex-1 min-w-[200px]"><label class="block text-sm font-medium text-gray-700 mb-1">截止日期</label><div class="flex gap-2"><input${ssrRenderAttr("value", filters.startDeadline)} type="date" class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><span class="flex items-center text-gray-400">至</span><input${ssrRenderAttr("value", filters.endDeadline)} type="date" class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></div></div><div class="flex items-end gap-2"><button class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"> 重置 </button></div></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-4"><div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p class="text-sm text-gray-500">待处理</p><p class="text-2xl font-bold text-yellow-600 mt-1">${ssrInterpolate(stats.value.pending)}</p></div><div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p class="text-sm text-gray-500">进行中</p><p class="text-2xl font-bold text-blue-600 mt-1">${ssrInterpolate(stats.value.inProgress)}</p></div><div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p class="text-sm text-gray-500">已逾期</p><p class="text-2xl font-bold text-red-600 mt-1">${ssrInterpolate(stats.value.overdue)}</p></div><div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p class="text-sm text-gray-500">已完成</p><p class="text-2xl font-bold text-green-600 mt-1">${ssrInterpolate(stats.value.completed)}</p></div></div><div class="space-y-4"><!--[-->`);
      ssrRenderList(filteredRectifications.value, (rect) => {
        _push(`<div class="${ssrRenderClass([[
          rect.status === "overdue" ? "border-red-300 bg-red-50" : "border-gray-100 hover:border-primary-200"
        ], "bg-white rounded-xl shadow-sm border transition-all duration-200 overflow-hidden"])}"><div class="p-4"><div class="flex items-start justify-between mb-3"><div class="flex-1"><div class="flex items-center gap-3 mb-1"><h3 class="font-semibold text-gray-900">${ssrInterpolate(getProjectName(rect.projectId))}</h3><span class="${ssrRenderClass([unref(getRectificationStatusColor)(rect.status), "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"])}">${ssrInterpolate(unref(getRectificationStatusText)(rect.status))}</span>`);
        if (rect.status === "overdue") {
          _push(`<span class="text-red-500 text-xs">⚠️ 已逾期</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><p class="text-sm text-gray-500"> 共 ${ssrInterpolate(rect.items.length)} 项整改 · 截止日期：${ssrInterpolate(rect.deadline)}</p></div><div class="flex items-center gap-2 ml-4"><button class="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"> 查看详情 </button></div></div><div class="mb-3"><div class="flex items-center justify-between text-sm mb-1"><span class="text-gray-500">整改进度</span><span class="font-medium text-gray-900">${ssrInterpolate(getProgress(rect))}%</span></div><div class="w-full bg-gray-200 rounded-full h-2"><div class="${ssrRenderClass([getProgressColor(rect), "h-2 rounded-full transition-all duration-500"])}" style="${ssrRenderStyle({ width: `${getProgress(rect)}%` })}"></div></div></div><div class="flex items-center gap-4 text-sm text-gray-500">`);
        if (rect.assigneeId) {
          _push(`<span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> 负责人：${ssrInterpolate(getStaffName(rect.assigneeId))}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (rect.completedDate) {
          _push(`<span class="flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> 完成日期：${ssrInterpolate(rect.completedDate)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div>`);
      });
      _push(`<!--]-->`);
      if (filteredRectifications.value.length === 0) {
        _push(`<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center"><span class="text-4xl mb-3 block">✅</span><p class="text-gray-500">暂无整改任务</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (detailModalVisible.value) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"><div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"><div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between"><div><h2 class="text-xl font-bold text-gray-900">整改详情</h2>`);
          if (selectedRect.value) {
            _push2(`<p class="text-sm text-gray-500 mt-1">${ssrInterpolate(getProjectName(selectedRect.value.projectId))} · 截止日期：${ssrInterpolate(selectedRect.value.deadline)}</p>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div><button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`);
          if (selectedRect.value) {
            _push2(`<div class="flex-1 overflow-y-auto p-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"><div><div class="flex items-center gap-3 mb-3"><span class="${ssrRenderClass([unref(getRectificationStatusColor)(selectedRect.value.status), "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"])}">${ssrInterpolate(unref(getRectificationStatusText)(selectedRect.value.status))}</span>`);
            if (isOverdue(selectedRect.value)) {
              _push2(`<span class="text-red-500 text-sm font-medium"> ⚠️ 已逾期 ${ssrInterpolate(daysOverdue(selectedRect.value))} 天 </span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="space-y-2 text-sm"><p><span class="text-gray-500">整改项目数：</span>${ssrInterpolate(selectedRect.value.items.length)} 项</p><p><span class="text-gray-500">整改进度：</span>${ssrInterpolate(getProgress(selectedRect.value))}%</p>`);
            if (selectedRect.value.assigneeId) {
              _push2(`<p><span class="text-gray-500">负责人：</span>${ssrInterpolate(getStaffName(selectedRect.value.assigneeId))}</p>`);
            } else {
              _push2(`<!---->`);
            }
            if (selectedRect.value.completedDate) {
              _push2(`<p><span class="text-gray-500">完成日期：</span>${ssrInterpolate(selectedRect.value.completedDate)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div><div class="w-full bg-gray-200 rounded-full h-3 mb-2"><div class="${ssrRenderClass([getProgressColor(selectedRect.value), "h-3 rounded-full transition-all duration-500"])}" style="${ssrRenderStyle({ width: `${getProgress(selectedRect.value)}%` })}"></div></div><div class="flex justify-between text-sm"><span class="text-gray-500"> 已完成：${ssrInterpolate(completedCount(selectedRect.value))} / ${ssrInterpolate(selectedRect.value.items.length)}</span><span class="text-gray-500"> 剩余：${ssrInterpolate(selectedRect.value.items.length - completedCount(selectedRect.value))} 项 </span></div>`);
            if (canAssign.value && selectedRect.value.status !== "completed") {
              _push2(`<div class="mt-4"><label class="block text-sm font-medium text-gray-700 mb-2">分配负责人</label><div class="flex gap-2"><select class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(assignForm.assigneeId) ? ssrLooseContain(assignForm.assigneeId, "") : ssrLooseEqual(assignForm.assigneeId, "")) ? " selected" : ""}>选择负责人</option><!--[-->`);
              ssrRenderList(projectSupervisors.value, (staff) => {
                _push2(`<option${ssrRenderAttr("value", staff.id)}${ssrIncludeBooleanAttr(Array.isArray(assignForm.assigneeId) ? ssrLooseContain(assignForm.assigneeId, staff.id) : ssrLooseEqual(assignForm.assigneeId, staff.id)) ? " selected" : ""}>${ssrInterpolate(staff.name)}</option>`);
              });
              _push2(`<!--]--></select><button class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"> 分配 </button></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div><div class="mb-6"><h3 class="text-lg font-semibold text-gray-900 mb-4">整改项</h3><div class="space-y-3"><!--[-->`);
            ssrRenderList(selectedRect.value.items, (item, index) => {
              _push2(ssrRenderComponent(_sfc_main$1, {
                key: index,
                item,
                "item-index": index,
                "rect-id": selectedRect.value.id,
                readonly: !canEditItems.value,
                onUpdate: handleItemUpdate
              }, null, _parent));
            });
            _push2(`<!--]--></div></div>`);
            if (canEditItems.value && selectedRect.value.status !== "completed") {
              _push2(`<div class="mb-6"><h3 class="text-lg font-semibold text-gray-900 mb-4">上传整改照片</h3><div class="flex flex-wrap gap-3"><!--[-->`);
              ssrRenderList(selectedRect.value.photos, (photo, index) => {
                _push2(`<div class="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100"><img${ssrRenderAttr("src", photo)} class="w-full h-full object-cover"></div>`);
              });
              _push2(`<!--]--><button class="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"><svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg><span class="text-sm">添加照片</span></button></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (selectedRect.value.photos.length > 0 && selectedRect.value.status === "completed") {
              _push2(`<div class="mb-6"><h3 class="text-lg font-semibold text-gray-900 mb-4">整改后照片</h3><div class="grid grid-cols-3 gap-3"><!--[-->`);
              ssrRenderList(selectedRect.value.photos, (photo, index) => {
                _push2(`<div class="aspect-video rounded-lg overflow-hidden bg-gray-100"><img${ssrRenderAttr("src", photo)} class="w-full h-full object-cover"></div>`);
              });
              _push2(`<!--]--></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (canReview.value && selectedRect.value.status === "completed") {
              _push2(`<div class="mb-6"><div class="p-4 bg-blue-50 rounded-xl border border-blue-100"><h3 class="text-lg font-semibold text-gray-900 mb-3">复查确认</h3><p class="text-sm text-gray-600 mb-4">请检查整改是否符合要求，确认后完成整改流程。</p><div class="mb-4"><label class="block text-sm font-medium text-gray-700 mb-2">复查意见</label><textarea rows="2" placeholder="请输入复查意见..." class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none">${ssrInterpolate(reviewForm.note)}</textarea></div><div class="flex gap-3"><button class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"> ✅ 整改通过 </button><button class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"> ❌ 重新整改 </button></div></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (selectedRect.value.note) {
              _push2(`<div class="mb-6"><h3 class="text-lg font-semibold text-gray-900 mb-3">备注</h3><p class="text-gray-600">${ssrInterpolate(selectedRect.value.note)}</p></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`<div class="px-6 py-4 border-t border-gray-100 flex justify-end"><button class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"> 关闭 </button></div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/rectification/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=index-i3DkuTek.js.map
