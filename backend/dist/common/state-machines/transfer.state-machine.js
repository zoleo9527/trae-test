"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferStateMachine = void 0;
const transfer_status_enum_1 = require("../enums/transfer-status.enum");
const business_error_1 = require("../errors/business-error");
class TransferStateMachine {
    static canTransition(from, to) {
        const allowedTransitions = this.transitions.get(from) || [];
        return allowedTransitions.includes(to);
    }
    static transition(from, to) {
        if (!this.canTransition(from, to)) {
            throw (0, business_error_1.createError)(business_error_1.ErrorCode.INVALID_STATE_TRANSITION, `无法将交接状态从 ${from} 转换为 ${to}`, { from, to });
        }
    }
    static getAllowedTransitions(status) {
        return this.transitions.get(status) || [];
    }
}
exports.TransferStateMachine = TransferStateMachine;
TransferStateMachine.transitions = new Map([
    [
        transfer_status_enum_1.TransferStatus.INITIATED,
        [transfer_status_enum_1.TransferStatus.HANDOVER_IN_PROGRESS, transfer_status_enum_1.TransferStatus.REJECTED],
    ],
    [
        transfer_status_enum_1.TransferStatus.HANDOVER_IN_PROGRESS,
        [transfer_status_enum_1.TransferStatus.PENDING_RECEIPT, transfer_status_enum_1.TransferStatus.REJECTED],
    ],
    [
        transfer_status_enum_1.TransferStatus.PENDING_RECEIPT,
        [transfer_status_enum_1.TransferStatus.RECEIVED, transfer_status_enum_1.TransferStatus.REJECTED],
    ],
    [
        transfer_status_enum_1.TransferStatus.RECEIVED,
        [transfer_status_enum_1.TransferStatus.COMPLETED],
    ],
    [
        transfer_status_enum_1.TransferStatus.REJECTED,
        [transfer_status_enum_1.TransferStatus.INITIATED],
    ],
    [transfer_status_enum_1.TransferStatus.COMPLETED, []],
]);
//# sourceMappingURL=transfer.state-machine.js.map