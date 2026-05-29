"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvidenceChain = exports.getDamageClaimDetail = exports.getDamageClaimList = exports.closeDamageClaim = exports.confirmDamageClaim = exports.resolveDispute = exports.rejectDispute = exports.disputeDamageClaim = exports.createDamageClaim = void 0;
const enums_1 = require("../types/enums");
const prisma_1 = __importDefault(require("../lib/prisma"));
const utils_1 = require("../lib/utils");
const errorHandler_1 = require("../middleware/errorHandler");
const auditService_1 = require("./auditService");
const noteService_1 = require("./noteService");
const jsonUtils_1 = require("../lib/jsonUtils");
const createDamageClaim = async (params) => {
    const { rentalId, instrumentId, severity, description, estimatedCost, evidenceUrls, operatorId, operatorName, operatorRole, idempotencyKey, } = params;
    return prisma_1.default.$transaction(async (tx) => {
        const rental = await tx.rental.findUnique({
            where: { id: rentalId },
            include: { customer: true },
        });
        if (!rental) {
            throw new errorHandler_1.BusinessError('租赁单不存在', 404, 404);
        }
        const claimNo = (0, utils_1.generateOrderNo)('DM');
        const damageClaim = await tx.damageClaim.create({
            data: {
                claimNo,
                rentalId,
                instrumentId,
                severity,
                description,
                estimatedCost,
                evidenceUrls: (0, jsonUtils_1.toEvidenceUrlsString)(evidenceUrls),
                createdBy: operatorId,
            },
            include: {
                instrument: true,
                rental: { include: { customer: true } },
                creator: { select: { id: true, name: true, role: true } },
            },
        });
        const response = {
            success: true,
            data: damageClaim,
            message: '损坏申诉创建成功',
        };
        await (0, auditService_1.createAuditLog)({
            tx,
            action: enums_1.AuditAction.DAMAGE_REPORT,
            entityType: enums_1.EntityType.DAMAGE_CLAIM,
            entityId: damageClaim.id,
            newValue: damageClaim,
            remark: `损坏申诉创建，单号${claimNo}，${severity}损坏，预估费用${estimatedCost}元`,
            operatorId,
            operatorName,
            operatorRole,
            idempotencyKey,
            responseBody: response,
        });
        return damageClaim;
    }, { maxWait: 10000, timeout: 30000 });
};
exports.createDamageClaim = createDamageClaim;
const disputeDamageClaim = async (params) => {
    const { claimId, disputeReason, operatorId, operatorName, operatorRole, idempotencyKey, } = params;
    return prisma_1.default.$transaction(async (tx) => {
        const oldClaim = await tx.damageClaim.findUnique({
            where: { id: claimId },
        });
        if (!oldClaim) {
            throw new errorHandler_1.BusinessError('损坏申诉不存在', 404, 404);
        }
        if (oldClaim.status !== enums_1.DamageClaimStatus.PENDING && oldClaim.status !== enums_1.DamageClaimStatus.CONFIRMED) {
            throw new errorHandler_1.BusinessError(`当前状态${oldClaim.status}不允许申诉`, 400, 400);
        }
        const updatedClaim = await tx.damageClaim.update({
            where: { id: claimId },
            data: {
                status: enums_1.DamageClaimStatus.DISPUTED,
                disputeReason,
            },
        });
        const changes = (0, utils_1.compareObjects)({ status: oldClaim.status }, { status: updatedClaim.status });
        const response = {
            success: true,
            data: updatedClaim,
            message: '客户申诉已提交',
        };
        await (0, auditService_1.createAuditLog)({
            tx,
            action: enums_1.AuditAction.DAMAGE_DISPUTE,
            entityType: enums_1.EntityType.DAMAGE_CLAIM,
            entityId: claimId,
            oldValue: oldClaim,
            newValue: updatedClaim,
            changes,
            remark: `客户对损坏判定提出申诉，单号${oldClaim.claimNo}，申诉理由：${disputeReason}`,
            operatorId,
            operatorName,
            operatorRole,
            idempotencyKey,
            responseBody: response,
        });
        return updatedClaim;
    }, { maxWait: 10000, timeout: 30000 });
};
exports.disputeDamageClaim = disputeDamageClaim;
const rejectDispute = async (params) => {
    const { claimId, rejectReason, finalCost, operatorId, operatorName, operatorRole, idempotencyKey, } = params;
    return prisma_1.default.$transaction(async (tx) => {
        const oldClaim = await tx.damageClaim.findUnique({
            where: { id: claimId },
        });
        if (!oldClaim) {
            throw new errorHandler_1.BusinessError('损坏申诉不存在', 404, 404);
        }
        if (oldClaim.status !== enums_1.DamageClaimStatus.DISPUTED) {
            throw new errorHandler_1.BusinessError(`当前状态${oldClaim.status}不允许驳回`, 400, 400);
        }
        const updatedClaim = await tx.damageClaim.update({
            where: { id: claimId },
            data: {
                status: enums_1.DamageClaimStatus.REJECTED,
                rejectReason,
                finalCost,
                handledBy: operatorId,
            },
            include: {
                handler: { select: { id: true, name: true, role: true } },
            },
        });
        const changes = (0, utils_1.compareObjects)({ status: oldClaim.status, finalCost: oldClaim.finalCost }, { status: updatedClaim.status, finalCost });
        const response = {
            success: true,
            data: updatedClaim,
            message: '申诉已驳回',
        };
        await (0, auditService_1.createAuditLog)({
            tx,
            action: enums_1.AuditAction.DAMAGE_REJECT,
            entityType: enums_1.EntityType.DAMAGE_CLAIM,
            entityId: claimId,
            oldValue: oldClaim,
            newValue: updatedClaim,
            changes,
            remark: `驳回客户申诉，单号${oldClaim.claimNo}，驳回原因：${rejectReason}，最终赔偿${finalCost}元`,
            operatorId,
            operatorName,
            operatorRole,
            idempotencyKey,
            responseBody: response,
        });
        return updatedClaim;
    }, { maxWait: 10000, timeout: 30000 });
};
exports.rejectDispute = rejectDispute;
const resolveDispute = async (params) => {
    const { claimId, resolvedReason, finalCost, operatorId, operatorName, operatorRole, idempotencyKey, } = params;
    return prisma_1.default.$transaction(async (tx) => {
        const oldClaim = await tx.damageClaim.findUnique({
            where: { id: claimId },
        });
        if (!oldClaim) {
            throw new errorHandler_1.BusinessError('损坏申诉不存在', 404, 404);
        }
        if (oldClaim.status !== enums_1.DamageClaimStatus.DISPUTED) {
            throw new errorHandler_1.BusinessError(`当前状态${oldClaim.status}不允许重新判定`, 400, 400);
        }
        const updatedClaim = await tx.damageClaim.update({
            where: { id: claimId },
            data: {
                status: enums_1.DamageClaimStatus.RESOLVED,
                resolvedReason,
                finalCost,
                handledBy: operatorId,
            },
            include: {
                handler: { select: { id: true, name: true, role: true } },
            },
        });
        const changes = (0, utils_1.compareObjects)({
            status: oldClaim.status,
            finalCost: oldClaim.finalCost,
        }, {
            status: updatedClaim.status,
            finalCost,
        });
        const response = {
            success: true,
            data: updatedClaim,
            message: '申诉已通过，重新判定完成',
        };
        await (0, auditService_1.createAuditLog)({
            tx,
            action: enums_1.AuditAction.DAMAGE_RESOLVE,
            entityType: enums_1.EntityType.DAMAGE_CLAIM,
            entityId: claimId,
            oldValue: oldClaim,
            newValue: updatedClaim,
            changes,
            remark: `通过客户申诉并重新判定，单号${oldClaim.claimNo}，原因：${resolvedReason}，最终赔偿${finalCost}元`,
            operatorId,
            operatorName,
            operatorRole,
            idempotencyKey,
            responseBody: response,
        });
        return updatedClaim;
    }, { maxWait: 10000, timeout: 30000 });
};
exports.resolveDispute = resolveDispute;
const confirmDamageClaim = async (claimId, operatorId, operatorName, operatorRole, idempotencyKey) => {
    return prisma_1.default.$transaction(async (tx) => {
        const oldClaim = await tx.damageClaim.findUnique({
            where: { id: claimId },
        });
        if (!oldClaim) {
            throw new errorHandler_1.BusinessError('损坏申诉不存在', 404, 404);
        }
        if (oldClaim.status !== enums_1.DamageClaimStatus.PENDING) {
            throw new errorHandler_1.BusinessError(`当前状态${oldClaim.status}不允许确认`, 400, 400);
        }
        const updatedClaim = await tx.damageClaim.update({
            where: { id: claimId },
            data: {
                status: enums_1.DamageClaimStatus.CONFIRMED,
                finalCost: oldClaim.estimatedCost,
                handledBy: operatorId,
            },
        });
        const response = {
            success: true,
            data: updatedClaim,
            message: '损坏判定已确认，客户无异议',
        };
        await (0, auditService_1.createAuditLog)({
            tx,
            action: enums_1.AuditAction.DAMAGE_CONFIRM,
            entityType: enums_1.EntityType.DAMAGE_CLAIM,
            entityId: claimId,
            oldValue: oldClaim,
            newValue: updatedClaim,
            remark: `确认损坏判定，单号${oldClaim.claimNo}，客户无异议`,
            operatorId,
            operatorName,
            operatorRole,
            idempotencyKey,
            responseBody: response,
        });
        return updatedClaim;
    }, { maxWait: 10000, timeout: 30000 });
};
exports.confirmDamageClaim = confirmDamageClaim;
const closeDamageClaim = async (claimId, operatorId, operatorName, operatorRole, idempotencyKey) => {
    return prisma_1.default.$transaction(async (tx) => {
        const oldClaim = await tx.damageClaim.findUnique({
            where: { id: claimId },
        });
        if (!oldClaim) {
            throw new errorHandler_1.BusinessError('损坏申诉不存在', 404, 404);
        }
        if (![enums_1.DamageClaimStatus.CONFIRMED, enums_1.DamageClaimStatus.REJECTED, enums_1.DamageClaimStatus.RESOLVED].includes(oldClaim.status)) {
            throw new errorHandler_1.BusinessError(`当前状态${oldClaim.status}不允许结案`, 400, 400);
        }
        const updatedClaim = await tx.damageClaim.update({
            where: { id: claimId },
            data: {
                status: enums_1.DamageClaimStatus.CLOSED,
            },
        });
        const response = {
            success: true,
            data: updatedClaim,
            message: '损坏申诉已结案',
        };
        await (0, auditService_1.createAuditLog)({
            tx,
            action: enums_1.AuditAction.DAMAGE_CLOSE,
            entityType: enums_1.EntityType.DAMAGE_CLAIM,
            entityId: claimId,
            oldValue: oldClaim,
            newValue: updatedClaim,
            remark: `损坏申诉结案，单号${oldClaim.claimNo}`,
            operatorId,
            operatorName,
            operatorRole,
            idempotencyKey,
            responseBody: response,
        });
        return updatedClaim;
    }, { maxWait: 10000, timeout: 30000 });
};
exports.closeDamageClaim = closeDamageClaim;
const getDamageClaimList = async (status, rentalId, instrumentId, page = 1, pageSize = 20) => {
    const where = {};
    if (status)
        where.status = status;
    if (rentalId)
        where.rentalId = rentalId;
    if (instrumentId)
        where.instrumentId = instrumentId;
    const [total, items] = await Promise.all([
        prisma_1.default.damageClaim.count({ where }),
        prisma_1.default.damageClaim.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                instrument: true,
                rental: { include: { customer: true } },
                maintenance: true,
                creator: { select: { id: true, name: true, role: true } },
                handler: { select: { id: true, name: true, role: true } },
            },
        }),
    ]);
    const itemsWithEvidence = items.map((item) => ({
        ...item,
        evidenceUrls: (0, jsonUtils_1.parseEvidenceUrls)(item.evidenceUrls),
    }));
    return {
        items: itemsWithEvidence,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
};
exports.getDamageClaimList = getDamageClaimList;
const getDamageClaimDetail = async (id) => {
    const claim = await prisma_1.default.damageClaim.findUnique({
        where: { id },
        include: {
            instrument: true,
            rental: { include: { customer: true, deposit: true } },
            maintenance: true,
            creator: { select: { id: true, name: true, role: true } },
            handler: { select: { id: true, name: true, role: true } },
        },
    });
    if (!claim) {
        const auditTrail = await (0, auditService_1.getEntityAuditTrail)(enums_1.EntityType.DAMAGE_CLAIM, id);
        throw new errorHandler_1.BusinessError(`损坏申诉不存在，ID: ${id}`, 404, 404, { auditTrail, requestedId: id });
    }
    const notes = await (0, noteService_1.getEntityNotes)(enums_1.EntityType.DAMAGE_CLAIM, id);
    const auditLogs = await (0, auditService_1.getEntityAuditTrail)(enums_1.EntityType.DAMAGE_CLAIM, id);
    return {
        ...claim,
        evidenceUrls: (0, jsonUtils_1.parseEvidenceUrls)(claim.evidenceUrls),
        notes,
        auditLogs,
    };
};
exports.getDamageClaimDetail = getDamageClaimDetail;
const getEvidenceChain = async (claimId) => {
    const claim = await prisma_1.default.damageClaim.findUnique({
        where: { id: claimId },
        select: {
            evidenceUrls: true,
            description: true,
            severity: true,
            estimatedCost: true,
            disputeReason: true,
            rejectReason: true,
            resolvedReason: true,
        },
    });
    if (!claim) {
        throw new errorHandler_1.BusinessError('损坏申诉不存在', 404, 404);
    }
    const notes = await (0, noteService_1.getEntityNotes)(enums_1.EntityType.DAMAGE_CLAIM, claimId);
    const auditLogs = await (0, auditService_1.getEntityAuditTrail)(enums_1.EntityType.DAMAGE_CLAIM, claimId);
    return {
        evidence: {
            photos: (0, jsonUtils_1.parseEvidenceUrls)(claim.evidenceUrls),
            description: claim.description,
            severity: claim.severity,
            estimatedCost: claim.estimatedCost,
        },
        disputes: {
            disputeReason: claim.disputeReason,
            rejectReason: claim.rejectReason,
            resolvedReason: claim.resolvedReason,
        },
        timeline: [
            ...notes.map((n) => ({
                type: 'NOTE',
                time: n.createdAt,
                content: n.content,
                isSupplement: n.isSupplement,
                supplementReason: n.supplementReason,
                operator: { id: n.creator.id, name: n.creator.name, role: n.creator.role },
            })),
            ...auditLogs.map((a) => ({
                type: 'AUDIT',
                action: a.action,
                time: a.createdAt,
                content: a.remark,
                changes: a.changes,
                operator: { id: a.operatorId, name: a.operator.name, role: a.operator.role },
            })),
        ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()),
    };
};
exports.getEvidenceChain = getEvidenceChain;
