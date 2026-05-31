"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignOffAction = exports.SignOffType = exports.SignOffStatus = void 0;
var SignOffStatus;
(function (SignOffStatus) {
    SignOffStatus["PENDING"] = "pending";
    SignOffStatus["SIGNED"] = "signed";
    SignOffStatus["REJECTED"] = "rejected";
    SignOffStatus["EXPIRED"] = "expired";
})(SignOffStatus || (exports.SignOffStatus = SignOffStatus = {}));
var SignOffType;
(function (SignOffType) {
    SignOffType["CHANGE_ORDER"] = "change_order";
    SignOffType["DAILY_REPORT"] = "daily_report";
    SignOffType["DELIVERY"] = "delivery";
    SignOffType["QUALITY_CHECK"] = "quality_check";
    SignOffType["SAFETY_CHECK"] = "safety_check";
})(SignOffType || (exports.SignOffType = SignOffType = {}));
var SignOffAction;
(function (SignOffAction) {
    SignOffAction["SIGN"] = "sign";
    SignOffAction["REJECT"] = "reject";
    SignOffAction["REQUEST_REVIEW"] = "request_review";
})(SignOffAction || (exports.SignOffAction = SignOffAction = {}));
//# sourceMappingURL=sign-off.enum.js.map