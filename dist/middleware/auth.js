"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = exports.requirePermission = exports.authenticate = void 0;
const auth_1 = require("../lib/auth");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: '未提供认证令牌',
            code: 401,
        });
    }
    const token = authHeader.substring(7);
    const payload = (0, auth_1.verifyToken)(token);
    if (!payload) {
        return res.status(401).json({
            success: false,
            error: '认证令牌无效或已过期',
            code: 401,
        });
    }
    req.user = {
        id: payload.id,
        username: payload.username,
        name: payload.name,
        role: payload.role,
    };
    next();
};
exports.authenticate = authenticate;
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: '用户未认证',
                code: 401,
            });
        }
        if (!(0, auth_1.hasPermission)(req.user.role, permission)) {
            return res.status(403).json({
                success: false,
                error: `权限不足，需要: ${permission}`,
                code: 403,
            });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
const requireRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: '用户未认证',
                code: 401,
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `需要以下角色之一: ${roles.join(', ')}`,
                code: 403,
            });
        }
        next();
    };
};
exports.requireRoles = requireRoles;
