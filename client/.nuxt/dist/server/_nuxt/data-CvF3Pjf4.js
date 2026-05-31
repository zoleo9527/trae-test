import { d as defineStore } from "../server.mjs";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn.js";
const mockUsers = [
  {
    id: "user-1",
    name: "张明",
    role: "project_manager",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=zm",
    phone: "13800138001"
  },
  {
    id: "user-2",
    name: "李华",
    role: "scheduling_specialist",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lh",
    phone: "13800138002"
  },
  {
    id: "user-3",
    name: "王芳",
    role: "quality_inspector",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=wf",
    phone: "13800138003"
  }
];
const mockProjects = [
  {
    id: "proj-1",
    name: "国贸中心写字楼",
    address: "北京市朝阳区建国门外大街1号",
    clientName: "国贸物业",
    clientPhone: "13900139001",
    contractStartDate: "2025-01-01",
    contractEndDate: "2026-12-31",
    status: "active",
    weeklyCleaningDays: 7,
    assignedStaff: ["staff-1", "staff-2", "staff-3"],
    note: "甲级写字楼，每日清洁要求高"
  },
  {
    id: "proj-2",
    name: "万达广场购物中心",
    address: "北京市朝阳区建国路88号",
    clientName: "万达商业",
    clientPhone: "13900139002",
    contractStartDate: "2025-03-15",
    contractEndDate: "2026-06-30",
    status: "expiring",
    weeklyCleaningDays: 7,
    assignedStaff: ["staff-4", "staff-5", "staff-6"],
    note: "大型购物中心，人流量大"
  },
  {
    id: "proj-3",
    name: "中关村科技园办公楼",
    address: "北京市海淀区中关村大街1号",
    clientName: "科技园管理公司",
    clientPhone: "13900139003",
    contractStartDate: "2025-02-01",
    contractEndDate: "2026-05-15",
    status: "expiring",
    weeklyCleaningDays: 5,
    assignedStaff: ["staff-7", "staff-8"],
    note: "科技园区，工作日清洁"
  },
  {
    id: "proj-4",
    name: "亦庄工业园区",
    address: "北京市大兴区亦庄经济技术开发区",
    clientName: "亦庄工业园",
    clientPhone: "13900139004",
    contractStartDate: "2024-06-01",
    contractEndDate: "2026-12-31",
    status: "active",
    weeklyCleaningDays: 6,
    assignedStaff: ["staff-9", "staff-10"],
    note: "工业园区，有特殊清洁要求"
  }
];
const mockStaff = [
  { id: "staff-1", name: "赵大姐", phone: "13700137001", position: "cleaner", hireDate: "2023-05-15", status: "active", projects: ["proj-1"] },
  { id: "staff-2", name: "钱阿姨", phone: "13700137002", position: "cleaner", hireDate: "2023-06-20", status: "active", projects: ["proj-1"] },
  { id: "staff-3", name: "孙哥", phone: "13700137003", position: "supervisor", hireDate: "2022-03-10", status: "active", projects: ["proj-1"] },
  { id: "staff-4", name: "李姐", phone: "13700137004", position: "cleaner", hireDate: "2024-01-15", status: "active", projects: ["proj-2"] },
  { id: "staff-5", name: "周阿姨", phone: "13700137005", position: "cleaner", hireDate: "2024-02-20", status: "active", projects: ["proj-2"] },
  { id: "staff-6", name: "吴师傅", phone: "13700137006", position: "supervisor", hireDate: "2023-08-05", status: "active", projects: ["proj-2"] },
  { id: "staff-7", name: "郑姐", phone: "13700137007", position: "cleaner", hireDate: "2023-11-10", status: "active", projects: ["proj-3"] },
  { id: "staff-8", name: "王哥", phone: "13700137008", position: "supervisor", hireDate: "2022-12-01", status: "active", projects: ["proj-3"] },
  { id: "staff-9", name: "冯姐", phone: "13700137009", position: "cleaner", hireDate: "2024-03-15", status: "active", projects: ["proj-4"] },
  { id: "staff-10", name: "陈哥", phone: "13700137010", position: "supervisor", hireDate: "2023-04-20", status: "active", projects: ["proj-4"] }
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
  schedules[3].note = "员工请假，已安排替班";
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
      note: status === "absent" ? "未打卡，需核实" : ""
    });
  });
  const missingPunch = records.find((r) => r.status === "absent");
  if (missingPunch) {
    missingPunch.note = "员工无故缺勤，已通知主管";
  }
  return records;
};
const mockPunchRecords = generateMockPunchRecords();
const mockSupplies = [
  { id: "supply-1", name: "全能清洁剂", category: "detergent", unit: "瓶", currentStock: 45, safeStock: 30, warningStock: 10, lastRestockDate: "2026-05-20", lastRestockQuantity: 50, unitPrice: 28.5, supplier: "清洁用品批发", note: "日常清洁必备" },
  { id: "supply-2", name: "玻璃清洁剂", category: "detergent", unit: "瓶", currentStock: 12, safeStock: 20, warningStock: 5, lastRestockDate: "2026-05-15", lastRestockQuantity: 30, unitPrice: 35, supplier: "清洁用品批发", note: "" },
  { id: "supply-3", name: "地板蜡水", category: "detergent", unit: "桶", currentStock: 8, safeStock: 15, warningStock: 3, lastRestockDate: "2026-05-10", lastRestockQuantity: 20, unitPrice: 120, supplier: "清洁用品批发", note: "" },
  { id: "supply-4", name: "拖把", category: "tool", unit: "把", currentStock: 25, safeStock: 20, warningStock: 5, lastRestockDate: "2026-05-25", lastRestockQuantity: 30, unitPrice: 45, supplier: "清洁工具专营", note: "" },
  { id: "supply-5", name: "清洁布", category: "tool", unit: "块", currentStock: 3, safeStock: 50, warningStock: 10, lastRestockDate: "2026-04-28", lastRestockQuantity: 100, unitPrice: 8.5, supplier: "清洁工具专营", note: "库存严重不足" },
  { id: "supply-6", name: "垃圾袋（大)", category: "disposable", unit: "卷", currentStock: 150, safeStock: 100, warningStock: 20, lastRestockDate: "2026-05-22", lastRestockQuantity: 200, unitPrice: 15, supplier: "一次性用品批发", note: "" },
  { id: "supply-7", name: "卫生纸", category: "disposable", unit: "提", currentStock: 20, safeStock: 50, warningStock: 10, lastRestockDate: "2026-05-18", lastRestockQuantity: 60, unitPrice: 25, supplier: "一次性用品批发", note: "" },
  { id: "supply-8", name: "洗手液", category: "disposable", unit: "瓶", currentStock: 8, safeStock: 30, warningStock: 5, lastRestockDate: "2026-05-05", lastRestockQuantity: 40, unitPrice: 18, supplier: "一次性用品批发", note: "" },
  { id: "supply-9", name: "一次性手套", category: "protective", unit: "盒", currentStock: 5, safeStock: 20, warningStock: 5, lastRestockDate: "2026-04-30", lastRestockQuantity: 30, unitPrice: 12, supplier: "防护用品专营", note: "" },
  { id: "supply-10", name: "口罩", category: "protective", unit: "盒", currentStock: 2, safeStock: 30, warningStock: 10, lastRestockDate: "2026-04-20", lastRestockQuantity: 50, unitPrice: 20, supplier: "防护用品专营", note: "库存预警" }
];
const mockRequisitions = [
  {
    id: "req-1",
    projectId: "proj-1",
    applicantId: "staff-3",
    applicationDate: "2026-05-20",
    items: [
      { supplyId: "supply-1", supplyName: "全能清洁剂", quantity: 20, deliveredQuantity: 20, unitPrice: 28.5 }
    ],
    status: "completed",
    approverId: "user-1",
    approvalDate: "2026-05-21",
    deliveryDate: "2026-05-22",
    rejectReason: null,
    note: "月度常规补货"
  },
  {
    id: "req-2",
    projectId: "proj-2",
    applicantId: "staff-6",
    applicationDate: "2026-05-25",
    items: [
      { supplyId: "supply-2", supplyName: "玻璃清洁剂", quantity: 15, deliveredQuantity: 15, unitPrice: 35 },
      { supplyId: "supply-6", supplyName: "垃圾袋", quantity: 50, deliveredQuantity: 50, unitPrice: 15 }
    ],
    status: "delivered",
    approverId: "user-1",
    approvalDate: "2026-05-26",
    deliveryDate: "2026-05-27",
    rejectReason: null,
    note: "购物中心客流量大，消耗快"
  },
  {
    id: "req-3",
    projectId: "proj-3",
    applicantId: "staff-8",
    applicationDate: "2026-05-28",
    items: [
      { supplyId: "supply-5", supplyName: "清洁布", quantity: 30, deliveredQuantity: null, unitPrice: null },
      { supplyId: "supply-10", supplyName: "口罩", quantity: 20, deliveredQuantity: null, unitPrice: null }
    ],
    status: "pending",
    approverId: null,
    approvalDate: null,
    deliveryDate: null,
    rejectReason: null,
    note: "紧急补货，库存不足"
  },
  {
    id: "req-4",
    projectId: "proj-4",
    applicantId: "staff-10",
    applicationDate: "2026-05-27",
    items: [
      { supplyId: "supply-3", supplyName: "地板蜡水", quantity: 10, deliveredQuantity: null, unitPrice: null },
      { supplyId: "supply-7", supplyName: "卫生纸", quantity: 30, deliveredQuantity: null, unitPrice: null }
    ],
    status: "approved",
    approverId: "user-1",
    approvalDate: "2026-05-28",
    deliveryDate: null,
    rejectReason: null,
    note: "月度清洁计划"
  },
  {
    id: "req-5",
    projectId: "proj-1",
    applicantId: "staff-3",
    applicationDate: "2026-05-26",
    items: [
      { supplyId: "supply-9", supplyName: "一次性手套", quantity: 15, deliveredQuantity: null, unitPrice: null }
    ],
    status: "rejected",
    approverId: "user-1",
    approvalDate: "2026-05-26",
    deliveryDate: null,
    rejectReason: "库存还有，下月再申请",
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
      { name: "大堂清洁", score: 18, maxScore: 20, passed: true, note: "整体良好" },
      { name: "卫生间清洁", score: 19, maxScore: 20, passed: true, note: "无异味" },
      { name: "电梯清洁", score: 17, maxScore: 20, passed: true, note: "玻璃有轻微水迹" },
      { name: "垃圾清运", score: 20, maxScore: 20, passed: true, note: "" },
      { name: "消毒工作", score: 18, maxScore: 20, passed: true, note: "" }
    ],
    overallStatus: "excellent",
    photos: ["https://picsum.photos/400/300?random=ins1"],
    rectificationRequired: false,
    rectificationDeadline: null,
    rectificationStatus: "none",
    note: "整体优秀，继续保持"
  },
  {
    id: "inspect-2",
    projectId: "proj-2",
    inspectorId: "user-3",
    date: "2026-05-22",
    score: 75,
    items: [
      { name: "公共区域清洁", score: 15, maxScore: 20, passed: true, note: "地面有污渍" },
      { name: "卫生间清洁", score: 12, maxScore: 20, passed: false, note: "有异味，地面湿滑" },
      { name: "电梯清洁", score: 16, maxScore: 20, passed: true, note: "" },
      { name: "垃圾清运", score: 16, maxScore: 20, passed: true, note: "" },
      { name: "消毒工作", score: 16, maxScore: 20, passed: true, note: "" }
    ],
    overallStatus: "pass",
    photos: ["https://picsum.photos/400/300?random=ins2"],
    rectificationRequired: true,
    rectificationDeadline: "2026-05-25",
    rectificationStatus: "completed",
    note: "卫生间需要重点整改"
  },
  {
    id: "inspect-3",
    projectId: "proj-3",
    inspectorId: "user-3",
    date: "2026-05-25",
    score: 68,
    items: [
      { name: "办公室清洁", score: 14, maxScore: 20, passed: true, note: "桌面有灰尘" },
      { name: "会议室清洁", score: 10, maxScore: 20, passed: false, note: "玻璃不干净" },
      { name: "公共区域", score: 15, maxScore: 20, passed: true, note: "" },
      { name: "卫生间清洁", score: 14, maxScore: 20, passed: true, note: "" },
      { name: "消毒工作", score: 15, maxScore: 20, passed: true, note: "" }
    ],
    overallStatus: "fail",
    photos: ["https://picsum.photos/400/300?random=ins3"],
    rectificationRequired: true,
    rectificationDeadline: "2026-05-30",
    rectificationStatus: "overdue",
    note: "会议室玻璃清洁不到位，需立即整改"
  },
  {
    id: "inspect-4",
    projectId: "proj-4",
    inspectorId: "user-3",
    date: "2026-05-28",
    score: 85,
    items: [
      { name: "生产车间清洁", score: 17, maxScore: 20, passed: true, note: "" },
      { name: "办公区清洁", score: 18, maxScore: 20, passed: true, note: "" },
      { name: "仓库清洁", score: 16, maxScore: 20, passed: true, note: "" },
      { name: "卫生间清洁", score: 17, maxScore: 20, passed: true, note: "" },
      { name: "消毒工作", score: 17, maxScore: 20, passed: true, note: "" }
    ],
    overallStatus: "good",
    photos: ["https://picsum.photos/400/300?random=ins4"],
    rectificationRequired: false,
    rectificationDeadline: null,
    rectificationStatus: "none",
    note: "良好，保持"
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
      { description: "卫生间异味处理", completed: true, completedDate: "2026-05-24", note: "已完成" },
      { description: "地面防滑处理", completed: true, completedDate: "2026-05-24", note: "已铺设防滑垫" }
    ],
    assigneeId: "staff-6",
    completedDate: "2026-05-24",
    photos: ["https://picsum.photos/400/300?random=rect1"],
    note: "整改完成，已复查"
  },
  {
    id: "rect-2",
    inspectionId: "inspect-3",
    projectId: "proj-3",
    deadline: "2026-05-30",
    status: "overdue",
    items: [
      { description: "会议室玻璃清洁", completed: false, completedDate: null, note: "" },
      { description: "桌面灰尘清洁", completed: true, completedDate: "2026-05-29", note: "已完成" }
    ],
    assigneeId: "staff-8",
    completedDate: null,
    photos: [],
    note: "玻璃清洁尚未完成"
  }
];
const generateMockAlerts = () => {
  const alerts = [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const missingPunch = mockPunchRecords.find((p) => p.status === "absent");
  if (missingPunch) {
    alerts.push({
      id: "alert-1",
      type: "missing_punch",
      severity: "critical",
      status: "open",
      title: "员工缺勤未打卡",
      description: `员工 ${mockStaff.find((s) => s.id === missingPunch.staffId)?.name} 在 ${missingPunch.date} 未打卡，需立即核实处理`,
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
        note: "系统自动检测",
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
      title: "库存预警",
      description: `${supply.name} 库存仅剩 ${supply.currentStock}${supply.unit}，低于警戒线 ${supply.warningStock}${supply.unit}`,
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
        note: "库存预警自动触发",
        operatorId: "system",
        timestamp: now
      }]
    });
  });
  const pendingRect = mockRectifications.filter((r) => r.status === "overdue");
  pendingRect.forEach((rect, idx) => {
    alerts.push({
      id: `alert-rect-${idx}`,
      type: "rectification",
      severity: "critical",
      status: "open",
      title: "整改逾期未完成",
      description: `项目 ${mockProjects.find((p) => p.id === rect.projectId)?.name} 的整改任务已逾期，请立即处理`,
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
        note: "整改逾期自动提醒",
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
      title: "合同即将到期",
      description: `项目 ${project.name} 的合同将于 ${project.contractEndDate} 到期，请及时续约`,
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
        note: "合同到期提醒",
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
      title: "申领单待审核",
      description: `项目 ${mockProjects.find((p) => p.id === pendingReq.projectId)?.name} 有新的耗材申领单待审核`,
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
        note: "待办任务提醒",
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
  if (diff === 0) return "今天";
  if (diff === 1) return "明天";
  if (diff === -1) return "昨天";
  if (diff > 1 && diff < 7) return `${diff}天后`;
  if (diff < -1 && diff > -7) return `${Math.abs(diff)}天前`;
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
          title: `${staff?.name || "未知"} - ${project?.name || "未知项目"}`,
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
            title: `${staff?.name || "未知"} - 打卡异常`,
            description: punch.status === "absent" ? "缺勤" : punch.status === "late" ? "迟到" : "早退",
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
          title: `质检 - ${project?.name || "未知项目"}`,
          description: `评分: ${inspection.score}分 - ${inspection.overallStatus}`,
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
          title: `申领 - ${project?.name || "未知项目"}`,
          description: `${req.items.length}项耗材`,
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
          description: `${item.name} - ${item.note || "未通过质检"}`,
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
          title: "新整改任务",
          description: `项目 ${project?.name || "未知项目"} 有新的整改任务，截止日期 ${inspection.rectificationDeadline}`,
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
            note: "质检不合格，自动生成整改任务",
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
              note: "整改开始处理",
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
              note: `整改复查通过 - ${note}`,
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
              note: `整改复查未通过，需重新整改 - ${note}`,
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
        throw new Error("该员工在该时间段已有排班");
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
            throw new Error("该员工在该时间段已有排班");
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
        title = `${staff?.name || "员工"} 缺勤`;
        description = `${staff?.name || "员工"} 在 ${punch.date} ${project?.name || "项目"} 缺勤，未打卡`;
      } else if (punch.status === "late") {
        alertType = "missing_punch";
        severity = "warning";
        title = `${staff?.name || "员工"} 迟到`;
        description = `${staff?.name || "员工"} 在 ${punch.date} ${project?.name || "项目"} 上班打卡迟到，打卡时间: ${punch.checkInTime}`;
      } else if (punch.status === "early_leave") {
        alertType = "missing_punch";
        severity = "warning";
        title = `${staff?.name || "员工"} 早退`;
        description = `${staff?.name || "员工"} 在 ${punch.date} ${project?.name || "项目"} 下班打卡早退，打卡时间: ${punch.checkOutTime}`;
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
          note: "系统自动生成预警",
          operatorId: "system",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }]
      };
      this.alerts.push(alert);
    },
    async supplementPunch(punchId, operatorId, checkInTime, checkOutTime, note) {
      const punch = this.punchRecords.find((p) => p.id === punchId);
      if (!punch) {
        throw new Error("打卡记录不存在");
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
          note: `人工补卡: ${note || "已处理"}`,
          operatorId,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      return punch;
    }
  }
});
export {
  addDays as a,
  formatDateTime as b,
  getFirstDayOfMonth as c,
  daysBetween as d,
  endOfMonth as e,
  formatDate as f,
  getDaysInMonth as g,
  isToday as h,
  isPast as i,
  mockUsers as m,
  relativeTime as r,
  startOfMonth as s,
  useDataStore as u
};
//# sourceMappingURL=data-CvF3Pjf4.js.map
