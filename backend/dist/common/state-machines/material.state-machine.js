"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialStateMachine = void 0;
const material_status_enum_1 = require("../enums/material-status.enum");
const business_error_1 = require("../errors/business-error");
class MaterialStateMachine {
    static canTransition(from, to) {
        const allowedTransitions = this.transitions.get(from) || [];
        return allowedTransitions.includes(to);
    }
    static transition(from, to) {
        if (!this.canTransition(from, to)) {
            throw (0, business_error_1.createError)(business_error_1.ErrorCode.INVALID_STATE_TRANSITION, `无法将材料状态从 ${from} 转换为 ${to}`, { from, to });
        }
    }
    static getAllowedTransitions(status) {
        return this.transitions.get(status) || [];
    }
}
exports.MaterialStateMachine = MaterialStateMachine;
MaterialStateMachine.transitions = new Map([
    [
        material_status_enum_1.MaterialStatus.DRAFT,
        [material_status_enum_1.MaterialStatus.SUBMITTED],
    ],
    [
        material_status_enum_1.MaterialStatus.SUBMITTED,
        [material_status_enum_1.MaterialStatus.UNDER_REVIEW, material_status_enum_1.MaterialStatus.NEEDS_REVISION],
    ],
    [
        material_status_enum_1.MaterialStatus.UNDER_REVIEW,
        [material_status_enum_1.MaterialStatus.APPROVED, material_status_enum_1.MaterialStatus.NEEDS_REVISION],
    ],
    [
        material_status_enum_1.MaterialStatus.NEEDS_REVISION,
        [material_status_enum_1.MaterialStatus.SUBMITTED],
    ],
    [material_status_enum_1.MaterialStatus.APPROVED, [material_status_enum_1.MaterialStatus.EXPIRED]],
    [material_status_enum_1.MaterialStatus.EXPIRED, []],
]);
//# sourceMappingURL=material.state-machine.js.map