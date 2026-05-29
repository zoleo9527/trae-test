"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceStatus = exports.EntityType = exports.AuditAction = exports.DamageSeverity = exports.DamageClaimStatus = exports.DepositStatus = exports.RentalStatus = exports.InstrumentStatus = exports.Role = void 0;
var Role;
(function (Role) {
    Role["STORE_OWNER"] = "STORE_OWNER";
    Role["RENTAL_ADVISOR"] = "RENTAL_ADVISOR";
    Role["MAINTENANCE_TECH"] = "MAINTENANCE_TECH";
})(Role || (exports.Role = Role = {}));
var InstrumentStatus;
(function (InstrumentStatus) {
    InstrumentStatus["AVAILABLE"] = "AVAILABLE";
    InstrumentStatus["RENTED"] = "RENTED";
    InstrumentStatus["IN_MAINTENANCE"] = "IN_MAINTENANCE";
    InstrumentStatus["DAMAGED"] = "DAMAGED";
    InstrumentStatus["RETIRED"] = "RETIRED";
})(InstrumentStatus || (exports.InstrumentStatus = InstrumentStatus = {}));
var RentalStatus;
(function (RentalStatus) {
    RentalStatus["ACTIVE"] = "ACTIVE";
    RentalStatus["RETURNED"] = "RETURNED";
    RentalStatus["SETTLED"] = "SETTLED";
    RentalStatus["OVERDUE"] = "OVERDUE";
})(RentalStatus || (exports.RentalStatus = RentalStatus = {}));
var DepositStatus;
(function (DepositStatus) {
    DepositStatus["HELD"] = "HELD";
    DepositStatus["REFUNDING"] = "REFUNDING";
    DepositStatus["REFUNDED"] = "REFUNDED";
    DepositStatus["PARTIAL_REFUNDED"] = "PARTIAL_REFUNDED";
    DepositStatus["DEDUCTED"] = "DEDUCTED";
    DepositStatus["DISPUTED"] = "DISPUTED";
})(DepositStatus || (exports.DepositStatus = DepositStatus = {}));
var DamageClaimStatus;
(function (DamageClaimStatus) {
    DamageClaimStatus["PENDING"] = "PENDING";
    DamageClaimStatus["CONFIRMED"] = "CONFIRMED";
    DamageClaimStatus["DISPUTED"] = "DISPUTED";
    DamageClaimStatus["REJECTED"] = "REJECTED";
    DamageClaimStatus["RESOLVED"] = "RESOLVED";
    DamageClaimStatus["CLOSED"] = "CLOSED";
})(DamageClaimStatus || (exports.DamageClaimStatus = DamageClaimStatus = {}));
var DamageSeverity;
(function (DamageSeverity) {
    DamageSeverity["MINOR"] = "MINOR";
    DamageSeverity["MODERATE"] = "MODERATE";
    DamageSeverity["MAJOR"] = "MAJOR";
    DamageSeverity["TOTAL"] = "TOTAL";
})(DamageSeverity || (exports.DamageSeverity = DamageSeverity = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["RENTAL_CREATE"] = "RENTAL_CREATE";
    AuditAction["RENTAL_RETURN"] = "RENTAL_RETURN";
    AuditAction["RENTAL_EXTEND"] = "RENTAL_EXTEND";
    AuditAction["RENTAL_CANCEL"] = "RENTAL_CANCEL";
    AuditAction["DEPOSIT_SETTLE"] = "DEPOSIT_SETTLE";
    AuditAction["DEPOSIT_REFUND"] = "DEPOSIT_REFUND";
    AuditAction["DEPOSIT_DEDUCT"] = "DEPOSIT_DEDUCT";
    AuditAction["DEPOSIT_PARTIAL_REFUND"] = "DEPOSIT_PARTIAL_REFUND";
    AuditAction["DEPOSIT_DISPUTE"] = "DEPOSIT_DISPUTE";
    AuditAction["DAMAGE_REPORT"] = "DAMAGE_REPORT";
    AuditAction["DAMAGE_CONFIRM"] = "DAMAGE_CONFIRM";
    AuditAction["DAMAGE_DISPUTE"] = "DAMAGE_DISPUTE";
    AuditAction["DAMAGE_REJECT"] = "DAMAGE_REJECT";
    AuditAction["DAMAGE_RESOLVE"] = "DAMAGE_RESOLVE";
    AuditAction["DAMAGE_CLOSE"] = "DAMAGE_CLOSE";
    AuditAction["MAINTENANCE_CREATE"] = "MAINTENANCE_CREATE";
    AuditAction["MAINTENANCE_COMPLETE"] = "MAINTENANCE_COMPLETE";
    AuditAction["MAINTENANCE_UPDATE"] = "MAINTENANCE_UPDATE";
    AuditAction["NOTE_ADD"] = "NOTE_ADD";
    AuditAction["NOTE_SUPPLEMENT"] = "NOTE_SUPPLEMENT";
    AuditAction["STATUS_CHANGE"] = "STATUS_CHANGE";
    AuditAction["DATA_EDIT"] = "DATA_EDIT";
    AuditAction["DATA_DELETE"] = "DATA_DELETE";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var EntityType;
(function (EntityType) {
    EntityType["RENTAL"] = "RENTAL";
    EntityType["DEPOSIT"] = "DEPOSIT";
    EntityType["DAMAGE_CLAIM"] = "DAMAGE_CLAIM";
    EntityType["MAINTENANCE"] = "MAINTENANCE";
    EntityType["INSTRUMENT"] = "INSTRUMENT";
})(EntityType || (exports.EntityType = EntityType = {}));
var MaintenanceStatus;
(function (MaintenanceStatus) {
    MaintenanceStatus["IN_PROGRESS"] = "IN_PROGRESS";
    MaintenanceStatus["COMPLETED"] = "COMPLETED";
})(MaintenanceStatus || (exports.MaintenanceStatus = MaintenanceStatus = {}));
