"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditEntityType = exports.AuditAction = void 0;
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "create";
    AuditAction["READ"] = "read";
    AuditAction["UPDATE"] = "update";
    AuditAction["DELETE"] = "delete";
    AuditAction["STATUS_CHANGE"] = "status_change";
    AuditAction["SIGN_OFF"] = "sign_off";
    AuditAction["SIGN_OFF_REJECT"] = "sign_off_reject";
    AuditAction["VERSION_CREATE"] = "version_create";
    AuditAction["EXPORT"] = "export";
    AuditAction["LOGIN"] = "login";
    AuditAction["LOGOUT"] = "logout";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AuditEntityType;
(function (AuditEntityType) {
    AuditEntityType["USER"] = "user";
    AuditEntityType["CHANGE_ORDER"] = "change_order";
    AuditEntityType["DAILY_REPORT"] = "daily_report";
    AuditEntityType["DELIVERY"] = "delivery";
    AuditEntityType["SIGN_OFF"] = "sign_off";
})(AuditEntityType || (exports.AuditEntityType = AuditEntityType = {}));
//# sourceMappingURL=audit.enum.js.map