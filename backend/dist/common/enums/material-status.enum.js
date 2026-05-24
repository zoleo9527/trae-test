"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialType = exports.MaterialStatus = void 0;
var MaterialStatus;
(function (MaterialStatus) {
    MaterialStatus["DRAFT"] = "draft";
    MaterialStatus["SUBMITTED"] = "submitted";
    MaterialStatus["UNDER_REVIEW"] = "under_review";
    MaterialStatus["NEEDS_REVISION"] = "needs_revision";
    MaterialStatus["APPROVED"] = "approved";
    MaterialStatus["EXPIRED"] = "expired";
})(MaterialStatus || (exports.MaterialStatus = MaterialStatus = {}));
var MaterialType;
(function (MaterialType) {
    MaterialType["PERSONAL"] = "personal";
    MaterialType["ACADEMIC"] = "academic";
    MaterialType["FINANCIAL"] = "financial";
    MaterialType["LANGUAGE"] = "language";
    MaterialType["VISA"] = "visa";
    MaterialType["OTHER"] = "other";
})(MaterialType || (exports.MaterialType = MaterialType = {}));
//# sourceMappingURL=material-status.enum.js.map