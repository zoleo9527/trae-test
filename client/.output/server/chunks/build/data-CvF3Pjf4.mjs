import { d as defineStore } from './server.mjs';
import dayjs from 'dayjs';

const mockUsers = [
  {
    id: "user-1",
    name: "\u5F20\u660E",
    role: "project_manager",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=zm",
    phone: "13800138001"
  },
  {
    id: "user-2",
    name: "\u674E\u534E",
    role: "scheduling_specialist",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lh",
    phone: "13800138002"
  },
  {
    id: "user-3",
    name: "\u738B\u82B3",
    role: "quality_inspector",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=wf",
    phone: "13800138003"
  }
];
const mockProjects = [
  {
    id: "proj-1",
    name: "\u56FD\u8D38\u4E2D\u5FC3\u5199\u5B57\u697C",
    address: "\u5317\u4EAC\u5E02\u671D\u9633\u533A\u5EFA\u56FD\u95E8\u5916\u5927\u88571\u53F7",
    clientName: "\u56FD\u8D38\u7269\u4E1A",
    clientPhone: "13900139001",
    contractStartDate: "2025-01-01",
    contractEndDate: "2026-12-31",
    status: "active",
    weeklyCleaningDays: 7,
    assignedStaff: ["staff-1", "staff-2", "staff-3"],
    note: "\u7532\u7EA7\u5199\u5B57\u697C\uFF0C\u6BCF\u65E5\u6E05\u6D01\u8981\u6C42\u9AD8"
  },
  {
    id: "proj-2",
    name: "\u4E07\u8FBE\u5E7F\u573A\u8D2D\u7269\u4E2D\u5FC3",
    address: "\u5317\u4EAC\u5E02\u671D\u9633\u533A\u5EFA\u56FD\u8DEF88\u53F7",
    clientName: "\u4E07\u8FBE\u5546\u4E1A",
    clientPhone: "13900139002",
    contractStartDate: "2025-03-15",
    contractEndDate: "2026-06-30",
    status: "expiring",
    weeklyCleaningDays: 7,
    assignedStaff: ["staff-4", "staff-5", "staff-6"],
    note: "\u5927\u578B\u8D2D\u7269\u4E2D\u5FC3\uFF0C\u4EBA\u6D41\u91CF\u5927"
  },
  {
    id: "proj-3",
    name: "\u4E2D\u5173\u6751\u79D1\u6280\u56ED\u529E\u516C\u697C",
    address: "\u5317\u4EAC\u5E02\u6D77\u6DC0\u533A\u4E2D\u5173\u6751\u5927\u88571\u53F7",
    clientName: "\u79D1\u6280\u56ED\u7BA1\u7406\u516C\u53F8",
    clientPhone: "13900139003",
    contractStartDate: "2025-02-01",
    contractEndDate: "2026-05-15",
    status: "expiring",
    weeklyCleaningDays: 5,
    assignedStaff: ["staff-7", "staff-8"],
    note: "\u79D1\u6280\u56ED\u533A\uFF0C\u5DE5\u4F5C\u65E5\u6E05\u6D01"
  },
  {
    id: "proj-4",
    name: "\u4EA6\u5E84\u5DE5\u4E1A\u56ED\u533A",
    address: "\u5317\u4EAC\u5E02\u5927\u5174\u533A\u4EA6\u5E84\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    clientName: "\u4EA6\u5E84\u5DE5\u4E1A\u56ED",
    clientPhone: "13900139004",
    contractStartDate: "2024-06-01",
    contractEndDate: "2026-12-31",
    status: "active",
    weeklyCleaningDays: 6,
    assignedStaff: ["staff-9", "staff-10"],
    note: "\u5DE5\u4E1A\u56ED\u533A\uFF0C\u6709\u7279\u6B8A\u6E05\u6D01\u8981\u6C42"
  }
];
const mockStaff = [
  { id: "staff-1", name: "\u8D75\u5927\u59D0", phone: "13700137001", position: "cleaner", hireDate: "2023-05-15", status: "active", projects: ["proj-1"] },
  { id: "staff-2", name: "\u94B1\u963F\u59E8", phone: "13700137002", position: "cleaner", hireDate: "2023-06-20", status: "active", projects: ["proj-1"] },
  { id: "staff-3", name: "\u5B59\u54E5", phone: "13700137003", position: "supervisor", hireDate: "2022-03-10", status: "active", projects: ["proj-1"] },
  { id: "staff-4", name: "\u674E\u59D0", phone: "13700137004", position: "cleaner", hireDate: "2024-01-15", status: "active", projects: ["proj-2"] },
  { id: "staff-5", name: "\u5468\u963F\u59E8", phone: "13700137005", position: "cleaner", hireDate: "2024-02-20", status: "active", projects: ["proj-2"] },
  { id: "staff-6", name: "\u5434\u5E08\u5085", phone: "13700137006", position: "supervisor", hireDate: "2023-08-05", status: "active", projects: ["proj-2"] },
  { id: "staff-7", name: "\u90D1\u59D0", phone: "13700137007", position: "cleaner", hireDate: "2023-11-10", status: "active", projects: ["proj-3"] },
  { id: "staff-8", name: "\u738B\u54E5", phone: "13700137008", position: "supervisor", hireDate: "2022-12-01", status: "active", projects: ["proj-3"] },
  { id: "staff-9", name: "\u51AF\u59D0", phone: "13700137009", position: "cleaner", hireDate: "2024-03-15", status: "active", projects: ["proj-4"] },
  { id: "staff-10", name: "\u9648\u54E5", phone: "13700137010", position: "supervisor", hireDate: "2023-04-20", status: "active", projects: ["proj-4"] }
];
const generateMockSchedules = () => {
  const schedules = [];
  const today = /* @__PURE__ */ new Date();
  for (let i = -7; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      mockProjects.forEach((project, pIdx) => {
        const staffCount = Math.min(project.assignedStaff.length, 3);
        for (let s = 0; s < staffCount; s++) {
          const staffId = project.assignedStaff[s];
          const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;
          const startTime = isWeekend ? "09:00" : "08:00";
          const endTime = isWeekend ? "17:00" : "16:00";
          let status = "scheduled";
          if (i < 0) {
            status = Math.random() > 0.05 ? "completed" : "cancelled";
          } else if (i === 0) {
            status = "in_progress";
          }
          schedules.push({
            id: `sched-${dateStr}-${project.id}-${s}`,
            projectId: project.id,
            staffId,
            date: dateStr,
            startTime,
            endTime,
            taskType: i % 3 === 0 ? "deep" : "daily",
            status,
            note: ""
          });
        }
      });
    }
  }
  schedules[3].status = "cancelled";
  schedules[3].note = "\u5458\u5DE5\u8BF7\u5047\uFF0C\u5DF2\u5B89\u6392\u66FF\u73ED";
  return schedules;
};
const mockSchedules = generateMockSchedules();
const generateMockPunchRecords = () => {
  const records = [];
  mockSchedules.forEach((schedule) => {
    if (schedule.status === "scheduled") return;
    const isAbsent = schedule.id.endsWith("-proj-2-0") && schedule.date.endsWith("-28");
    let checkInTime = null;
    let checkOutTime = null;
    let status = "pending";
    if (schedule.status === "completed") {
      const baseHour = parseInt(schedule.startTime.split(":")[0]);
      const checkInHour = baseHour + Math.floor(Math.random() * 2);
      const checkInMin = Math.floor(Math.random() * 30);
      checkInTime = `${checkInHour.toString().padStart(2, "0")}:${checkInMin.toString().padStart(2, "0")}`;
      const endHour = parseInt(schedule.endTime.split(":")[0]);
      const checkOutHour = endHour + Math.floor(Math.random() * 2);
      const checkOutMin = Math.floor(Math.random() * 30);
      checkOutTime = `${checkOutHour.toString().padStart(2, "0")}:${checkOutMin.toString().padStart(2, "0")}`;
      if (isAbsent) {
        checkInTime = null;
        checkOutTime = null;
        status = "absent";
      } else if (checkInHour > baseHour) {
        status = "late";
      } else if (checkOutHour < endHour) {
        status = "early_leave";
      } else {
        status = "normal";
      }
    } else if (schedule.status === "in_progress") {
      checkInTime = schedule.startTime;
      status = "pending";
    }
    records.push({
      id: `punch-${schedule.id}`,
      scheduleId: schedule.id,
      projectId: schedule.projectId,
      staffId: schedule.staffId,
      date: schedule.date,
      checkInTime,
      checkOutTime,
      checkInPhoto: checkInTime ? `https://picsum.photos/200/300?random=${schedule.id}` : null,
      checkOutPhoto: checkOutTime ? `https://picsum.photos/200/300?random=${schedule.id}-out` : null,
      status,
      locationVerified: !isAbsent,
      note: status === "absent" ? "\u672A\u6253\u5361\uFF0C\u9700\u6838\u5B9E" : ""
    });
  });
  const missingPunch = records.find((r) => r.status === "absent");
  if (missingPunch) {
    missingPunch.note = "\u5458\u5DE5\u65E0\u6545\u7F3A\u52E4\uFF0C\u5DF2\u901A\u77E5\u4E3B\u7BA1";
  }
  return records;
};
const mockPunchRecords = generateMockPunchRecords();
const mockSupplies = [
  { id: "supply-1", name: "\u5168\u80FD\u6E05\u6D01\u5242", category: "detergent", unit: "\u74F6", currentStock: 45, safeStock: 30, warningStock: 10, lastRestockDate: "2026-05-20", lastRestockQuantity: 50, unitPrice: 28.5, supplier: "\u6E05\u6D01\u7528\u54C1\u6279\u53D1", note: "\u65E5\u5E38\u6E05\u6D01\u5FC5\u5907" },
  { id: "supply-2", name: "\u73BB\u7483\u6E05\u6D01\u5242", category: "detergent", unit: "\u74F6", currentStock: 12, safeStock: 20, warningStock: 5, lastRestockDate: "2026-05-15", lastRestockQuantity: 30, unitPrice: 35, supplier: "\u6E05\u6D01\u7528\u54C1\u6279\u53D1", note: "" },
  { id: "supply-3", name: "\u5730\u677F\u8721\u6C34", category: "detergent", unit: "\u6876", currentStock: 8, safeStock: 15, warningStock: 3, lastRestockDate: "2026-05-10", lastRestockQuantity: 20, unitPrice: 120, supplier: "\u6E05\u6D01\u7528\u54C1\u6279\u53D1", note: "" },
  { id: "supply-4", name: "\u62D6\u628A", category: "tool", unit: "\u628A", currentStock: 25, safeStock: 20, warningStock: 5, lastRestockDate: "2026-05-25", lastRestockQuantity: 30, unitPrice: 45, supplier: "\u6E05\u6D01\u5DE5\u5177\u4E13\u8425", note: "" },
  { id: "supply-5", name: "\u6E05\u6D01\u5E03", category: "tool", unit: "\u5757", currentStock: 3, safeStock: 50, warningStock: 10, lastRestockDate: "2026-04-28", lastRestockQuantity: 100, unitPrice: 8.5, supplier: "\u6E05\u6D01\u5DE5\u5177\u4E13\u8425", note: "\u5E93\u5B58\u4E25\u91CD\u4E0D\u8DB3" },
  { id: "supply-6", name: "\u5783\u573E\u888B\uFF08\u5927)", category: "disposable", unit: "\u5377", currentStock: 150, safeStock: 100, warningStock: 20, lastRestockDate: "2026-05-22", lastRestockQuantity: 200, unitPrice: 15, supplier: "\u4E00\u6B21\u6027\u7528\u54C1\u6279\u53D1", note: "" },
  { id: "supply-7", name: "\u536B\u751F\u7EB8", category: "disposable", unit: "\u63D0", currentStock: 20, safeStock: 50, warningStock: 10, lastRestockDate: "2026-05-18", lastRestockQuantity: 60, unitPrice: 25, supplier: "\u4E00\u6B21\u6027\u7528\u54C1\u6279\u53D1", note: "" },
  { id: "supply-8", name: "\u6D17\u624B\u6DB2", category: "disposable", unit: "\u74F6", currentStock: 8, safeStock: 30, warningStock: 5, lastRestockDate: "2026-05-05", lastRestockQuantity: 40, unitPrice: 18, supplier: "\u4E00\u6B21\u6027\u7528\u54C1\u6279\u53D1", note: "" },
  { id: "supply-9", name: "\u4E00\u6B21\u6027\u624B\u5957", category: "protective", unit: "\u76D2", currentStock: 5, safeStock: 20, warningStock: 5, lastRestockDate: "2026-04-30", lastRestockQuantity: 30, unitPrice: 12, supplier: "\u9632\u62A4\u7528\u54C1\u4E13\u8425", note: "" },
  { id: "supply-10", name: "\u53E3\u7F69", category: "protective", unit: "\u76D2", currentStock: 2, safeStock: 30, warningStock: 10, lastRestockDate: "2026-04-20", lastRestockQuantity: 50, unitPrice: 20, supplier: "\u9632\u62A4\u7528\u54C1\u4E13\u8425", note: "\u5E93\u5B58\u9884\u8B66" }
];
const mockRequisitions = [
  {
    id: "req-1",
    projectId: "proj-1",
    applicantId: "staff-3",
    applicationDate: "2026-05-20",
    items: [
      { supplyId: "supply-1", supplyName: "\u5168\u80FD\u6E05\u6D01\u5242", quantity: 20, deliveredQuantity: 20, unitPrice: 28.5 }
    ],
    status: "completed",
    approverId: "user-1",
    approvalDate: "2026-05-21",
    deliveryDate: "2026-05-22",
    rejectReason: null,
    note: "\u6708\u5EA6\u5E38\u89C4\u8865\u8D27"
  },
  {
    id: "req-2",
    projectId: "proj-2",
    applicantId: "staff-6",
    applicationDate: "2026-05-25",
    items: [
      { supplyId: "supply-2", supplyName: "\u73BB\u7483\u6E05\u6D01\u5242", quantity: 15, deliveredQuantity: 15, unitPrice: 35 },
      { supplyId: "supply-6", supplyName: "\u5783\u573E\u888B", quantity: 50, deliveredQuantity: 50, unitPrice: 15 }
    ],
    status: "delivered",
    approverId: "user-1",
    approvalDate: "2026-05-26",
    deliveryDate: "2026-05-27",
    rejectReason: null,
    note: "\u8D2D\u7269\u4E2D\u5FC3\u5BA2\u6D41\u91CF\u5927\uFF0C\u6D88\u8017\u5FEB"
  },
  {
    id: "req-3",
    projectId: "proj-3",
    applicantId: "staff-8",
    applicationDate: "2026-05-28",
    items: [
      { supplyId: "supply-5", supplyName: "\u6E05\u6D01\u5E03", quantity: 30, deliveredQuantity: null, unitPrice: null },
      { supplyId: "supply-10", supplyName: "\u53E3\u7F69", quantity: 20, deliveredQuantity: null, unitPrice: null }
    ],
    status: "pending",
    approverId: null,
    approvalDate: null,
    deliveryDate: null,
    rejectReason: null,
    note: "\u7D27\u6025\u8865\u8D27\uFF0C\u5E93\u5B58\u4E0D\u8DB3"
  },
  {
    id: "req-4",
    projectId: "proj-4",
    applicantId: "staff-10",
    applicationDate: "2026-05-27",
    items: [
      { supplyId: "supply-3", supplyName: "\u5730\u677F\u8721\u6C34", quantity: 10, deliveredQuantity: null, unitPrice: null },
      { supplyId: "supply-7", supplyName: "\u536B\u751F\u7EB8", quantity: 30, deliveredQuantity: null, unitPrice: null }
    ],
    status: "approved",
    approverId: "user-1",
    approvalDate: "2026-05-28",
    deliveryDate: null,
    rejectReason: null,
    note: "\u6708\u5EA6\u6E05\u6D01\u8BA1\u5212"
  },
  {
    id: "req-5",
    projectId: "proj-1",
    applicantId: "staff-3",
    applicationDate: "2026-05-26",
    items: [
      { supplyId: "supply-9", supplyName: "\u4E00\u6B21\u6027\u624B\u5957", quantity: 15, deliveredQuantity: null, unitPrice: null }
    ],
    status: "rejected",
    approverId: "user-1",
    approvalDate: "2026-05-26",
    deliveryDate: null,
    rejectReason: "\u5E93\u5B58\u8FD8\u6709\uFF0C\u4E0B\u6708\u518D\u7533\u8BF7",
    note: ""
  }
];
const mockInspections = [
  {
    id: "inspect-1",
    projectId: "proj-1",
    inspectorId: "user-3",
    date: "2026-05-20",
    score: 92,
    items: [
      { name: "\u5927\u5802\u6E05\u6D01", score: 18, maxScore: 20, passed: true, note: "\u6574\u4F53\u826F\u597D" },
      { name: "\u536B\u751F\u95F4\u6E05\u6D01", score: 19, maxScore: 20, passed: true, note: "\u65E0\u5F02\u5473" },
      { name: "\u7535\u68AF\u6E05\u6D01", score: 17, maxScore: 20, passed: true, note: "\u73BB\u7483\u6709\u8F7B\u5FAE\u6C34\u8FF9" },
      { name: "\u5783\u573E\u6E05\u8FD0", score: 20, maxScore: 20, passed: true, note: "" },
      { name: "\u6D88\u6BD2\u5DE5\u4F5C", score: 18, maxScore: 20, passed: true, note: "" }
    ],
    overallStatus: "excellent",
    photos: ["https://picsum.photos/400/300?random=ins1"],
    rectificationRequired: false,
    rectificationDeadline: null,
    rectificationStatus: "none",
    note: "\u6574\u4F53\u4F18\u79C0\uFF0C\u7EE7\u7EED\u4FDD\u6301"
  },
  {
    id: "inspect-2",
    projectId: "proj-2",
    inspectorId: "user-3",
    date: "2026-05-22",
    score: 75,
    items: [
      { name: "\u516C\u5171\u533A\u57DF\u6E05\u6D01", score: 15, maxScore: 20, passed: true, note: "\u5730\u9762\u6709\u6C61\u6E0D" },
      { name: "\u536B\u751F\u95F4\u6E05\u6D01", score: 12, maxScore: 20, passed: false, note: "\u6709\u5F02\u5473\uFF0C\u5730\u9762\u6E7F\u6ED1" },
      { name: "\u7535\u68AF\u6E05\u6D01", score: 16, maxScore: 20, passed: true, note: "" },
      { name: "\u5783\u573E\u6E05\u8FD0", score: 16, maxScore: 20, passed: true, note: "" },
      { name: "\u6D88\u6BD2\u5DE5\u4F5C", score: 16, maxScore: 20, passed: true, note: "" }
    ],
    overallStatus: "pass",
    photos: ["https://picsum.photos/400/300?random=ins2"],
    rectificationRequired: true,
    rectificationDeadline: "2026-05-25",
    rectificationStatus: "completed",
    note: "\u536B\u751F\u95F4\u9700\u8981\u91CD\u70B9\u6574\u6539"
  },
  {
    id: "inspect-3",
    projectId: "proj-3",
    inspectorId: "user-3",
    date: "2026-05-25",
    score: 68,
    items: [
      { name: "\u529E\u516C\u5BA4\u6E05\u6D01", score: 14, maxScore: 20, passed: true, note: "\u684C\u9762\u6709\u7070\u5C18" },
      { name: "\u4F1A\u8BAE\u5BA4\u6E05\u6D01", score: 10, maxScore: 20, passed: false, note: "\u73BB\u7483\u4E0D\u5E72\u51C0" },
      { name: "\u516C\u5171\u533A\u57DF", score: 15, maxScore: 20, passed: true, note: "" },
      { name: "\u536B\u751F\u95F4\u6E05\u6D01", score: 14, maxScore: 20, passed: true, note: "" },
      { name: "\u6D88\u6BD2\u5DE5\u4F5C", score: 15, maxScore: 20, passed: true, note: "" }
    ],
    overallStatus: "fail",
    photos: ["https://picsum.photos/400/300?random=ins3"],
    rectificationRequired: true,
    rectificationDeadline: "2026-05-30",
    rectificationStatus: "overdue",
    note: "\u4F1A\u8BAE\u5BA4\u73BB\u7483\u6E05\u6D01\u4E0D\u5230\u4F4D\uFF0C\u9700\u7ACB\u5373\u6574\u6539"
  },
  {
    id: "inspect-4",
    projectId: "proj-4",
    inspectorId: "user-3",
    date: "2026-05-28",
    score: 85,
    items: [
      { name: "\u751F\u4EA7\u8F66\u95F4\u6E05\u6D01", score: 17, maxScore: 20, passed: true, note: "" },
      { name: "\u529E\u516C\u533A\u6E05\u6D01", score: 18, maxScore: 20, passed: true, note: "" },
      { name: "\u4ED3\u5E93\u6E05\u6D01", score: 16, maxScore: 20, passed: true, note: "" },
      { name: "\u536B\u751F\u95F4\u6E05\u6D01", score: 17, maxScore: 20, passed: true, note: "" },
      { name: "\u6D88\u6BD2\u5DE5\u4F5C", score: 17, maxScore: 20, passed: true, note: "" }
    ],
    overallStatus: "good",
    photos: ["https://picsum.photos/400/300?random=ins4"],
    rectificationRequired: false,
    rectificationDeadline: null,
    rectificationStatus: "none",
    note: "\u826F\u597D\uFF0C\u4FDD\u6301"
  }
];
const mockRectifications = [
  {
    id: "rect-1",
    inspectionId: "inspect-2",
    projectId: "proj-2",
    deadline: "2026-05-25",
    status: "completed",
    items: [
      { description: "\u536B\u751F\u95F4\u5F02\u5473\u5904\u7406", completed: true, completedDate: "2026-05-24", note: "\u5DF2\u5B8C\u6210" },
      { description: "\u5730\u9762\u9632\u6ED1\u5904\u7406", completed: true, completedDate: "2026-05-24", note: "\u5DF2\u94FA\u8BBE\u9632\u6ED1\u57AB" }
    ],
    assigneeId: "staff-6",
    completedDate: "2026-05-24",
    photos: ["https://picsum.photos/400/300?random=rect1"],
    note: "\u6574\u6539\u5B8C\u6210\uFF0C\u5DF2\u590D\u67E5"
  },
  {
    id: "rect-2",
    inspectionId: "inspect-3",
    projectId: "proj-3",
    deadline: "2026-05-30",
    status: "overdue",
    items: [
      { description: "\u4F1A\u8BAE\u5BA4\u73BB\u7483\u6E05\u6D01", completed: false, completedDate: null, note: "" },
      { description: "\u684C\u9762\u7070\u5C18\u6E05\u6D01", completed: true, completedDate: "2026-05-29", note: "\u5DF2\u5B8C\u6210" }
    ],
    assigneeId: "staff-8",
    completedDate: null,
    photos: [],
    note: "\u73BB\u7483\u6E05\u6D01\u5C1A\u672A\u5B8C\u6210"
  }
];
const generateMockAlerts = () => {
  var _a, _b;
  const alerts = [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const missingPunch = mockPunchRecords.find((p) => p.status === "absent");
  if (missingPunch) {
    alerts.push({
      id: "alert-1",
      type: "missing_punch",
      severity: "critical",
      status: "open",
      title: "\u5458\u5DE5\u7F3A\u52E4\u672A\u6253\u5361",
      description: `\u5458\u5DE5 ${(_a = mockStaff.find((s) => s.id === missingPunch.staffId)) == null ? void 0 : _a.name} \u5728 ${missingPunch.date} \u672A\u6253\u5361\uFF0C\u9700\u7ACB\u5373\u6838\u5B9E\u5904\u7406`,
      relatedId: missingPunch.id,
      relatedType: "punch",
      projectId: missingPunch.projectId,
      assigneeId: "user-1",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolutionNote: null,
      history: [{
        status: "open",
        note: "\u7CFB\u7EDF\u81EA\u52A8\u68C0\u6D4B",
        operatorId: "system",
        timestamp: now
      }]
    });
  }
  const lowStockSupplies = mockSupplies.filter((s) => s.currentStock <= s.warningStock);
  lowStockSupplies.forEach((supply, idx) => {
    alerts.push({
      id: `alert-stock-${idx}`,
      type: "low_stock",
      severity: supply.currentStock <= 2 ? "critical" : "warning",
      status: "open",
      title: "\u5E93\u5B58\u9884\u8B66",
      description: `${supply.name} \u5E93\u5B58\u4EC5\u5269 ${supply.currentStock}${supply.unit}\uFF0C\u4F4E\u4E8E\u8B66\u6212\u7EBF ${supply.warningStock}${supply.unit}`,
      relatedId: supply.id,
      relatedType: "supply",
      projectId: null,
      assigneeId: "user-1",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolutionNote: null,
      history: [{
        status: "open",
        note: "\u5E93\u5B58\u9884\u8B66\u81EA\u52A8\u89E6\u53D1",
        operatorId: "system",
        timestamp: now
      }]
    });
  });
  const pendingRect = mockRectifications.filter((r) => r.status === "overdue");
  pendingRect.forEach((rect, idx) => {
    var _a2;
    alerts.push({
      id: `alert-rect-${idx}`,
      type: "rectification",
      severity: "critical",
      status: "open",
      title: "\u6574\u6539\u903E\u671F\u672A\u5B8C\u6210",
      description: `\u9879\u76EE ${(_a2 = mockProjects.find((p) => p.id === rect.projectId)) == null ? void 0 : _a2.name} \u7684\u6574\u6539\u4EFB\u52A1\u5DF2\u903E\u671F\uFF0C\u8BF7\u7ACB\u5373\u5904\u7406`,
      relatedId: rect.id,
      relatedType: "rectification",
      projectId: rect.projectId,
      assigneeId: "user-1",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolutionNote: null,
      history: [{
        status: "open",
        note: "\u6574\u6539\u903E\u671F\u81EA\u52A8\u63D0\u9192",
        operatorId: "system",
        timestamp: now
      }]
    });
  });
  const expiringProjects = mockProjects.filter((p) => p.status === "expiring");
  expiringProjects.forEach((project, idx) => {
    const daysLeft = Math.ceil((new Date(project.contractEndDate).getTime() - Date.now()) / (1e3 * 60 * 60 * 24));
    alerts.push({
      id: `alert-contract-${idx}`,
      type: "contract_expiry",
      severity: daysLeft <= 15 ? "warning" : "info",
      status: "open",
      title: "\u5408\u540C\u5373\u5C06\u5230\u671F",
      description: `\u9879\u76EE ${project.name} \u7684\u5408\u540C\u5C06\u4E8E ${project.contractEndDate} \u5230\u671F\uFF0C\u8BF7\u53CA\u65F6\u7EED\u7EA6`,
      relatedId: project.id,
      relatedType: "project",
      projectId: project.id,
      assigneeId: "user-1",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolutionNote: null,
      history: [{
        status: "open",
        note: "\u5408\u540C\u5230\u671F\u63D0\u9192",
        operatorId: "system",
        timestamp: now
      }]
    });
  });
  const pendingReq = mockRequisitions.find((r) => r.status === "pending");
  if (pendingReq) {
    alerts.push({
      id: "alert-req-1",
      type: "overdue_task",
      severity: "warning",
      status: "open",
      title: "\u7533\u9886\u5355\u5F85\u5BA1\u6838",
      description: `\u9879\u76EE ${(_b = mockProjects.find((p) => p.id === pendingReq.projectId)) == null ? void 0 : _b.name} \u6709\u65B0\u7684\u8017\u6750\u7533\u9886\u5355\u5F85\u5BA1\u6838`,
      relatedId: pendingReq.id,
      relatedType: "requisition",
      projectId: pendingReq.projectId,
      assigneeId: "user-1",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolutionNote: null,
      history: [{
        status: "open",
        note: "\u5F85\u529E\u4EFB\u52A1\u63D0\u9192",
        operatorId: "system",
        timestamp: now
      }]
    });
  }
  return alerts;
};
const mockAlerts = generateMockAlerts();
dayjs.locale("zh-cn");
const formatDate = (date, format = "YYYY-MM-DD") => {
  return dayjs(date).format(format);
};
const formatDateTime = (date, format = "YYYY-MM-DD HH:mm") => {
  return dayjs(date).format(format);
};
const isToday = (date) => {
  return dayjs(date).isSame(dayjs(), "day");
};
const isPast = (date) => {
  return dayjs(date).isBefore(dayjs(), "day");
};
const daysBetween = (date1, date2) => {
  return Math.abs(dayjs(date1).diff(dayjs(date2), "day"));
};
const getDaysInMonth = (year, month) => {
  return dayjs(`${year}-${month}-01`).daysInMonth();
};
const getFirstDayOfMonth = (year, month) => {
  return dayjs(`${year}-${month}-01`).day();
};
const addDays = (date, days) => {
  return dayjs(date).add(days, "day").format("YYYY-MM-DD");
};
const startOfMonth = (year, month) => {
  return dayjs(`${year}-${month}-01`).startOf("month").format("YYYY-MM-DD");
};
const endOfMonth = (year, month) => {
  return dayjs(`${year}-${month}-01`).endOf("month").format("YYYY-MM-DD");
};
const relativeTime = (date) => {
  const now = dayjs();
  const target = dayjs(date);
  const diff = target.diff(now, "day");
  if (diff === 0) return "\u4ECA\u5929";
  if (diff === 1) return "\u660E\u5929";
  if (diff === -1) return "\u6628\u5929";
  if (diff > 1 && diff < 7) return `${diff}\u5929\u540E`;
  if (diff < -1 && diff > -7) return `${Math.abs(diff)}\u5929\u524D`;
  return formatDate(date);
};
const generateDateRange = (start, end) => {
  const dates = [];
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  let current = startDate;
  while (current.isBefore(endDate) || current.isSame(endDate, "day")) {
    dates.push(current.format("YYYY-MM-DD"));
    current = current.add(1, "day");
  }
  return dates;
};
const useDataStore = defineStore("data", {
  state: () => ({
    projects: mockProjects,
    staff: mockStaff,
    schedules: mockSchedules,
    punchRecords: mockPunchRecords,
    inspections: mockInspections,
    supplies: mockSupplies,
    requisitions: mockRequisitions,
    alerts: mockAlerts,
    rectifications: mockRectifications,
    loading: false
  }),
  getters: {
    getProjectById: (state) => (id) => {
      return state.projects.find((p) => p.id === id);
    },
    getStaffById: (state) => (id) => {
      return state.staff.find((s) => s.id === id);
    },
    getSchedulesByDate: (state) => (date) => {
      return state.schedules.filter((s) => s.date === date);
    },
    getSchedulesByProject: (state) => (projectId) => {
      return state.schedules.filter((s) => s.projectId === projectId);
    },
    getPunchRecordsByDate: (state) => (date) => {
      return state.punchRecords.filter((p) => p.date === date);
    },
    getInspectionsByDate: (state) => (date) => {
      return state.inspections.filter((i) => i.date === date);
    },
    getRequisitionsByStatus: (state) => (status) => {
      return state.requisitions.filter((r) => r.status === status);
    },
    getOpenAlerts: (state) => {
      return state.alerts.filter((a) => a.status !== "resolved").sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
    },
    getCriticalAlerts: (state) => {
      return state.alerts.filter((a) => a.severity === "critical" && a.status !== "resolved");
    },
    getCalendarEvents: (state) => (startDate, endDate) => {
      const events = [];
      const schedules = state.schedules.filter((s) => s.date >= startDate && s.date <= endDate);
      schedules.forEach((schedule) => {
        const project = state.projects.find((p) => p.id === schedule.projectId);
        const staff = state.staff.find((s) => s.id === schedule.staffId);
        events.push({
          id: `sched-${schedule.id}`,
          date: schedule.date,
          type: "schedule",
          title: `${(staff == null ? void 0 : staff.name) || "\u672A\u77E5"} - ${(project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE"}`,
          description: `${schedule.startTime}-${schedule.endTime}`,
          status: schedule.status,
          color: schedule.status === "completed" ? "bg-green-100 border-green-500" : schedule.status === "in_progress" ? "bg-blue-100 border-blue-500" : schedule.status === "cancelled" ? "bg-gray-100 border-gray-500" : "bg-blue-50 border-blue-300",
          relatedId: schedule.id,
          projectId: schedule.projectId
        });
      });
      const punches = state.punchRecords.filter((p) => p.date >= startDate && p.date <= endDate);
      punches.forEach((punch) => {
        if (punch.status === "absent" || punch.status === "late" || punch.status === "early_leave") {
          const staff = state.staff.find((s) => s.id === punch.staffId);
          events.push({
            id: `punch-${punch.id}`,
            date: punch.date,
            type: "punch",
            title: `${(staff == null ? void 0 : staff.name) || "\u672A\u77E5"} - \u6253\u5361\u5F02\u5E38`,
            description: punch.status === "absent" ? "\u7F3A\u52E4" : punch.status === "late" ? "\u8FDF\u5230" : "\u65E9\u9000",
            status: punch.status,
            color: punch.status === "absent" ? "bg-red-100 border-red-500" : "bg-yellow-100 border-yellow-500",
            relatedId: punch.id,
            projectId: punch.projectId
          });
        }
      });
      const inspections = state.inspections.filter((i) => i.date >= startDate && i.date <= endDate);
      inspections.forEach((inspection) => {
        const project = state.projects.find((p) => p.id === inspection.projectId);
        events.push({
          id: `inspect-${inspection.id}`,
          date: inspection.date,
          type: "inspection",
          title: `\u8D28\u68C0 - ${(project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE"}`,
          description: `\u8BC4\u5206: ${inspection.score}\u5206 - ${inspection.overallStatus}`,
          status: inspection.overallStatus,
          color: inspection.overallStatus === "excellent" || inspection.overallStatus === "good" ? "bg-green-100 border-green-500" : inspection.overallStatus === "pass" ? "bg-yellow-100 border-yellow-500" : "bg-red-100 border-red-500",
          relatedId: inspection.id,
          projectId: inspection.projectId
        });
      });
      const requisitions = state.requisitions.filter((r) => r.applicationDate >= startDate && r.applicationDate <= endDate);
      requisitions.forEach((req) => {
        const project = state.projects.find((p) => p.id === req.projectId);
        events.push({
          id: `req-${req.id}`,
          date: req.applicationDate,
          type: "requisition",
          title: `\u7533\u9886 - ${(project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE"}`,
          description: `${req.items.length}\u9879\u8017\u6750`,
          status: req.status,
          color: req.status === "pending" ? "bg-yellow-100 border-yellow-500" : req.status === "approved" || req.status === "completed" ? "bg-green-100 border-green-500" : req.status === "rejected" ? "bg-red-100 border-red-500" : "bg-blue-100 border-blue-500",
          relatedId: req.id,
          projectId: req.projectId
        });
      });
      return events;
    },
    lowStockSupplies: (state) => {
      return state.supplies.filter((s) => s.currentStock <= s.warningStock);
    },
    pendingRectifications: (state) => {
      return state.rectifications.filter((r) => r.status === "pending" || r.status === "overdue");
    },
    statistics: (state) => {
      const today = formatDate(/* @__PURE__ */ new Date());
      const todaySchedules = state.schedules.filter((s) => s.date === today);
      const todayPunches = state.punchRecords.filter((p) => p.date === today);
      return {
        totalProjects: state.projects.filter((p) => p.status === "active").length,
        expiringProjects: state.projects.filter((p) => p.status === "expiring").length,
        todaySchedules: todaySchedules.length,
        todayCompleted: todaySchedules.filter((s) => s.status === "completed").length,
        todayAbsent: todayPunches.filter((p) => p.status === "absent").length,
        todayLate: todayPunches.filter((p) => p.status === "late").length,
        pendingRequisitions: state.requisitions.filter((r) => r.status === "pending").length,
        openAlerts: state.alerts.filter((a) => a.status !== "resolved").length,
        criticalAlerts: state.alerts.filter((a) => a.severity === "critical" && a.status !== "resolved").length,
        lowStockCount: state.supplies.filter((s) => s.currentStock <= s.warningStock).length,
        pendingRectifications: state.rectifications.filter((r) => r.status === "pending" || r.status === "overdue").length
      };
    }
  },
  actions: {
    async updateRequisitionStatus(requisitionId, status, approverId, rejectReason) {
      const req = this.requisitions.find((r) => r.id === requisitionId);
      if (req) {
        req.status = status;
        if (approverId) {
          req.approverId = approverId;
          req.approvalDate = formatDate(/* @__PURE__ */ new Date());
        }
        if (rejectReason) {
          req.rejectReason = rejectReason;
        }
        if (status === "delivered") {
          req.deliveryDate = formatDate(/* @__PURE__ */ new Date());
          req.items.forEach((item) => {
            item.deliveredQuantity = item.quantity;
            const supply = this.supplies.find((s) => s.id === item.supplyId);
            if (supply) {
              supply.currentStock += item.quantity;
              supply.lastRestockDate = formatDate(/* @__PURE__ */ new Date());
              supply.lastRestockQuantity = item.quantity;
            }
          });
        }
      }
    },
    async createRequisition(requisition, status = "pending") {
      const newReq = {
        ...requisition,
        id: `req-${Date.now()}`,
        status,
        approverId: null,
        approvalDate: null,
        deliveryDate: null,
        rejectReason: null
      };
      this.requisitions.unshift(newReq);
      return newReq;
    },
    async saveRequisitionDraft(requisition) {
      return this.createRequisition(requisition, "draft");
    },
    async updateAlertStatus(alertId, status, note, operatorId) {
      const alert = this.alerts.find((a) => a.id === alertId);
      if (alert) {
        alert.status = status;
        alert.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        if (status === "resolved") {
          alert.resolvedAt = (/* @__PURE__ */ new Date()).toISOString();
          alert.resolutionNote = note;
        }
        alert.history.push({
          status,
          note,
          operatorId,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    },
    async updateRectificationItem(rectId, itemIndex, completed, note) {
      const rect = this.rectifications.find((r) => r.id === rectId);
      if (rect && rect.items[itemIndex]) {
        rect.items[itemIndex].completed = completed;
        rect.items[itemIndex].note = note;
        if (completed) {
          rect.items[itemIndex].completedDate = formatDate(/* @__PURE__ */ new Date());
        }
        const allCompleted = rect.items.every((item) => item.completed);
        if (allCompleted) {
          rect.status = "completed";
          rect.completedDate = formatDate(/* @__PURE__ */ new Date());
        } else {
          rect.status = "in_progress";
        }
      }
    },
    async updatePunchRecord(punchId, updates) {
      const punch = this.punchRecords.find((p) => p.id === punchId);
      if (punch) {
        Object.assign(punch, updates);
        this.checkAndCreateAlertForPunch(punch);
      }
    },
    async createInspection(inspection) {
      const newInspection = {
        ...inspection,
        id: `inspect-${Date.now()}`,
        rectificationStatus: inspection.rectificationRequired ? "pending" : "none"
      };
      this.inspections.unshift(newInspection);
      if (inspection.rectificationRequired && inspection.rectificationDeadline) {
        const failedItems = inspection.items.filter((item) => !item.passed);
        const rectItems = failedItems.map((item) => ({
          description: `${item.name} - ${item.note || "\u672A\u901A\u8FC7\u8D28\u68C0"}`,
          completed: false,
          completedDate: null,
          note: ""
        }));
        const newRect = {
          id: `rect-${Date.now()}`,
          inspectionId: newInspection.id,
          projectId: inspection.projectId,
          deadline: inspection.rectificationDeadline,
          status: "pending",
          items: rectItems,
          assigneeId: null,
          completedDate: null,
          photos: [],
          note: ""
        };
        this.rectifications.unshift(newRect);
        const project = this.getProjectById(inspection.projectId);
        this.alerts.unshift({
          id: `alert-rect-${Date.now()}`,
          type: "rectification",
          severity: "warning",
          status: "open",
          title: "\u65B0\u6574\u6539\u4EFB\u52A1",
          description: `\u9879\u76EE ${(project == null ? void 0 : project.name) || "\u672A\u77E5\u9879\u76EE"} \u6709\u65B0\u7684\u6574\u6539\u4EFB\u52A1\uFF0C\u622A\u6B62\u65E5\u671F ${inspection.rectificationDeadline}`,
          relatedId: newRect.id,
          relatedType: "rectification",
          projectId: inspection.projectId,
          assigneeId: null,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          resolvedAt: null,
          resolutionNote: null,
          history: [{
            status: "open",
            note: "\u8D28\u68C0\u4E0D\u5408\u683C\uFF0C\u81EA\u52A8\u751F\u6210\u6574\u6539\u4EFB\u52A1",
            operatorId: inspection.inspectorId,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }]
        });
      }
      return newInspection;
    },
    async createRectification(rectification) {
      const newRect = {
        ...rectification,
        id: `rect-${Date.now()}`
      };
      this.rectifications.unshift(newRect);
      const inspection = this.inspections.find((i) => i.id === rectification.inspectionId);
      if (inspection) {
        inspection.rectificationStatus = "pending";
      }
      return newRect;
    },
    async updateRectificationStatus(rectId, status, assigneeId) {
      const rect = this.rectifications.find((r) => r.id === rectId);
      if (rect) {
        rect.status = status;
        if (assigneeId) {
          rect.assigneeId = assigneeId;
        }
        if (status === "in_progress") {
          const alert = this.alerts.find((a) => a.relatedId === rectId && a.type === "rectification");
          if (alert) {
            alert.status = "in_progress";
            alert.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
            alert.history.push({
              status: "in_progress",
              note: "\u6574\u6539\u5F00\u59CB\u5904\u7406",
              operatorId: assigneeId || "system",
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
          }
        }
      }
    },
    async assignRectification(rectId, assigneeId) {
      const rect = this.rectifications.find((r) => r.id === rectId);
      if (rect) {
        rect.assigneeId = assigneeId;
        if (rect.status === "pending") {
          rect.status = "in_progress";
        }
      }
    },
    async reviewRectification(rectId, passed, reviewerId, note) {
      const rect = this.rectifications.find((r) => r.id === rectId);
      if (rect) {
        const inspection = this.inspections.find((i) => i.id === rect.inspectionId);
        if (passed) {
          rect.status = "completed";
          rect.completedDate = formatDate(/* @__PURE__ */ new Date());
          if (inspection) {
            inspection.rectificationStatus = "completed";
          }
          const alert = this.alerts.find((a) => a.relatedId === rectId && a.type === "rectification");
          if (alert) {
            alert.status = "resolved";
            alert.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
            alert.resolvedAt = (/* @__PURE__ */ new Date()).toISOString();
            alert.resolutionNote = note;
            alert.history.push({
              status: "resolved",
              note: `\u6574\u6539\u590D\u67E5\u901A\u8FC7 - ${note}`,
              operatorId: reviewerId,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
          }
        } else {
          rect.status = "in_progress";
          rect.items.forEach((item) => {
            item.completed = false;
            item.completedDate = null;
          });
          if (inspection) {
            inspection.rectificationStatus = "pending";
          }
          const alert = this.alerts.find((a) => a.relatedId === rectId && a.type === "rectification");
          if (alert) {
            alert.status = "open";
            alert.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
            alert.history.push({
              status: "open",
              note: `\u6574\u6539\u590D\u67E5\u672A\u901A\u8FC7\uFF0C\u9700\u91CD\u65B0\u6574\u6539 - ${note}`,
              operatorId: reviewerId,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
          }
        }
      }
    },
    async addRectificationPhoto(rectId, photoUrl) {
      const rect = this.rectifications.find((r) => r.id === rectId);
      if (rect) {
        rect.photos.push(photoUrl);
      }
    },
    async createSchedule(schedule) {
      const conflict = this.checkScheduleConflict(
        schedule.staffId,
        schedule.date,
        schedule.startTime,
        schedule.endTime
      );
      if (conflict) {
        throw new Error("\u8BE5\u5458\u5DE5\u5728\u8BE5\u65F6\u95F4\u6BB5\u5DF2\u6709\u6392\u73ED");
      }
      const newSchedule = {
        ...schedule,
        id: `sched-${Date.now()}`,
        status: "scheduled"
      };
      this.schedules.push(newSchedule);
      return newSchedule;
    },
    async updateSchedule(scheduleId, updates) {
      const schedule = this.schedules.find((s) => s.id === scheduleId);
      if (schedule) {
        if (updates.staffId || updates.date || updates.startTime || updates.endTime) {
          const conflict = this.checkScheduleConflict(
            updates.staffId || schedule.staffId,
            updates.date || schedule.date,
            updates.startTime || schedule.startTime,
            updates.endTime || schedule.endTime,
            scheduleId
          );
          if (conflict) {
            throw new Error("\u8BE5\u5458\u5DE5\u5728\u8BE5\u65F6\u95F4\u6BB5\u5DF2\u6709\u6392\u73ED");
          }
        }
        Object.assign(schedule, updates);
      }
    },
    async deleteSchedule(scheduleId) {
      const index = this.schedules.findIndex((s) => s.id === scheduleId);
      if (index > -1) {
        this.schedules.splice(index, 1);
      }
    },
    checkScheduleConflict(staffId, date, startTime, endTime, excludeId) {
      const newStart = this.timeToMinutes(startTime);
      const newEnd = this.timeToMinutes(endTime);
      return this.schedules.some((s) => {
        if (s.id === excludeId) return false;
        if (s.staffId !== staffId || s.date !== date) return false;
        if (s.status === "cancelled") return false;
        const existingStart = this.timeToMinutes(s.startTime);
        const existingEnd = this.timeToMinutes(s.endTime);
        return newStart < existingEnd && newEnd > existingStart;
      });
    },
    timeToMinutes(time) {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    },
    getSchedulesByWeek(startDate) {
      const dates = generateDateRange(startDate, addDays(startDate, 6));
      return this.schedules.filter((s) => dates.includes(s.date));
    },
    getSchedulesByStaffAndDate(staffId, date) {
      return this.schedules.filter((s) => s.staffId === staffId && s.date === date && s.status !== "cancelled");
    },
    checkAndCreateAlertForPunch(punch) {
      if (punch.status === "normal" || punch.status === "pending") {
        return;
      }
      const existingAlert = this.alerts.find(
        (a) => a.relatedId === punch.id && a.relatedType === "punch" && a.status !== "resolved"
      );
      if (existingAlert) {
        return;
      }
      const staff = this.getStaffById(punch.staffId);
      const project = this.getProjectById(punch.projectId);
      let alertType = "missing_punch";
      let severity = "warning";
      let title = "";
      let description = "";
      if (punch.status === "absent") {
        alertType = "missing_punch";
        severity = "critical";
        title = `${(staff == null ? void 0 : staff.name) || "\u5458\u5DE5"} \u7F3A\u52E4`;
        description = `${(staff == null ? void 0 : staff.name) || "\u5458\u5DE5"} \u5728 ${punch.date} ${(project == null ? void 0 : project.name) || "\u9879\u76EE"} \u7F3A\u52E4\uFF0C\u672A\u6253\u5361`;
      } else if (punch.status === "late") {
        alertType = "missing_punch";
        severity = "warning";
        title = `${(staff == null ? void 0 : staff.name) || "\u5458\u5DE5"} \u8FDF\u5230`;
        description = `${(staff == null ? void 0 : staff.name) || "\u5458\u5DE5"} \u5728 ${punch.date} ${(project == null ? void 0 : project.name) || "\u9879\u76EE"} \u4E0A\u73ED\u6253\u5361\u8FDF\u5230\uFF0C\u6253\u5361\u65F6\u95F4: ${punch.checkInTime}`;
      } else if (punch.status === "early_leave") {
        alertType = "missing_punch";
        severity = "warning";
        title = `${(staff == null ? void 0 : staff.name) || "\u5458\u5DE5"} \u65E9\u9000`;
        description = `${(staff == null ? void 0 : staff.name) || "\u5458\u5DE5"} \u5728 ${punch.date} ${(project == null ? void 0 : project.name) || "\u9879\u76EE"} \u4E0B\u73ED\u6253\u5361\u65E9\u9000\uFF0C\u6253\u5361\u65F6\u95F4: ${punch.checkOutTime}`;
      }
      const alert = {
        id: `alert-${Date.now()}`,
        type: alertType,
        severity,
        status: "open",
        title,
        description,
        relatedId: punch.id,
        relatedType: "punch",
        projectId: punch.projectId,
        assigneeId: null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        resolvedAt: null,
        resolutionNote: null,
        history: [{
          status: "open",
          note: "\u7CFB\u7EDF\u81EA\u52A8\u751F\u6210\u9884\u8B66",
          operatorId: "system",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }]
      };
      this.alerts.push(alert);
    },
    async supplementPunch(punchId, operatorId, checkInTime, checkOutTime, note) {
      const punch = this.punchRecords.find((p) => p.id === punchId);
      if (!punch) {
        throw new Error("\u6253\u5361\u8BB0\u5F55\u4E0D\u5B58\u5728");
      }
      const updates = {};
      if (checkInTime) updates.checkInTime = checkInTime;
      if (checkOutTime) updates.checkOutTime = checkOutTime;
      if (note) updates.note = note;
      const schedule = this.schedules.find((s) => s.id === punch.scheduleId);
      if (schedule) {
        let newStatus = "normal";
        const scheduledStart = schedule.startTime;
        const scheduledEnd = schedule.endTime;
        if (checkInTime && this.timeToMinutes(checkInTime) > this.timeToMinutes(scheduledStart)) {
          newStatus = "late";
        }
        if (checkOutTime && this.timeToMinutes(checkOutTime) < this.timeToMinutes(scheduledEnd)) {
          newStatus = checkInTime && this.timeToMinutes(checkInTime) > this.timeToMinutes(scheduledStart) ? "late" : "early_leave";
        }
        updates.status = newStatus;
      }
      Object.assign(punch, updates);
      const relatedAlert = this.alerts.find(
        (a) => a.relatedId === punchId && a.relatedType === "punch" && a.status !== "resolved"
      );
      if (relatedAlert) {
        relatedAlert.status = "in_progress";
        relatedAlert.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        relatedAlert.history.push({
          status: "in_progress",
          note: `\u4EBA\u5DE5\u8865\u5361: ${note || "\u5DF2\u5904\u7406"}`,
          operatorId,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      return punch;
    }
  }
});

export { addDays as a, formatDateTime as b, getFirstDayOfMonth as c, daysBetween as d, endOfMonth as e, formatDate as f, getDaysInMonth as g, isToday as h, isPast as i, mockUsers as m, relativeTime as r, startOfMonth as s, useDataStore as u };
//# sourceMappingURL=data-CvF3Pjf4.mjs.map
