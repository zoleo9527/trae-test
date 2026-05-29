"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = exports.rolePermissions = exports.verifyToken = exports.generateToken = exports.comparePassword = exports.hashPassword = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const enums_1 = require("../types/enums");
const JWT_SECRET = process.env.JWT_SECRET || 'instrument-rental-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const hashPassword = (password) => {
    return bcryptjs_1.default.hashSync(password, 10);
};
exports.hashPassword = hashPassword;
const comparePassword = (password, hash) => {
    return bcryptjs_1.default.compareSync(password, hash);
};
exports.comparePassword = comparePassword;
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
};
exports.verifyToken = verifyToken;
exports.rolePermissions = {
    [enums_1.Role.STORE_OWNER]: [
        'rental:read', 'rental:create', 'rental:return',
        'deposit:read', 'deposit:settle', 'deposit:dispute',
        'damage:read', 'damage:resolve', 'damage:close',
        'maintenance:read', 'maintenance:create', 'maintenance:complete',
        'note:read', 'note:create', 'note:supplement',
        'audit:read',
    ],
    [enums_1.Role.RENTAL_ADVISOR]: [
        'rental:read', 'rental:create', 'rental:return',
        'deposit:read',
        'damage:read', 'damage:create', 'damage:report',
        'maintenance:read',
        'note:read', 'note:create',
    ],
    [enums_1.Role.MAINTENANCE_TECH]: [
        'maintenance:read', 'maintenance:create', 'maintenance:update', 'maintenance:complete',
        'damage:read', 'damage:assess',
        'note:read', 'note:create',
    ],
};
const hasPermission = (role, permission) => {
    return exports.rolePermissions[role]?.includes(permission) || false;
};
exports.hasPermission = hasPermission;
