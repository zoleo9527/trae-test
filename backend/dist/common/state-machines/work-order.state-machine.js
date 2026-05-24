"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrderStateMachine = void 0;
const work_order_status_enum_1 = require("../enums/work-order-status.enum");
const business_error_1 = require("../errors/business-error");
class WorkOrderStateMachine {
    static canTransition(from, to) {
        const allowedTransitions = this.transitions.get(from) || [];
        return allowedTransitions.includes(to);
    }
    static transition(from, to) {
        if (!this.canTransition(from, to)) {
            throw (0, business_error_1.createError)(business_error_1.ErrorCode.INVALID_STATE_TRANSITION, `无法将工单状态从 ${from} 转换为 ${to}`, { from, to });
        }
    }
    static getAllowedTransitions(status) {
        return this.transitions.get(status) || [];
    }
}
exports.WorkOrderStateMachine = WorkOrderStateMachine;
WorkOrderStateMachine.transitions = new Map([
    [
        work_order_status_enum_1.WorkOrderStatus.PENDING,
        [work_order_status_enum_1.WorkOrderStatus.IN_PROGRESS, work_order_status_enum_1.WorkOrderStatus.CANCELLED],
    ],
    [
        work_order_status_enum_1.WorkOrderStatus.IN_PROGRESS,
        [
            work_order_status_enum_1.WorkOrderStatus.WAITING_MATERIAL,
            work_order_status_enum_1.WorkOrderStatus.WAITING_APPROVAL,
            work_order_status_enum_1.WorkOrderStatus.TRANSFERRING,
            work_order_status_enum_1.WorkOrderStatus.REFUND_NEGOTIATING,
            work_order_status_enum_1.WorkOrderStatus.COMPLETED,
            work_order_status_enum_1.WorkOrderStatus.CANCELLED,
        ],
    ],
    [
        work_order_status_enum_1.WorkOrderStatus.WAITING_MATERIAL,
        [work_order_status_enum_1.WorkOrderStatus.IN_PROGRESS, work_order_status_enum_1.WorkOrderStatus.CANCELLED],
    ],
    [
        work_order_status_enum_1.WorkOrderStatus.WAITING_APPROVAL,
        [work_order_status_enum_1.WorkOrderStatus.IN_PROGRESS, work_order_status_enum_1.WorkOrderStatus.CANCELLED, work_order_status_enum_1.WorkOrderStatus.COMPLETED],
    ],
    [
        work_order_status_enum_1.WorkOrderStatus.TRANSFERRING,
        [work_order_status_enum_1.WorkOrderStatus.IN_PROGRESS, work_order_status_enum_1.WorkOrderStatus.CANCELLED],
    ],
    [
        work_order_status_enum_1.WorkOrderStatus.REFUND_NEGOTIATING,
        [work_order_status_enum_1.WorkOrderStatus.IN_PROGRESS, work_order_status_enum_1.WorkOrderStatus.REFUNDED, work_order_status_enum_1.WorkOrderStatus.CANCELLED],
    ],
    [work_order_status_enum_1.WorkOrderStatus.COMPLETED, []],
    [work_order_status_enum_1.WorkOrderStatus.CANCELLED, []],
    [work_order_status_enum_1.WorkOrderStatus.REFUNDED, []],
]);
//# sourceMappingURL=work-order.state-machine.js.map