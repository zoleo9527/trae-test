"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveIdempotentResponse = exports.idempotencyMiddleware = void 0;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const jsonUtils_1 = require("../lib/jsonUtils");
const idempotencyMiddleware = async (req, res, next) => {
    const idempotencyKey = req.headers['x-idempotency-key'];
    if (!idempotencyKey) {
        return next();
    }
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: '用户未认证',
            code: 401,
        });
    }
    const requestHash = crypto_1.default
        .createHash('sha256')
        .update(JSON.stringify({ body: req.body, method: req.method, path: req.path }))
        .digest('hex');
    try {
        const existingKey = await prisma_1.default.idempotencyKey.findUnique({
            where: { key: idempotencyKey },
        });
        if (existingKey) {
            if (existingKey.requestHash !== requestHash) {
                return res.status(422).json({
                    success: false,
                    error: '幂等键与请求内容不匹配',
                    code: 422,
                });
            }
            if (existingKey.responseBody) {
                return res.status(200).json((0, jsonUtils_1.fromJsonString)(existingKey.responseBody));
            }
            const keyAge = Date.now() - new Date(existingKey.createdAt).getTime();
            if (keyAge < 60000) {
                return res.status(409).json({
                    success: false,
                    error: '该请求正在处理中，请稍后重试',
                    code: 409,
                });
            }
            await prisma_1.default.idempotencyKey.update({
                where: { key: idempotencyKey },
                data: {
                    requestHash,
                    responseBody: null,
                    createdAt: new Date(),
                },
            });
            req.idempotencyKey = idempotencyKey;
            return next();
        }
        await prisma_1.default.idempotencyKey.create({
            data: {
                key: idempotencyKey,
                requestHash,
            },
        });
        req.idempotencyKey = idempotencyKey;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.idempotencyMiddleware = idempotencyMiddleware;
const saveIdempotentResponse = async (idempotencyKey, responseBody) => {
    try {
        await prisma_1.default.idempotencyKey.update({
            where: { key: idempotencyKey },
            data: { responseBody: (0, jsonUtils_1.toJsonString)(responseBody) },
        });
    }
    catch (error) {
        console.error('保存幂等响应失败:', error);
    }
};
exports.saveIdempotentResponse = saveIdempotentResponse;
