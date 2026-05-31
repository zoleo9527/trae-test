import { b as defineEventHandler, n as getRouterParam, v as readBody, c as createError } from '../../../../nitro/nitro.mjs';
import { b as mockWorkOrders, m as mockPartInventory, a as mockUsers } from '../../../../_/mockData.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

function getCurrentUser(role) {
  return mockUsers.find((u) => u.role === role) || mockUsers[0];
}
function createTimelineEntry(action, operator, operatorRole, remark) {
  return {
    id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    operator,
    operatorRole,
    remark,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function createProgressEntry(workOrderId, status, description, operator, operatorRole) {
  return {
    id: `pg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workOrderId,
    status,
    description,
    operator,
    operatorRole,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
const action_post = defineEventHandler(async (event) => {
  var _a;
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const { actionType, role = "technician", ...data } = body;
  const index = mockWorkOrders.findIndex((wo) => wo.id === id);
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: "\u5DE5\u5355\u4E0D\u5B58\u5728"
    });
  }
  const currentUser = getCurrentUser(role);
  const order = mockWorkOrders[index];
  const timeline = [...order.timeline];
  let newStatus = order.status;
  let newQuote = order.quote;
  let newParts = order.parts;
  let newProgress = order.progress;
  let newReceipt = order.receipt;
  let updates = {};
  switch (actionType) {
    case "start_inspect": {
      newStatus = "quoting";
      timeline.push(createTimelineEntry("\u5F00\u59CB\u68C0\u6D4B", currentUser.name, currentUser.role, data.remark));
      newProgress.push(createProgressEntry(id, "inspecting", "\u5F00\u59CB\u68C0\u6D4B\u624B\u8868\u6545\u969C", currentUser.name, currentUser.role));
      if (data.inspectionResult) {
        updates.inspectionResult = data.inspectionResult;
      }
      break;
    }
    case "lock_parts": {
      if (data.parts && data.parts.length > 0) {
        const newPartLocks = data.parts.map((p, idx) => ({
          id: `pl-${Date.now()}-${idx}`,
          partName: p.partName,
          partCode: p.partCode,
          quantity: p.quantity,
          status: "locked",
          lockedBy: currentUser.id,
          lockedAt: (/* @__PURE__ */ new Date()).toISOString()
        }));
        newParts = [...order.parts.filter((p) => p.status !== "locked"), ...newPartLocks];
        data.parts.forEach((p) => {
          const inv = mockPartInventory.find((i) => i.partCode === p.partCode);
          if (inv) {
            inv.locked = Math.min(inv.locked + p.quantity, inv.stock);
          }
        });
        timeline.push(createTimelineEntry("\u9501\u5B9A\u914D\u4EF6", currentUser.name, currentUser.role, `\u9501\u5B9A ${data.parts.length} \u79CD\u914D\u4EF6`));
        newProgress.push(createProgressEntry(id, "parts_preparing", "\u914D\u4EF6\u5DF2\u9501\u5B9A\uFF0C\u51C6\u5907\u5C31\u7EEA", currentUser.name, currentUser.role));
      }
      break;
    }
    case "release_parts": {
      newParts = order.parts.map((p) => ({
        ...p,
        status: "released"
      }));
      order.parts.forEach((p) => {
        const inv = mockPartInventory.find((i) => i.partCode === p.partCode);
        if (inv) {
          inv.locked = Math.max(0, inv.locked - p.quantity);
        }
      });
      timeline.push(createTimelineEntry("\u91CA\u653E\u914D\u4EF6", currentUser.name, currentUser.role, "\u5DF2\u91CA\u653E\u6240\u6709\u9501\u5B9A\u7684\u914D\u4EF6"));
      break;
    }
    case "submit_quote": {
      newStatus = "pending_approval";
      if (data.partsCost !== void 0 && data.laborCost !== void 0) {
        const amount = data.partsCost + data.laborCost;
        newQuote = {
          id: ((_a = order.quote) == null ? void 0 : _a.id) || `q-${Date.now()}`,
          workOrderId: id,
          amount,
          partsCost: data.partsCost,
          laborCost: data.laborCost,
          status: "submitted",
          remark: data.remark,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        timeline.push(createTimelineEntry("\u63D0\u4EA4\u62A5\u4EF7", currentUser.name, currentUser.role, `\u62A5\u4EF7\u91D1\u989D: \xA5${amount}`));
      }
      break;
    }
    case "approve_quote": {
      newStatus = "pending_confirm";
      if (newQuote) {
        newQuote = {
          ...newQuote,
          status: "approved",
          approvedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      timeline.push(createTimelineEntry("\u5BA1\u6279\u901A\u8FC7", currentUser.name, currentUser.role, data.remark || "\u62A5\u4EF7\u5408\u7406\uFF0C\u540C\u610F"));
      break;
    }
    case "reject_quote": {
      newStatus = "rejected";
      if (newQuote) {
        newQuote = {
          ...newQuote,
          status: "rejected"
        };
      }
      newParts = order.parts.map((p) => ({
        ...p,
        status: "released"
      }));
      order.parts.forEach((p) => {
        const inv = mockPartInventory.find((i) => i.partCode === p.partCode);
        if (inv) {
          inv.locked = Math.max(0, inv.locked - p.quantity);
        }
      });
      updates.rejectReason = data.rejectReason;
      timeline.push(createTimelineEntry("\u5BA1\u6279\u9A73\u56DE", currentUser.name, currentUser.role, data.rejectReason));
      break;
    }
    case "send_confirmation": {
      timeline.push(createTimelineEntry("\u53D1\u9001\u5BA2\u6237\u786E\u8BA4", currentUser.name, currentUser.role, "\u5DF2\u901A\u8FC7\u77ED\u4FE1\u53D1\u9001\u62A5\u4EF7\u786E\u8BA4"));
      break;
    }
    case "customer_confirm": {
      newStatus = "repairing";
      if (!newReceipt) {
        newReceipt = {
          id: `receipt-${id}`,
          workOrderId: id,
          confirmed: true,
          pickedUp: false,
          confirmedAt: (/* @__PURE__ */ new Date()).toISOString(),
          confirmedBy: order.customer.name
        };
      } else {
        newReceipt = {
          ...newReceipt,
          confirmed: true,
          confirmedAt: (/* @__PURE__ */ new Date()).toISOString(),
          confirmedBy: order.customer.name
        };
      }
      timeline.push(createTimelineEntry("\u5BA2\u6237\u786E\u8BA4", currentUser.name, currentUser.role, "\u5BA2\u6237\u786E\u8BA4\u540C\u610F\u7EF4\u4FEE"));
      newProgress.push(createProgressEntry(id, "repairing", "\u5BA2\u6237\u786E\u8BA4\uFF0C\u5F00\u59CB\u7EF4\u4FEE", currentUser.name, currentUser.role));
      break;
    }
    case "customer_reject": {
      newStatus = "customer_rejected";
      newParts = order.parts.map((p) => ({
        ...p,
        status: "released"
      }));
      order.parts.forEach((p) => {
        const inv = mockPartInventory.find((i) => i.partCode === p.partCode);
        if (inv) {
          inv.locked = Math.max(0, inv.locked - p.quantity);
        }
      });
      updates.customerRejectReason = data.rejectReason;
      timeline.push(createTimelineEntry("\u5BA2\u6237\u9A73\u56DE", currentUser.name, currentUser.role, data.rejectReason));
      break;
    }
    case "start_repair": {
      newStatus = "repairing";
      timeline.push(createTimelineEntry("\u5F00\u59CB\u7EF4\u4FEE", currentUser.name, currentUser.role, "\u5F00\u59CB\u6267\u884C\u7EF4\u4FEE\u5DE5\u4F5C"));
      newProgress.push(createProgressEntry(id, "repairing", "\u5F00\u59CB\u6267\u884C\u7EF4\u4FEE\u5DE5\u4F5C", currentUser.name, currentUser.role));
      break;
    }
    case "update_progress": {
      if (data.remark) {
        newProgress.push(createProgressEntry(id, "repairing", data.remark, currentUser.name, currentUser.role));
        timeline.push(createTimelineEntry("\u66F4\u65B0\u8FDB\u5EA6", currentUser.name, currentUser.role, data.remark));
      }
      break;
    }
    case "complete_repair": {
      newStatus = "completed";
      newParts = order.parts.map((p) => ({
        ...p,
        status: "used"
      }));
      order.parts.forEach((p) => {
        const inv = mockPartInventory.find((i) => i.partCode === p.partCode);
        if (inv) {
          inv.stock = Math.max(0, inv.stock - p.quantity);
          inv.locked = Math.max(0, inv.locked - p.quantity);
        }
      });
      timeline.push(createTimelineEntry("\u7EF4\u4FEE\u5B8C\u6210", currentUser.name, currentUser.role, "\u7EF4\u4FEE\u5B8C\u6210\uFF0C\u68C0\u6D4B\u901A\u8FC7"));
      newProgress.push(createProgressEntry(id, "completed", "\u7EF4\u4FEE\u5B8C\u6210\uFF0C\u68C0\u6D4B\u901A\u8FC7", currentUser.name, currentUser.role));
      break;
    }
    case "notify_pickup": {
      timeline.push(createTimelineEntry("\u901A\u77E5\u53D6\u4EF6", currentUser.name, currentUser.role, "\u5DF2\u901A\u8FC7\u77ED\u4FE1\u901A\u77E5\u5BA2\u6237\u53D6\u4EF6"));
      break;
    }
    case "confirm_pickup": {
      newStatus = "picked_up";
      if (!newReceipt) {
        newReceipt = {
          id: `receipt-${id}`,
          workOrderId: id,
          confirmed: true,
          pickedUp: true,
          pickedUpAt: (/* @__PURE__ */ new Date()).toISOString(),
          pickedUpBy: order.customer.name,
          pickupNote: data.pickupNote
        };
      } else {
        newReceipt = {
          ...newReceipt,
          pickedUp: true,
          pickedUpAt: (/* @__PURE__ */ new Date()).toISOString(),
          pickedUpBy: order.customer.name,
          pickupNote: data.pickupNote
        };
      }
      timeline.push(createTimelineEntry("\u5BA2\u6237\u53D6\u4EF6", currentUser.name, currentUser.role, data.pickupNote || "\u5BA2\u6237\u5DF2\u53D6\u8868"));
      break;
    }
    case "satisfaction_survey": {
      if (data.satisfaction !== void 0) {
        if (!newReceipt) {
          newReceipt = {
            id: `receipt-${id}`,
            workOrderId: id,
            confirmed: true,
            pickedUp: true,
            satisfaction: data.satisfaction,
            satisfactionComment: data.satisfactionComment,
            satisfactionAt: (/* @__PURE__ */ new Date()).toISOString()
          };
        } else {
          newReceipt = {
            ...newReceipt,
            satisfaction: data.satisfaction,
            satisfactionComment: data.satisfactionComment,
            satisfactionAt: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
        timeline.push(createTimelineEntry("\u6EE1\u610F\u5EA6\u56DE\u8BBF", currentUser.name, currentUser.role, `\u6EE1\u610F\u5EA6: ${data.satisfaction}\u661F ${data.satisfactionComment || ""}`));
      }
      break;
    }
    case "reopen": {
      newStatus = "pending_review";
      timeline.push(createTimelineEntry("\u91CD\u65B0\u5904\u7406", currentUser.name, currentUser.role, data.remark || "\u5DE5\u5355\u5DF2\u91CD\u65B0\u6253\u5F00"));
      break;
    }
    case "close": {
      timeline.push(createTimelineEntry("\u5173\u95ED\u5DE5\u5355", currentUser.name, currentUser.role, data.remark || "\u5DE5\u5355\u5DF2\u5173\u95ED"));
      break;
    }
    default:
      throw createError({
        statusCode: 400,
        statusMessage: "\u4E0D\u652F\u6301\u7684\u64CD\u4F5C\u7C7B\u578B"
      });
  }
  const updatedOrder = {
    ...order,
    ...updates,
    status: newStatus,
    quote: newQuote,
    parts: newParts,
    progress: newProgress,
    receipt: newReceipt,
    timeline,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  mockWorkOrders[index] = updatedOrder;
  return updatedOrder;
});

export { action_post as default };
//# sourceMappingURL=action.post.mjs.map
