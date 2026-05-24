"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrderStatus = void 0;
var WorkOrderStatus;
(function (WorkOrderStatus) {
    WorkOrderStatus["PENDING"] = "pending";
    WorkOrderStatus["IN_PROGRESS"] = "in_progress";
    WorkOrderStatus["WAITING_MATERIAL"] = "waiting_material";
    WorkOrderStatus["WAITING_APPROVAL"] = "waiting_approval";
    WorkOrderStatus["TRANSFERRING"] = "transferring";
    WorkOrderStatus["REFUND_NEGOTIATING"] = "refund_negotiating";
    WorkOrderStatus["COMPLETED"] = "completed";
    WorkOrderStatus["CANCELLED"] = "cancelled";
    WorkOrderStatus["REFUNDED"] = "refunded";
})(WorkOrderStatus || (exports.WorkOrderStatus = WorkOrderStatus = {}));
//# sourceMappingURL=work-order-status.enum.js.map