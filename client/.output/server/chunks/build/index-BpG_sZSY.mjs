import { defineComponent, ref, computed, mergeProps, unref, watch, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderClass, ssrRenderComponent } from 'vue/server-renderer';
import { u as useDataStore, h as isToday, f as formatDate } from './data-CvF3Pjf4.mjs';
import { j as getTaskTypeText } from './formatters-B147ECSY.mjs';
import { u as useAuthStore } from './auth-BO_zE_6L.mjs';
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

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ScheduleForm",
  __ssrInlineRender: true,
  props: {
    visible: { type: Boolean, default: false },
    schedule: { default: null },
    initialDate: { default: "" },
    initialStaffId: { default: "" }
  },
  emits: ["close", "submit", "update"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const dataStore = useDataStore();
    const isEdit = computed(() => !!props.schedule);
    const submitting = ref(false);
    const conflictError = ref("");
    const taskTypes = [
      { value: "daily", label: "\u65E5\u5E38\u6E05\u6D01" },
      { value: "deep", label: "\u6DF1\u5EA6\u6E05\u6D01" },
      { value: "special", label: "\u4E13\u9879\u6E05\u6D01" }
    ];
    const projects = computed(() => dataStore.projects.filter((p) => p.status === "active"));
    const availableStaff = computed(() => dataStore.staff.filter((s) => s.status === "active"));
    const form = ref({
      staffId: "",
      projectId: "",
      date: "",
      startTime: "08:00",
      endTime: "16:00",
      taskType: "daily",
      note: ""
    });
    watch(() => props.visible, (visible) => {
      if (visible) {
        if (props.schedule) {
          form.value = {
            staffId: props.schedule.staffId,
            projectId: props.schedule.projectId,
            date: props.schedule.date,
            startTime: props.schedule.startTime,
            endTime: props.schedule.endTime,
            taskType: props.schedule.taskType,
            note: props.schedule.note
          };
        } else {
          form.value = {
            staffId: props.initialStaffId || "",
            projectId: "",
            date: props.initialDate || formatDate(/* @__PURE__ */ new Date()),
            startTime: "08:00",
            endTime: "16:00",
            taskType: "daily",
            note: ""
          };
        }
        conflictError.value = "";
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" }, _attrs))}><div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"><div class="px-6 py-4 border-b border-gray-200 bg-gray-50"><h3 class="text-lg font-semibold text-gray-900">${ssrInterpolate(isEdit.value ? "\u7F16\u8F91\u6392\u73ED" : "\u521B\u5EFA\u6392\u73ED")}</h3></div><form class="p-6 space-y-4"><div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-1">\u5458\u5DE5</label><select class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required><option value=""${ssrIncludeBooleanAttr(Array.isArray(form.value.staffId) ? ssrLooseContain(form.value.staffId, "") : ssrLooseEqual(form.value.staffId, "")) ? " selected" : ""}>\u8BF7\u9009\u62E9\u5458\u5DE5</option><!--[-->`);
      ssrRenderList(availableStaff.value, (staff) => {
        _push(`<option${ssrRenderAttr("value", staff.id)}${ssrIncludeBooleanAttr(Array.isArray(form.value.staffId) ? ssrLooseContain(form.value.staffId, staff.id) : ssrLooseEqual(form.value.staffId, staff.id)) ? " selected" : ""}>${ssrInterpolate(staff.name)}</option>`);
      });
      _push(`<!--]--></select></div><div><label class="block text-sm font-medium text-gray-700 mb-1">\u9879\u76EE</label><select class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required><option value=""${ssrIncludeBooleanAttr(Array.isArray(form.value.projectId) ? ssrLooseContain(form.value.projectId, "") : ssrLooseEqual(form.value.projectId, "")) ? " selected" : ""}>\u8BF7\u9009\u62E9\u9879\u76EE</option><!--[-->`);
      ssrRenderList(projects.value, (project) => {
        _push(`<option${ssrRenderAttr("value", project.id)}${ssrIncludeBooleanAttr(Array.isArray(form.value.projectId) ? ssrLooseContain(form.value.projectId, project.id) : ssrLooseEqual(form.value.projectId, project.id)) ? " selected" : ""}>${ssrInterpolate(project.name)}</option>`);
      });
      _push(`<!--]--></select></div></div><div><label class="block text-sm font-medium text-gray-700 mb-1">\u65E5\u671F</label><input${ssrRenderAttr("value", form.value.date)} type="date" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required></div><div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-1">\u5F00\u59CB\u65F6\u95F4</label><input${ssrRenderAttr("value", form.value.startTime)} type="time" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required></div><div><label class="block text-sm font-medium text-gray-700 mb-1">\u7ED3\u675F\u65F6\u95F4</label><input${ssrRenderAttr("value", form.value.endTime)} type="time" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required></div></div><div><label class="block text-sm font-medium text-gray-700 mb-1">\u4EFB\u52A1\u7C7B\u578B</label><div class="flex gap-3"><!--[-->`);
      ssrRenderList(taskTypes, (type) => {
        _push(`<label class="flex items-center gap-2 cursor-pointer"><input type="radio"${ssrIncludeBooleanAttr(ssrLooseEqual(form.value.taskType, type.value)) ? " checked" : ""}${ssrRenderAttr("value", type.value)} class="w-4 h-4 text-primary-600 focus:ring-primary-500"><span class="text-sm text-gray-700">${ssrInterpolate(type.label)}</span></label>`);
      });
      _push(`<!--]--></div></div><div><label class="block text-sm font-medium text-gray-700 mb-1">\u5907\u6CE8</label><textarea rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" placeholder="\u53EF\u9009\uFF0C\u586B\u5199\u6392\u73ED\u5907\u6CE8...">${ssrInterpolate(form.value.note)}</textarea></div>`);
      if (conflictError.value) {
        _push(`<div class="p-3 bg-red-50 border border-red-200 rounded-lg"><p class="text-sm text-red-600">${ssrInterpolate(conflictError.value)}</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex justify-end gap-3 pt-2"><button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"> \u53D6\u6D88 </button><button type="submit"${ssrIncludeBooleanAttr(submitting.value) ? " disabled" : ""} class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">${ssrInterpolate(submitting.value ? "\u4FDD\u5B58\u4E2D..." : isEdit.value ? "\u4FDD\u5B58\u4FEE\u6539" : "\u521B\u5EFA\u6392\u73ED")}</button></div></form></div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ScheduleForm.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const dataStore = useDataStore();
    useAuthStore();
    const currentWeekStart = ref(getWeekStart(/* @__PURE__ */ new Date()));
    const filterProjectId = ref("");
    const filterStaffId = ref("");
    const formVisible = ref(false);
    const editingSchedule = ref(null);
    const initialFormDate = ref("");
    const initialFormStaffId = ref("");
    const dragOverIndex = ref(-1);
    ref(null);
    const weekDaysLabels = ["\u5468\u4E00", "\u5468\u4E8C", "\u5468\u4E09", "\u5468\u56DB", "\u5468\u4E94", "\u5468\u516D", "\u5468\u65E5"];
    const projects = computed(() => dataStore.projects);
    const activeStaff = computed(() => dataStore.staff.filter((s) => s.status === "active"));
    const weekDays = computed(() => {
      const days = [];
      const startDate = new Date(currentWeekStart.value);
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push({
          date: formatDate(date),
          label: weekDaysLabels[i],
          day: date.getDate(),
          month: date.getMonth() + 1,
          isToday: isToday(date)
        });
      }
      return days;
    });
    const weekLabel = computed(() => {
      const days = weekDays.value;
      if (days.length === 0) return "";
      const start = days[0];
      const end = days[6];
      if (start.month === end.month) {
        return `${start.month}\u6708${start.day}\u65E5 - ${end.day}\u65E5`;
      } else {
        return `${start.month}\u6708${start.day}\u65E5 - ${end.month}\u6708${end.day}\u65E5`;
      }
    });
    const filteredSchedules = computed(() => {
      let schedules = dataStore.getSchedulesByWeek(currentWeekStart.value);
      if (filterProjectId.value) {
        schedules = schedules.filter((s) => s.projectId === filterProjectId.value);
      }
      if (filterStaffId.value) {
        schedules = schedules.filter((s) => s.staffId === filterStaffId.value);
      }
      return schedules;
    });
    function getWeekStart(date) {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return formatDate(monday);
    }
    function getSchedulesForDate(date) {
      return filteredSchedules.value.filter((s) => s.date === date);
    }
    function getStaffName(staffId) {
      const staff = dataStore.getStaffById(staffId);
      return (staff == null ? void 0 : staff.name) || "\u672A\u77E5";
    }
    function getProjectName(projectId) {
      const project = dataStore.getProjectById(projectId);
      return (project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE";
    }
    function getScheduleColorClass(status) {
      const classes = {
        scheduled: "bg-blue-50 border-blue-300",
        in_progress: "bg-yellow-50 border-yellow-300",
        completed: "bg-green-50 border-green-300",
        cancelled: "bg-gray-100 border-gray-300 opacity-60"
      };
      return classes[status] || "bg-blue-50 border-blue-300";
    }
    function getTaskTypeClass(type) {
      const classes = {
        daily: "bg-blue-100 text-blue-700",
        deep: "bg-purple-100 text-purple-700",
        special: "bg-orange-100 text-orange-700"
      };
      return classes[type] || "bg-gray-100 text-gray-700";
    }
    function closeForm() {
      formVisible.value = false;
      editingSchedule.value = null;
    }
    function handleFormSubmit(scheduleData) {
      dataStore.createSchedule(scheduleData);
      closeForm();
    }
    function handleFormUpdate(scheduleId, updates) {
      console.log("\u6392\u73ED\u5DF2\u66F4\u65B0:", scheduleId, updates);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ScheduleForm = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-50" }, _attrs))}><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><div class="mb-6"><h1 class="text-2xl font-bold text-gray-900">\u6392\u73ED\u7BA1\u7406</h1><p class="text-gray-500 mt-1">\u7BA1\u7406\u5458\u5DE5\u6392\u73ED\uFF0C\u652F\u6301\u62D6\u62FD\u521B\u5EFA\u548C\u51B2\u7A81\u68C0\u6D4B</p></div><div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6"><div class="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center gap-4"><div class="flex items-center gap-2"><label class="text-sm font-medium text-gray-700">\u9879\u76EE\u7B5B\u9009:</label><select class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filterProjectId.value) ? ssrLooseContain(filterProjectId.value, "") : ssrLooseEqual(filterProjectId.value, "")) ? " selected" : ""}>\u5168\u90E8\u9879\u76EE</option><!--[-->`);
      ssrRenderList(projects.value, (project) => {
        _push(`<option${ssrRenderAttr("value", project.id)}${ssrIncludeBooleanAttr(Array.isArray(filterProjectId.value) ? ssrLooseContain(filterProjectId.value, project.id) : ssrLooseEqual(filterProjectId.value, project.id)) ? " selected" : ""}>${ssrInterpolate(project.name)}</option>`);
      });
      _push(`<!--]--></select></div><div class="flex items-center gap-2"><label class="text-sm font-medium text-gray-700">\u5458\u5DE5\u7B5B\u9009:</label><select class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(filterStaffId.value) ? ssrLooseContain(filterStaffId.value, "") : ssrLooseEqual(filterStaffId.value, "")) ? " selected" : ""}>\u5168\u90E8\u5458\u5DE5</option><!--[-->`);
      ssrRenderList(activeStaff.value, (staff) => {
        _push(`<option${ssrRenderAttr("value", staff.id)}${ssrIncludeBooleanAttr(Array.isArray(filterStaffId.value) ? ssrLooseContain(filterStaffId.value, staff.id) : ssrLooseEqual(filterStaffId.value, staff.id)) ? " selected" : ""}>${ssrInterpolate(staff.name)}</option>`);
      });
      _push(`<!--]--></select></div><div class="flex items-center gap-2 ml-auto"><button class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button><span class="text-base font-semibold text-gray-900 min-w-[200px] text-center">${ssrInterpolate(weekLabel.value)}</span><button class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button><button class="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"> \u672C\u5468 </button></div><button class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> \u65B0\u5EFA\u6392\u73ED </button></div></div><div class="flex gap-6"><div class="w-64 flex-shrink-0"><div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div class="px-4 py-3 border-b border-gray-200 bg-gray-50"><h3 class="font-medium text-gray-900">\u5458\u5DE5\u5217\u8868</h3><p class="text-xs text-gray-500 mt-1">\u62D6\u62FD\u5458\u5DE5\u5230\u65E5\u5386\u521B\u5EFA\u6392\u73ED</p></div><div class="p-3 space-y-2 max-h-[600px] overflow-y-auto"><!--[-->`);
      ssrRenderList(activeStaff.value, (staff) => {
        _push(`<div draggable="true" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-primary-50 hover:border-primary-300 border border-gray-200 transition-colors"><div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0"><span class="text-primary-600 font-semibold text-sm">${ssrInterpolate(staff.name.charAt(0))}</span></div><div class="flex-1 min-w-0"><p class="font-medium text-gray-900 text-sm truncate">${ssrInterpolate(staff.name)}</p><p class="text-xs text-gray-500">${ssrInterpolate(staff.position === "supervisor" ? "\u4E3B\u7BA1" : "\u4FDD\u6D01\u5458")}</p></div></div>`);
      });
      _push(`<!--]--></div></div><div class="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4"><h4 class="text-sm font-medium text-gray-700 mb-3">\u56FE\u4F8B</h4><div class="space-y-2"><div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-blue-100 border border-blue-300"></span><span class="text-xs text-gray-600">\u5DF2\u6392\u671F</span></div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-green-100 border border-green-300"></span><span class="text-xs text-gray-600">\u5DF2\u5B8C\u6210</span></div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></span><span class="text-xs text-gray-600">\u8FDB\u884C\u4E2D</span></div><div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-gray-100 border border-gray-300"></span><span class="text-xs text-gray-600">\u5DF2\u53D6\u6D88</span></div></div></div></div><div class="flex-1"><div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div class="grid grid-cols-7 border-b border-gray-200"><!--[-->`);
      ssrRenderList(weekDays.value, (day, index) => {
        _push(`<div class="${ssrRenderClass([
          "py-3 text-center",
          day.isToday ? "bg-primary-50" : "bg-gray-50"
        ])}"><p class="${ssrRenderClass(["text-sm font-medium", day.isToday ? "text-primary-600" : "text-gray-700"])}">${ssrInterpolate(day.label)}</p><p class="${ssrRenderClass(["text-xs", day.isToday ? "text-primary-500" : "text-gray-500"])}">${ssrInterpolate(day.month)}/${ssrInterpolate(day.day)}</p></div>`);
      });
      _push(`<!--]--></div><div class="grid grid-cols-7"><!--[-->`);
      ssrRenderList(weekDays.value, (day, dayIndex) => {
        _push(`<div class="${ssrRenderClass([
          "min-h-[500px] p-2 border-r border-gray-100 transition-colors",
          day.isToday ? "bg-primary-50/30" : "bg-white",
          dragOverIndex.value === dayIndex ? "bg-primary-100/50" : ""
        ])}"><div class="space-y-2"><!--[-->`);
        ssrRenderList(getSchedulesForDate(day.date), (schedule) => {
          _push(`<div class="${ssrRenderClass([
            "p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md",
            getScheduleColorClass(schedule.status)
          ])}"><div class="flex items-start justify-between mb-1"><p class="font-medium text-xs text-gray-900 truncate">${ssrInterpolate(getStaffName(schedule.staffId))}</p><button class="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><svg class="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><p class="text-xs text-gray-600 truncate mb-1">${ssrInterpolate(getProjectName(schedule.projectId))}</p><p class="text-xs text-gray-500 mb-1">${ssrInterpolate(schedule.startTime)} - ${ssrInterpolate(schedule.endTime)}</p><span class="${ssrRenderClass([
            "inline-block px-1.5 py-0.5 text-xs rounded",
            getTaskTypeClass(schedule.taskType)
          ])}">${ssrInterpolate(("getTaskTypeText" in _ctx ? _ctx.getTaskTypeText : unref(getTaskTypeText))(schedule.taskType))}</span></div>`);
        });
        _push(`<!--]--></div></div>`);
      });
      _push(`<!--]--></div></div></div></div>`);
      _push(ssrRenderComponent(_component_ScheduleForm, {
        visible: formVisible.value,
        schedule: editingSchedule.value,
        "initial-date": initialFormDate.value,
        "initial-staff-id": initialFormStaffId.value,
        onClose: closeForm,
        onSubmit: handleFormSubmit,
        onUpdate: handleFormUpdate
      }, null, _parent));
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/schedule/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BpG_sZSY.mjs.map
