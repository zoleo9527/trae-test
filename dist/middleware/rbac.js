"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_NAMES = void 0;
exports.requireRoles = requireRoles;
const types_1 = require("../types");
function requireRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ code: 401, message: '未登录' });
        }
        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ code: 403, message: '权限不足，无法执行此操作' });
        }
        next();
    };
}
exports.ROLE_NAMES = {
    [types_1.Role.SHOWROOM_MANAGER]: '展厅经理',
    [types_1.Role.SALES_CONSULTANT]: '销售顾问',
    [types_1.Role.INSTALL_COORDINATOR]: '安装协调',
};
//# sourceMappingURL=rbac.js.map