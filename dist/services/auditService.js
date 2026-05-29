"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntityAuditTrail = exports.getAuditLogs = exports.createAuditLog = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const idempotency_1 = require("../middleware/idempotency");
const jsonUtils_1 = require("../lib/jsonUtils");
const createAuditLog = async (params) => {
    const { idempotencyKey, responseBody, ...logData } = params;
    const auditLog = await prisma_1.default.auditLog.create({
        data: {
            ...logData,
            oldValue: (0, jsonUtils_1.toJsonString)(logData.oldValue),
            newValue: (0, jsonUtils_1.toJsonString)(logData.newValue),
            changes: (0, jsonUtils_1.toJsonString)(logData.changes),
            responseBody: (0, jsonUtils_1.toJsonString)(responseBody),
            idempotencyKey,
        },
    });
    if (idempotencyKey && responseBody) {
        await (0, idempotency_1.saveIdempotentResponse)(idempotencyKey, responseBody);
    }
    return auditLog;
};
exports.createAuditLog = createAuditLog;
const getAuditLogs = async (entityType, entityId, action, operatorId, page = 1, pageSize = 20) => {
    const where = {};
    if (entityType)
        where.entityType = entityType;
    if (entityId)
        where.entityId = entityId;
    if (action)
        where.action = action;
    if (operatorId)
        where.operatorId = operatorId;
    const [total, items] = await Promise.all([
        prisma_1.default.auditLog.count({ where }),
        prisma_1.default.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
    ]);
    const deserializedItems = items.map((log) => ({
        ...log,
        oldValue: (0, jsonUtils_1.fromJsonString)(log.oldValue),
        newValue: (0, jsonUtils_1.fromJsonString)(log.newValue),
        changes: (0, jsonUtils_1.fromJsonString)(log.changes),
        responseBody: (0, jsonUtils_1.fromJsonString)(log.responseBody),
    }));
    return {
        items: deserializedItems,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
};
exports.getAuditLogs = getAuditLogs;
const getEntityAuditTrail = async (entityType, entityId) => {
    const logs = await prisma_1.default.auditLog.findMany({
        where: { entityType, entityId },
        orderBy: { createdAt: 'asc' },
        include: {
            operator: {
                select: { id: true, name: true, role: true },
            },
        },
    });
    return logs.map((log) => ({
        ...log,
        oldValue: (0, jsonUtils_1.fromJsonString)(log.oldValue),
        newValue: (0, jsonUtils_1.fromJsonString)(log.newValue),
        changes: (0, jsonUtils_1.fromJsonString)(log.changes),
        responseBody: (0, jsonUtils_1.fromJsonString)(log.responseBody),
    }));
};
exports.getEntityAuditTrail = getEntityAuditTrail;
