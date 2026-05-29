"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessError = exports.errorHandler = void 0;
const logger_1 = __importDefault(require("../lib/logger"));
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    logger_1.default.error('请求处理错误:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        body: req.body,
        query: req.query,
    });
    let response = {
        success: false,
        error: '服务器内部错误',
        code: 500,
    };
    let statusCode = 500;
    if (err instanceof zod_1.ZodError) {
        statusCode = 400;
        response = {
            success: false,
            error: '请求参数验证失败',
            message: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
            code: 400,
        };
    }
    else if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err;
        if (prismaError.code === 'P2002') {
            statusCode = 409;
            response = {
                success: false,
                error: '数据唯一约束冲突',
                message: `${prismaError.meta?.target?.join(', ') || '字段'}已存在`,
                code: 409,
            };
        }
        else if (prismaError.code === 'P2025') {
            statusCode = 404;
            response = {
                success: false,
                error: '记录不存在',
                code: 404,
            };
        }
    }
    else if (err.name === 'BusinessError') {
        const businessError = err;
        statusCode = businessError.statusCode || 400;
        response = {
            success: false,
            error: err.message,
            code: businessError.code || 400,
            ...(businessError.details && { details: businessError.details }),
        };
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
class BusinessError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode = 400, code = 400, details) {
        super(message);
        this.name = 'BusinessError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}
exports.BusinessError = BusinessError;
