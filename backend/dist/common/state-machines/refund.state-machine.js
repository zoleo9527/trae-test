"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundStateMachine = void 0;
const refund_status_enum_1 = require("../enums/refund-status.enum");
const business_error_1 = require("../errors/business-error");
class RefundStateMachine {
    static canTransition(from, to) {
        const allowedTransitions = this.transitions.get(from) || [];
        return allowedTransitions.includes(to);
    }
    static transition(from, to) {
        if (!this.canTransition(from, to)) {
            throw (0, business_error_1.createError)(business_error_1.ErrorCode.INVALID_STATE_TRANSITION, `无法将退款状态从 ${from} 转换为 ${to}`, { from, to });
        }
    }
    static getAllowedTransitions(status) {
        return this.transitions.get(status) || [];
    }
}
exports.RefundStateMachine = RefundStateMachine;
RefundStateMachine.transitions = new Map([
    [
        refund_status_enum_1.RefundStatus.DRAFT,
        [refund_status_enum_1.RefundStatus.SUBMITTED],
    ],
    [
        refund_status_enum_1.RefundStatus.SUBMITTED,
        [refund_status_enum_1.RefundStatus.UNDER_REVIEW, refund_status_enum_1.RefundStatus.REJECTED],
    ],
    [
        refund_status_enum_1.RefundStatus.UNDER_REVIEW,
        [refund_status_enum_1.RefundStatus.APPROVED, refund_status_enum_1.RefundStatus.REJECTED, refund_status_enum_1.RefundStatus.SUBMITTED],
    ],
    [
        refund_status_enum_1.RefundStatus.APPROVED,
        [refund_status_enum_1.RefundStatus.PROCESSING],
    ],
    [
        refund_status_enum_1.RefundStatus.PROCESSING,
        [refund_status_enum_1.RefundStatus.COMPLETED],
    ],
    [
        refund_status_enum_1.RefundStatus.REJECTED,
        [refund_status_enum_1.RefundStatus.SUBMITTED],
    ],
    [refund_status_enum_1.RefundStatus.COMPLETED, []],
]);
//# sourceMappingURL=refund.state-machine.js.map