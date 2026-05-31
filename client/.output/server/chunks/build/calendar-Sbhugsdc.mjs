import { defineComponent, ref, computed, watch, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrRenderClass, ssrRenderComponent } from 'vue/server-renderer';
import { u as useDataStore, e as endOfMonth, s as startOfMonth, f as formatDate, c as getFirstDayOfMonth, g as getDaysInMonth, h as isToday, r as relativeTime } from './data-CvF3Pjf4.mjs';
import { u as useFilterStore } from './filter-GkuypMRw.mjs';
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

const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "CalendarEventItem",
  __ssrInlineRender: true,
  props: {
    event: {},
    compact: { type: Boolean, default: false }
  },
  emits: ["click"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const typeLabel = computed(() => {
      const labels = {
        schedule: "\u6392\u73ED",
        punch: "\u6253\u5361\u5F02\u5E38",
        inspection: "\u8D28\u68C0",
        requisition: "\u8017\u6750\u7533\u9886"
      };
      return labels[props.event.type] || props.event.type;
    });
    const statusLabel = computed(() => {
      var _a;
      const statusMap = {
        schedule: {
          scheduled: "\u5F85\u6267\u884C",
          in_progress: "\u8FDB\u884C\u4E2D",
          completed: "\u5DF2\u5B8C\u6210",
          cancelled: "\u5DF2\u53D6\u6D88"
        },
        punch: {
          absent: "\u7F3A\u52E4",
          late: "\u8FDF\u5230",
          early_leave: "\u65E9\u9000"
        },
        inspection: {
          excellent: "\u4F18\u79C0",
          good: "\u826F\u597D",
          pass: "\u5408\u683C",
          fail: "\u4E0D\u5408\u683C"
        },
        requisition: {
          draft: "\u8349\u7A3F",
          pending: "\u5F85\u5BA1\u6838",
          approved: "\u5DF2\u6279\u51C6",
          rejected: "\u5DF2\u62D2\u7EDD",
          delivered: "\u5DF2\u53D1\u8D27",
          completed: "\u5DF2\u5B8C\u6210"
        }
      };
      return ((_a = statusMap[props.event.type]) == null ? void 0 : _a[props.event.status]) || props.event.status;
    });
    const statusClass = computed(() => {
      const colorMap = {
        completed: "bg-green-100 text-green-700",
        in_progress: "bg-blue-100 text-blue-700",
        scheduled: "bg-gray-100 text-gray-700",
        cancelled: "bg-gray-200 text-gray-600",
        absent: "bg-red-100 text-red-700",
        late: "bg-yellow-100 text-yellow-700",
        early_leave: "bg-yellow-100 text-yellow-700",
        excellent: "bg-green-100 text-green-700",
        good: "bg-green-100 text-green-700",
        pass: "bg-yellow-100 text-yellow-700",
        fail: "bg-red-100 text-red-700",
        pending: "bg-yellow-100 text-yellow-700",
        approved: "bg-green-100 text-green-700",
        rejected: "bg-red-100 text-red-700",
        delivered: "bg-blue-100 text-blue-700",
        draft: "bg-gray-100 text-gray-700"
      };
      return colorMap[props.event.status] || "bg-gray-100 text-gray-700";
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: [
          "p-2 rounded border-l-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
          __props.event.color,
          __props.compact ? "text-xs" : "text-sm"
        ]
      }, _attrs))}><div class="flex items-center justify-between gap-1"><span class="${ssrRenderClass([__props.compact ? "text-xs" : "text-sm", "font-medium truncate"])}">${ssrInterpolate(typeLabel.value)}</span>`);
      if (!__props.compact) {
        _push(`<span class="${ssrRenderClass([
          "px-1.5 py-0.5 rounded text-xs font-medium",
          statusClass.value
        ])}">${ssrInterpolate(statusLabel.value)}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (!__props.compact) {
        _push(`<div class="mt-1 text-gray-700 truncate">${ssrInterpolate(__props.event.title)}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (!__props.compact && __props.event.description) {
        _push(`<div class="mt-0.5 text-xs text-gray-500 truncate">${ssrInterpolate(__props.event.description)}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/CalendarEventItem.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "CalendarView",
  __ssrInlineRender: true,
  props: {
    events: {}
  },
  emits: ["dateSelect", "eventClick"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const filterStore = useFilterStore();
    const viewMode = computed(() => filterStore.calendar.viewMode);
    const currentDate = computed(() => filterStore.calendar.currentDate);
    const selectedDate = computed(() => filterStore.calendar.selectedDate);
    const weekDays = ["\u5468\u4E00", "\u5468\u4E8C", "\u5468\u4E09", "\u5468\u56DB", "\u5468\u4E94", "\u5468\u516D", "\u5468\u65E5"];
    const currentPeriodLabel = computed(() => {
      const date = new Date(currentDate.value);
      if (viewMode.value === "month") {
        return `${date.getFullYear()}\u5E74${date.getMonth() + 1}\u6708`;
      } else if (viewMode.value === "week") {
        const weekData = weekDaysData.value;
        if (weekData.length > 0) {
          const start = weekData[0];
          const end = weekData[6];
          if (start.month === end.month) {
            return `${start.month}\u6708${start.day}\u65E5 - ${end.day}\u65E5`;
          } else {
            return `${start.month}\u6708${start.day}\u65E5 - ${end.month}\u6708${end.day}\u65E5`;
          }
        }
      } else {
        return `${date.getFullYear()}\u5E74${date.getMonth() + 1}\u6708${date.getDate()}\u65E5`;
      }
      return "";
    });
    const weekDayLabel = computed(() => {
      const days = ["\u5468\u65E5", "\u5468\u4E00", "\u5468\u4E8C", "\u5468\u4E09", "\u5468\u56DB", "\u5468\u4E94", "\u5468\u516D"];
      const dayIndex = new Date(currentDate.value).getDay();
      return days[dayIndex];
    });
    const monthDays = computed(() => {
      const date = new Date(currentDate.value);
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = getFirstDayOfMonth(year, month + 1);
      const daysInMonth = getDaysInMonth(year, month + 1);
      const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
      const days = [];
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth + 1);
      for (let i = adjustedFirstDay - 1; i >= 0; i--) {
        const dayNum = daysInPrevMonth - i;
        days.push({
          date: formatDate(new Date(prevYear, prevMonth, dayNum)),
          day: dayNum,
          month: prevMonth + 1,
          year: prevYear,
          isCurrentMonth: false,
          isToday: isToday(new Date(prevYear, prevMonth, dayNum)),
          isSelected: selectedDate.value === formatDate(new Date(prevYear, prevMonth, dayNum))
        });
      }
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({
          date: formatDate(new Date(year, month, i)),
          day: i,
          month: month + 1,
          year,
          isCurrentMonth: true,
          isToday: isToday(new Date(year, month, i)),
          isSelected: selectedDate.value === formatDate(new Date(year, month, i))
        });
      }
      const remainingDays = 42 - days.length;
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          date: formatDate(new Date(nextYear, nextMonth, i)),
          day: i,
          month: nextMonth + 1,
          year: nextYear,
          isCurrentMonth: false,
          isToday: isToday(new Date(nextYear, nextMonth, i)),
          isSelected: selectedDate.value === formatDate(new Date(nextYear, nextMonth, i))
        });
      }
      return days;
    });
    const weekDaysData = computed(() => {
      const date = new Date(currentDate.value);
      const dayOfWeek = date.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(date);
        d.setDate(date.getDate() + mondayOffset + i);
        days.push({
          date: formatDate(d),
          day: d.getDate(),
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          isCurrentMonth: true,
          isToday: isToday(d),
          isSelected: selectedDate.value === formatDate(d)
        });
      }
      return days;
    });
    const dayEvents = computed(() => {
      return props.events.filter((e) => e.date === currentDate.value);
    });
    const groupedDayEvents = computed(() => {
      const groups = {};
      dayEvents.value.forEach((event) => {
        if (!groups[event.type]) {
          groups[event.type] = [];
        }
        groups[event.type].push(event);
      });
      return groups;
    });
    const getEventsForDate = (date) => {
      return props.events.filter((e) => e.date === date);
    };
    const typeLabel = (type) => {
      const labels = {
        schedule: "\u6392\u73ED",
        punch: "\u6253\u5361\u5F02\u5E38",
        inspection: "\u8D28\u68C0",
        requisition: "\u8017\u6750\u7533\u9886"
      };
      return labels[type] || type;
    };
    const typeColor = (type) => {
      const colors = {
        schedule: "bg-blue-500",
        punch: "bg-red-500",
        inspection: "bg-green-500",
        requisition: "bg-purple-500"
      };
      return colors[type] || "bg-gray-500";
    };
    const handleEventClick = (event) => {
      emit("eventClick", event);
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_CalendarEventItem = _sfc_main$3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" }, _attrs))}><div class="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between"><div class="flex items-center gap-2"><button class="${ssrRenderClass([{ "bg-primary-600 text-white border-primary-600 hover:bg-primary-700": viewMode.value === "month" }, "px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-white transition-colors"])}"> \u6708 </button><button class="${ssrRenderClass([{ "bg-primary-600 text-white border-primary-600 hover:bg-primary-700": viewMode.value === "week" }, "px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-white transition-colors"])}"> \u5468 </button><button class="${ssrRenderClass([{ "bg-primary-600 text-white border-primary-600 hover:bg-primary-700": viewMode.value === "day" }, "px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-white transition-colors"])}"> \u65E5 </button></div><div class="flex items-center gap-3"><div class="flex items-center gap-1"><button class="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"><svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button><span class="text-base font-semibold text-gray-900 min-w-[140px] text-center">${ssrInterpolate(currentPeriodLabel.value)}</span><button class="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"><svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button></div><button class="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"> \u4ECA\u5929 </button></div></div>`);
      if (viewMode.value === "month") {
        _push(`<div class="p-4"><div class="grid grid-cols-7 gap-1 mb-2"><!--[-->`);
        ssrRenderList(weekDays, (day) => {
          _push(`<div class="text-center text-sm font-medium text-gray-500 py-2">${ssrInterpolate(day)}</div>`);
        });
        _push(`<!--]--></div><div class="grid grid-cols-7 gap-1"><!--[-->`);
        ssrRenderList(monthDays.value, (day, index) => {
          _push(`<div class="${ssrRenderClass([
            "min-h-[100px] p-1 rounded-lg border transition-all cursor-pointer",
            day.isCurrentMonth ? "bg-white border-gray-200 hover:border-primary-400" : "bg-gray-50 border-gray-100",
            day.isToday ? "ring-2 ring-primary-500 ring-offset-1" : "",
            day.isSelected ? "bg-primary-50 border-primary-400" : ""
          ])}"><div class="${ssrRenderClass([
            "text-sm font-medium mb-1",
            day.isToday ? "text-primary-600" : "",
            !day.isCurrentMonth ? "text-gray-400" : "text-gray-700"
          ])}">${ssrInterpolate(day.day)}</div><div class="space-y-1"><!--[-->`);
          ssrRenderList(getEventsForDate(day.date).slice(0, 2), (event) => {
            _push(ssrRenderComponent(_component_CalendarEventItem, {
              key: event.id,
              event,
              compact: true,
              onClick: ($event) => handleEventClick(event)
            }, null, _parent));
          });
          _push(`<!--]-->`);
          if (getEventsForDate(day.date).length > 2) {
            _push(`<div class="text-xs text-gray-500 text-center"> +${ssrInterpolate(getEventsForDate(day.date).length - 2)} \u66F4\u591A </div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else if (viewMode.value === "week") {
        _push(`<div class="p-4"><div class="grid grid-cols-7 gap-1 mb-2"><!--[-->`);
        ssrRenderList(weekDays, (day) => {
          _push(`<div class="text-center text-sm font-medium text-gray-500 py-2">${ssrInterpolate(day)}</div>`);
        });
        _push(`<!--]--></div><div class="grid grid-cols-7 gap-1"><!--[-->`);
        ssrRenderList(weekDaysData.value, (day, index) => {
          _push(`<div class="${ssrRenderClass([
            "min-h-[120px] p-2 rounded-lg border transition-all cursor-pointer",
            "bg-white border-gray-200 hover:border-primary-400",
            day.isToday ? "ring-2 ring-primary-500 ring-offset-1" : "",
            day.isSelected ? "bg-primary-50 border-primary-400" : ""
          ])}"><div class="text-center mb-2"><div class="${ssrRenderClass([
            "text-lg font-bold",
            day.isToday ? "text-primary-600" : "text-gray-700"
          ])}">${ssrInterpolate(day.day)}</div><div class="text-xs text-gray-500">${ssrInterpolate(day.month)}\u6708</div></div><div class="space-y-1.5"><!--[-->`);
          ssrRenderList(getEventsForDate(day.date), (event) => {
            _push(ssrRenderComponent(_component_CalendarEventItem, {
              key: event.id,
              event,
              onClick: ($event) => handleEventClick(event)
            }, null, _parent));
          });
          _push(`<!--]--></div></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else if (viewMode.value === "day") {
        _push(`<div class="p-4"><div class="mb-4"><h3 class="text-xl font-bold text-gray-900">${ssrInterpolate(("formatDate" in _ctx ? _ctx.formatDate : unref(formatDate))(currentDate.value, "YYYY\u5E74MM\u6708DD\u65E5"))} <span class="text-sm font-normal text-gray-500 ml-2">${ssrInterpolate(weekDayLabel.value)}</span></h3></div><div class="space-y-3">`);
        if (dayEvents.value.length === 0) {
          _push(`<div class="text-center py-16"><svg class="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-gray-500 text-lg">\u5F53\u65E5\u6682\u65E0\u4E8B\u4EF6</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(groupedDayEvents.value, (group, type) => {
          _push(`<div class="space-y-2"><h4 class="text-sm font-medium text-gray-700 flex items-center gap-2"><span class="${ssrRenderClass([typeColor(type), "w-3 h-3 rounded-full"])}"></span> ${ssrInterpolate(typeLabel(type))} <span class="text-gray-400 text-xs">(${ssrInterpolate(group.length)})</span></h4><div class="space-y-2"><!--[-->`);
          ssrRenderList(group, (event) => {
            _push(ssrRenderComponent(_component_CalendarEventItem, {
              key: event.id,
              event,
              onClick: ($event) => handleEventClick(event)
            }, null, _parent));
          });
          _push(`<!--]--></div></div>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/CalendarView.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "CalendarDetailPanel",
  __ssrInlineRender: true,
  props: {
    visible: { type: Boolean },
    date: {},
    events: {}
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const dataStore = useDataStore();
    const selectedEvent = ref(null);
    const weekDayLabel = computed(() => {
      const days = ["\u5468\u65E5", "\u5468\u4E00", "\u5468\u4E8C", "\u5468\u4E09", "\u5468\u56DB", "\u5468\u4E94", "\u5468\u516D"];
      const dayIndex = new Date(props.date).getDay();
      return days[dayIndex];
    });
    const filteredEvents = computed(() => {
      return props.events.filter((e) => e.date === props.date);
    });
    const groupedEvents = computed(() => {
      const groups = {};
      filteredEvents.value.forEach((event) => {
        if (!groups[event.type]) {
          groups[event.type] = [];
        }
        groups[event.type].push(event);
      });
      return groups;
    });
    const projectName = computed(() => {
      if (!selectedEvent.value) return null;
      const project = dataStore.getProjectById(selectedEvent.value.projectId);
      return project == null ? void 0 : project.name;
    });
    const typeLabel = (type) => {
      const labels = {
        schedule: "\u6392\u73ED",
        punch: "\u6253\u5361\u5F02\u5E38",
        inspection: "\u8D28\u68C0",
        requisition: "\u8017\u6750\u7533\u9886"
      };
      return labels[type] || type;
    };
    const typeColor = (type) => {
      const colors = {
        schedule: "bg-blue-500",
        punch: "bg-red-500",
        inspection: "bg-green-500",
        requisition: "bg-purple-500"
      };
      return colors[type] || "bg-gray-500";
    };
    const statusLabel = (type, status) => {
      var _a;
      const statusMap = {
        schedule: {
          scheduled: "\u5F85\u6267\u884C",
          in_progress: "\u8FDB\u884C\u4E2D",
          completed: "\u5DF2\u5B8C\u6210",
          cancelled: "\u5DF2\u53D6\u6D88"
        },
        punch: {
          absent: "\u7F3A\u52E4",
          late: "\u8FDF\u5230",
          early_leave: "\u65E9\u9000"
        },
        inspection: {
          excellent: "\u4F18\u79C0",
          good: "\u826F\u597D",
          pass: "\u5408\u683C",
          fail: "\u4E0D\u5408\u683C"
        },
        requisition: {
          draft: "\u8349\u7A3F",
          pending: "\u5F85\u5BA1\u6838",
          approved: "\u5DF2\u6279\u51C6",
          rejected: "\u5DF2\u62D2\u7EDD",
          delivered: "\u5DF2\u53D1\u8D27",
          completed: "\u5DF2\u5B8C\u6210"
        }
      };
      return ((_a = statusMap[type]) == null ? void 0 : _a[status]) || status;
    };
    const statusColor = (status) => {
      const colorMap = {
        completed: "bg-green-100 text-green-700",
        in_progress: "bg-blue-100 text-blue-700",
        scheduled: "bg-gray-100 text-gray-700",
        cancelled: "bg-gray-200 text-gray-600",
        absent: "bg-red-100 text-red-700",
        late: "bg-yellow-100 text-yellow-700",
        early_leave: "bg-yellow-100 text-yellow-700",
        excellent: "bg-green-100 text-green-700",
        good: "bg-green-100 text-green-700",
        pass: "bg-yellow-100 text-yellow-700",
        fail: "bg-red-100 text-red-700",
        pending: "bg-yellow-100 text-yellow-700",
        approved: "bg-green-100 text-green-700",
        rejected: "bg-red-100 text-red-700",
        delivered: "bg-blue-100 text-blue-700",
        draft: "bg-gray-100 text-gray-700"
      };
      return colorMap[status] || "bg-gray-100 text-gray-700";
    };
    const handleEventClick = (event) => {
      selectedEvent.value = event;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_CalendarEventItem = _sfc_main$3;
      _push(`<!--[-->`);
      if (__props.visible) {
        _push(`<div class="${ssrRenderClass([__props.visible ? "translate-x-0" : "translate-x-full", "fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 transform transition-transform duration-300"])}"><div class="h-full flex flex-col"><div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50"><div><h3 class="text-lg font-semibold text-gray-900">${ssrInterpolate(("formatDate" in _ctx ? _ctx.formatDate : unref(formatDate))(__props.date, "YYYY\u5E74MM\u6708DD\u65E5"))}</h3><p class="text-sm text-gray-500 mt-0.5">${ssrInterpolate(("relativeTime" in _ctx ? _ctx.relativeTime : unref(relativeTime))(__props.date))} \xB7 ${ssrInterpolate(weekDayLabel.value)}</p></div><button class="p-2 hover:bg-gray-200 rounded-lg transition-colors"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div><div class="flex-1 overflow-y-auto p-4 space-y-4">`);
        if (filteredEvents.value.length === 0) {
          _push(`<div class="text-center py-12"><svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-gray-500">\u5F53\u65E5\u6682\u65E0\u4E8B\u4EF6</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(groupedEvents.value, (group, type) => {
          _push(`<div class="space-y-2"><h4 class="text-sm font-medium text-gray-700 flex items-center gap-2"><span class="${ssrRenderClass([typeColor(type), "w-3 h-3 rounded-full"])}"></span> ${ssrInterpolate(typeLabel(type))} <span class="text-gray-400 text-xs">(${ssrInterpolate(group.length)})</span></h4><div class="space-y-2"><!--[-->`);
          ssrRenderList(group, (event) => {
            _push(ssrRenderComponent(_component_CalendarEventItem, {
              key: event.id,
              event,
              onClick: handleEventClick
            }, null, _parent));
          });
          _push(`<!--]--></div></div>`);
        });
        _push(`<!--]--></div>`);
        if (selectedEvent.value) {
          _push(`<div class="border-t border-gray-200 p-4 bg-gray-50"><div class="flex items-center justify-between mb-3"><h4 class="font-medium text-gray-900">\u4E8B\u4EF6\u8BE6\u60C5</h4><button class="text-sm text-primary-600 hover:text-primary-700"> \u6536\u8D77 </button></div><div class="space-y-2 text-sm"><div class="flex items-center gap-2"><span class="text-gray-500 w-16">\u7C7B\u578B:</span><span class="font-medium">${ssrInterpolate(typeLabel(selectedEvent.value.type))}</span></div><div class="flex items-center gap-2"><span class="text-gray-500 w-16">\u6807\u9898:</span><span class="text-gray-900">${ssrInterpolate(selectedEvent.value.title)}</span></div><div class="flex items-center gap-2"><span class="text-gray-500 w-16">\u63CF\u8FF0:</span><span class="text-gray-700">${ssrInterpolate(selectedEvent.value.description)}</span></div><div class="flex items-center gap-2"><span class="text-gray-500 w-16">\u72B6\u6001:</span><span class="${ssrRenderClass([statusColor(selectedEvent.value.status), "px-2 py-0.5 rounded text-xs font-medium"])}">${ssrInterpolate(statusLabel(selectedEvent.value.type, selectedEvent.value.status))}</span></div>`);
          if (projectName.value) {
            _push(`<div class="flex items-center gap-2"><span class="text-gray-500 w-16">\u9879\u76EE:</span><span class="text-gray-700">${ssrInterpolate(projectName.value)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.visible) {
        _push(`<div class="fixed inset-0 bg-black/30 z-40"></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/CalendarDetailPanel.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "calendar",
  __ssrInlineRender: true,
  setup(__props) {
    const dataStore = useDataStore();
    const filterStore = useFilterStore();
    const selectedProject = ref("");
    const selectedTypes = ref(["schedule", "punch", "inspection", "requisition"]);
    const detailPanelVisible = ref(false);
    const eventTypes = [
      { value: "schedule", label: "\u6392\u73ED", dotClass: "bg-blue-500", bgClass: "bg-blue-50", textClass: "text-blue-700", borderClass: "border-blue-300" },
      { value: "punch", label: "\u6253\u5361\u5F02\u5E38", dotClass: "bg-red-500", bgClass: "bg-red-50", textClass: "text-red-700", borderClass: "border-red-300" },
      { value: "inspection", label: "\u8D28\u68C0", dotClass: "bg-green-500", bgClass: "bg-green-50", textClass: "text-green-700", borderClass: "border-green-300" },
      { value: "requisition", label: "\u8017\u6750\u7533\u9886", dotClass: "bg-purple-500", bgClass: "bg-purple-50", textClass: "text-purple-700", borderClass: "border-purple-300" }
    ];
    const projects = computed(() => dataStore.projects);
    const currentDate = computed(() => filterStore.calendar.currentDate);
    const selectedDate = computed(() => filterStore.calendar.selectedDate);
    const dateRange = computed(() => {
      const viewMode = filterStore.calendar.viewMode;
      const current = new Date(filterStore.calendar.currentDate);
      if (viewMode === "month") {
        const year = current.getFullYear();
        const month = current.getMonth();
        return {
          start: startOfMonth(year, month + 1),
          end: endOfMonth(year, month + 1)
        };
      } else if (viewMode === "week") {
        const dayOfWeek = current.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(current);
        monday.setDate(current.getDate() + mondayOffset);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return {
          start: formatDate(monday),
          end: formatDate(sunday)
        };
      } else {
        return {
          start: filterStore.calendar.currentDate,
          end: filterStore.calendar.currentDate
        };
      }
    });
    const allEvents = computed(() => {
      return dataStore.getCalendarEvents(dateRange.value.start, dateRange.value.end);
    });
    const filteredEvents = computed(() => {
      return allEvents.value.filter((event) => {
        if (selectedProject.value && event.projectId !== selectedProject.value) {
          return false;
        }
        if (selectedTypes.value.length > 0 && !selectedTypes.value.includes(event.type)) {
          return false;
        }
        return true;
      });
    });
    const eventCounts = computed(() => {
      const counts = {
        schedule: 0,
        punch: 0,
        inspection: 0,
        requisition: 0
      };
      filteredEvents.value.forEach((event) => {
        if (counts.hasOwnProperty(event.type)) {
          counts[event.type]++;
        }
      });
      return counts;
    });
    const hasActiveFilters = computed(() => {
      return selectedProject.value !== "" || selectedTypes.value.length !== 4;
    });
    const handleDateSelect = (date) => {
      detailPanelVisible.value = true;
    };
    const handleEventClick = (event) => {
      filterStore.setSelectedDate(event.date);
      detailPanelVisible.value = true;
    };
    watch(selectedDate, (newDate) => {
      if (newDate) {
        detailPanelVisible.value = true;
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_CalendarView = _sfc_main$2;
      const _component_CalendarDetailPanel = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-50" }, _attrs))}><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><div class="mb-6"><h1 class="text-2xl font-bold text-gray-900">\u65E5\u5386\u89C6\u56FE</h1><p class="text-gray-500 mt-1">\u67E5\u770B\u6392\u73ED\u3001\u6253\u5361\u3001\u8D28\u68C0\u548C\u8017\u6750\u7533\u9886\u7684\u65E5\u5386\u6982\u89C8</p></div><div class="mb-4 flex flex-wrap items-center gap-4"><div class="flex items-center gap-2"><label class="text-sm font-medium text-gray-700">\u9879\u76EE\u7B5B\u9009:</label><select class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"><option value=""${ssrIncludeBooleanAttr(Array.isArray(selectedProject.value) ? ssrLooseContain(selectedProject.value, "") : ssrLooseEqual(selectedProject.value, "")) ? " selected" : ""}>\u5168\u90E8\u9879\u76EE</option><!--[-->`);
      ssrRenderList(projects.value, (project) => {
        _push(`<option${ssrRenderAttr("value", project.id)}${ssrIncludeBooleanAttr(Array.isArray(selectedProject.value) ? ssrLooseContain(selectedProject.value, project.id) : ssrLooseEqual(selectedProject.value, project.id)) ? " selected" : ""}>${ssrInterpolate(project.name)}</option>`);
      });
      _push(`<!--]--></select></div><div class="flex items-center gap-2"><label class="text-sm font-medium text-gray-700">\u4E8B\u4EF6\u7C7B\u578B:</label><div class="flex flex-wrap gap-2"><!--[-->`);
      ssrRenderList(eventTypes, (type) => {
        _push(`<button class="${ssrRenderClass([
          "px-3 py-1.5 text-sm rounded-lg border transition-colors",
          selectedTypes.value.includes(type.value) ? `${type.bgClass} ${type.textClass} ${type.borderClass}` : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
        ])}"><span class="flex items-center gap-1.5"><span class="${ssrRenderClass([type.dotClass, "w-2 h-2 rounded-full"])}"></span> ${ssrInterpolate(type.label)}</span></button>`);
      });
      _push(`<!--]--></div></div>`);
      if (hasActiveFilters.value) {
        _push(`<button class="ml-auto px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"> \u6E05\u9664\u7B5B\u9009 </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="flex items-center gap-4 mb-4 text-sm text-gray-500"><div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500"></span><span>\u6392\u73ED (${ssrInterpolate(eventCounts.value.schedule)})</span></div><div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-red-500"></span><span>\u6253\u5361\u5F02\u5E38 (${ssrInterpolate(eventCounts.value.punch)})</span></div><div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500"></span><span>\u8D28\u68C0 (${ssrInterpolate(eventCounts.value.inspection)})</span></div><div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-purple-500"></span><span>\u8017\u6750\u7533\u9886 (${ssrInterpolate(eventCounts.value.requisition)})</span></div></div>`);
      _push(ssrRenderComponent(_component_CalendarView, {
        events: filteredEvents.value,
        onDateSelect: handleDateSelect,
        onEventClick: handleEventClick
      }, null, _parent));
      _push(ssrRenderComponent(_component_CalendarDetailPanel, {
        visible: detailPanelVisible.value,
        date: selectedDate.value || currentDate.value,
        events: filteredEvents.value,
        onClose: ($event) => detailPanelVisible.value = false
      }, null, _parent));
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/calendar.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=calendar-Sbhugsdc.mjs.map
