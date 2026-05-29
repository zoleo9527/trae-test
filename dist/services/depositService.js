"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDepositDetail = exports.getDepositList = exports.markDepositDisputed = exports.settleDeposit = exports.createDeposit = void 0;
const enums_1 = require("../types/enums");
const prisma_1 = __importDefault(require("../lib/prisma"));
const utils_1 = require("../lib/utils");
const errorHandler_1 = require("../middleware/errorHandler");
const auditService_1 = require("./auditService");
const noteService_1 = require("./noteService");
const createDeposit = async (params) => {
    const { rentalId, amount, operatorId } = params;
    const existingDeposit = await prisma_1.default.deposit.findUnique({
        where: { rentalId },
    });
    if (existingDeposit) {
        throw new errorHandler_1.BusinessError('该租赁单已有押金记录', 400, 400);
    }
    const depositNo = `DP${Date.now()}`;
    const deposit = await prisma_1.default.deposit.create({
        data: {
            depositNo,
            rentalId,
            amount,
            createdBy: operatorId,
        },
    });
    return deposit;
};
exports.createDeposit = createDeposit;
const settleDeposit = async (params) => {
    const { depositId, refundAmount, deductAmount, paymentMethod, transactionId, operatorId, operatorName, operatorRole, idempotencyKey, } = params;
    return prisma_1.default.$transaction(async (tx) => {
        const oldDeposit = await tx.deposit.findUnique({
            where: { id: depositId },
            include: { rental: true },
        });
        if (!oldDeposit) {
            throw new errorHandler_1.BusinessError('押金单不存在', 404, 404);
        }
        if (oldDeposit.status !== enums_1.DepositStatus.HELD && oldDeposit.status !== enums_1.DepositStatus.DISPUTED) {
            throw new errorHandler_1.BusinessError(`押金单状态不允许结算`, 400, 400);
        }
        const totalAmount = Number(oldDeposit.amount);
        if (Math.abs(refundAmount + deductAmount - totalAmount) > 0.01) {
            throw new errorHandler_1.BusinessError('退款金额+扣款金额必须等于押金总额', 400, 400);
        }
        let status;
        if (deductAmount === 0) {
            status = enums_1.DepositStatus.REFUNDED;
        }
        else if (refundAmount === 0) {
            status = enums_1.DepositStatus.DEDUCTED;
        }
        else {
            status = enums_1.DepositStatus.PARTIAL_REFUNDED;
        }
        const updatedDeposit = await tx.deposit.update({
            where: { id: depositId },
            data: {
                status,
                refundAmount,
                deductAmount,
                paymentMethod,
                transactionId,
                handledBy: operatorId,
            },
            include: {
                rental: true,
                handler: { select: { id: true, name: true, role: true } },
            },
        });
        await tx.rental.update({
            where: { id: oldDeposit.rentalId },
            data: { status: enums_1.RentalStatus.SETTLED },
        });
        const changes = (0, utils_1.compareObjects)({
            status: oldDeposit.status,
            refundAmount: oldDeposit.refundAmount,
            deductAmount: oldDeposit.deductAmount,
        }, {
            status,
            refundAmount,
            deductAmount,
        });
        let auditAction;
        if (deductAmount === 0) {
            auditAction = enums_1.AuditAction.DEPOSIT_REFUND;
        }
        else if (refundAmount === 0) {
            auditAction = enums_1.AuditAction.DEPOSIT_DEDUCT;
        }
        else {
            auditAction = enums_1.AuditAction.DEPOSIT_PARTIAL_REFUND;
        }
        const response = {
            success: true,
            data: updatedDeposit,
            message: '押金结算完成',
        };
        await (0, auditService_1.createAuditLog)({
            tx,
            action: auditAction,
            entityType: enums_1.EntityType.DEPOSIT,
            entityId: depositId,
            oldValue: oldDeposit,
            newValue: updatedDeposit,
            changes,
            remark: `押金结算，单号${oldDeposit.depositNo}，退款${refundAmount}元，扣款${deductAmount}元`,
            operatorId,
            operatorName,
            operatorRole,
            idempotencyKey,
            responseBody: response,
        });
        return updatedDeposit;
    }, { maxWait: 10000, timeout: 30000 });
};
exports.settleDeposit = settleDeposit;
const markDepositDisputed = async (depositId, operatorId, operatorName, operatorRole, idempotencyKey) => {
    return prisma_1.default.$transaction(async (tx) => {
        const oldDeposit = await tx.deposit.findUnique({
            where: { id: depositId },
        });
        if (!oldDeposit) {
            throw new errorHandler_1.BusinessError('押金单不存在', 404, 404);
        }
        const updatedDeposit = await tx.deposit.update({
            where: { id: depositId },
            data: { status: enums_1.DepositStatus.DISPUTED },
        });
        const response = {
            success: true,
            data: updatedDeposit,
            message: '押金标记为有争议',
        };
        await (0, auditService_1.createAuditLog)({
            tx,
            action: enums_1.AuditAction.DEPOSIT_DISPUTE,
            entityType: enums_1.EntityType.DEPOSIT,
            entityId: depositId,
            oldValue: oldDeposit,
            newValue: updatedDeposit,
            remark: `押金${oldDeposit.depositNo}标记为有争议`,
            operatorId,
            operatorName,
            operatorRole,
            idempotencyKey,
            responseBody: response,
        });
        return updatedDeposit;
    }, { maxWait: 10000, timeout: 30000 });
};
exports.markDepositDisputed = markDepositDisputed;
const getDepositList = async (status, rentalId, page = 1, pageSize = 20) => {
    const where = {};
    if (status)
        where.status = status;
    if (rentalId)
        where.rentalId = rentalId;
    const [total, items] = await Promise.all([
        prisma_1.default.deposit.count({ where }),
        prisma_1.default.deposit.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                rental: {
                    include: { customer: true, instrument: true },
                },
                creator: { select: { id: true, name: true, role: true } },
                handler: { select: { id: true, name: true, role: true } },
            },
        }),
    ]);
    return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
};
exports.getDepositList = getDepositList;
const getDepositDetail = async (id) => {
    const deposit = await prisma_1.default.deposit.findUnique({
        where: { id },
        include: {
            rental: {
                include: {
                    customer: true,
                    instrument: true,
                    damageClaims: true,
                },
            },
            creator: { select: { id: true, name: true, role: true } },
            handler: { select: { id: true, name: true, role: true } },
        },
    });
    if (!deposit) {
        const auditTrail = await (0, auditService_1.getEntityAuditTrail)(enums_1.EntityType.DEPOSIT, id);
        throw new errorHandler_1.BusinessError(`押金单不存在，ID: ${id}`, 404, 404, { auditTrail, requestedId: id });
    }
    const notes = await (0, noteService_1.getEntityNotes)(enums_1.EntityType.DEPOSIT, id);
    const auditLogs = await (0, auditService_1.getEntityAuditTrail)(enums_1.EntityType.DEPOSIT, id);
    return {
        ...deposit,
        notes,
        auditLogs,
    };
};
exports.getDepositDetail = getDepositDetail;
