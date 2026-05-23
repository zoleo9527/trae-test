"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleLabels = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["STATION_MASTER"] = "station_master";
    UserRole["INSPECTION_ENGINEER"] = "inspection_engineer";
    UserRole["OPERATION_STAFF"] = "operation_staff";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
exports.RoleLabels = {
    [UserRole.STATION_MASTER]: '站长',
    [UserRole.INSPECTION_ENGINEER]: '巡检工程师',
    [UserRole.OPERATION_STAFF]: '运维内勤',
    [UserRole.ADMIN]: '管理员',
};
//# sourceMappingURL=role.enum.js.map