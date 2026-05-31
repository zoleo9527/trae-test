"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeOrderStatusFlow = exports.ChangeOrderType = exports.ChangeOrderStatus = void 0;
var ChangeOrderStatus;
(function (ChangeOrderStatus) {
    ChangeOrderStatus["DRAFT"] = "draft";
    ChangeOrderStatus["SUBMITTED"] = "submitted";
    ChangeOrderStatus["UNDER_REVIEW"] = "under_review";
    ChangeOrderStatus["APPROVED"] = "approved";
    ChangeOrderStatus["REJECTED"] = "rejected";
    ChangeOrderStatus["IN_PROGRESS"] = "in_progress";
    ChangeOrderStatus["COMPLETED"] = "completed";
    ChangeOrderStatus["SETTLED"] = "settled";
    ChangeOrderStatus["CANCELLED"] = "cancelled";
})(ChangeOrderStatus || (exports.ChangeOrderStatus = ChangeOrderStatus = {}));
var ChangeOrderType;
(function (ChangeOrderType) {
    ChangeOrderType["DESIGN_CHANGE"] = "design_change";
    ChangeOrderType["MATERIAL_CHANGE"] = "material_change";
    ChangeOrderType["CONSTRUCTION_METHOD"] = "construction_method";
    ChangeOrderType["SCOPE_CHANGE"] = "scope_change";
    ChangeOrderType["SITE_CONDITION"] = "site_condition";
    ChangeOrderType["OTHER"] = "other";
})(ChangeOrderType || (exports.ChangeOrderType = ChangeOrderType = {}));
exports.ChangeOrderStatusFlow = {
    [ChangeOrderStatus.DRAFT]: [ChangeOrderStatus.SUBMITTED, ChangeOrderStatus.CANCELLED],
    [ChangeOrderStatus.SUBMITTED]: [ChangeOrderStatus.UNDER_REVIEW, ChangeOrderStatus.REJECTED],
    [ChangeOrderStatus.UNDER_REVIEW]: [ChangeOrderStatus.APPROVED, ChangeOrderStatus.REJECTED, ChangeOrderStatus.SUBMITTED],
    [ChangeOrderStatus.APPROVED]: [ChangeOrderStatus.IN_PROGRESS, ChangeOrderStatus.CANCELLED],
    [ChangeOrderStatus.REJECTED]: [ChangeOrderStatus.SUBMITTED, ChangeOrderStatus.CANCELLED],
    [ChangeOrderStatus.IN_PROGRESS]: [ChangeOrderStatus.COMPLETED],
    [ChangeOrderStatus.COMPLETED]: [ChangeOrderStatus.SETTLED],
    [ChangeOrderStatus.SETTLED]: [],
    [ChangeOrderStatus.CANCELLED]: [],
};
//# sourceMappingURL=change-order-status.enum.js.map