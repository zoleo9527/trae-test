"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstrumentList = exports.getRentalDetail = exports.getRentalList = exports.returnRental = exports.createRental = void 0;
const enums_1 = require("../types/enums");
const prisma_1 = __importDefault(require("../lib/prisma"));
const utils_1 = require("../lib/utils");
const errorHandler_1 = require("../middleware/errorHandler");
const auditService_1 = require("./auditService");
const noteService_1 = require("./noteService");
const jsonUtils_1 = require("../lib/jsonUtils");
const createRental = async (params) => {
    const { instrumentId, customerName, customerPhone, customerIdCard, customerAddress, startDate, expectedEndDate, dailyRate, depositAmount, checkoutNotes, operatorId, operatorName, operatorRole, idempotencyKey, } = params;
    return prisma_1.default.$transaction(async (tx) => {
        const instrument = await tx.instrument.findUnique({
            where: { id: instrumentId },
        });
        if (!instrument) {
            throw new errorHandler_1.BusinessError('乐器不存在', 404, 404);
        }
        if (instrument.status !== enums_1.InstrumentStatus.AVAILABLE) {
            throw new errorHandler_1.BusinessError(`乐器状态为${instrument.status}，不可租赁`, 400, 400);
        }
        if (expectedEndDate <= startDate) {
            throw new errorHandler_1.BusinessError('预计归还日期必须晚于租赁开始日期', 400, 400);
        }
        const rentalNo = (0, utils_1.generateOrderNo)('RL');
        const depositNo = (0, utils_1.generateOrderNo)('DP');
        let customer = await tx.customer.findUnique({
            where: { phone: customerPhone },
        });
        if (!customer) {
            customer = await tx.customer.create({
                data: {
                    name: customerName,
                    phone: customerPhone,
                    idCard: customerIdCard,
                    address: customerAddress,
                },
            });
        }
        const rental = await tx.rental.create({
            data: {
                rentalNo,
                instrumentId,
                customerId: customer.id,
                startDate,
                expectedEndDate,
                dailyRate,
                depositAmount,
                checkoutNotes,
                createdBy: operatorId,
            },
            include: {
                instrument: true,
                customer: true,
                creator: { select: { id: true, name: true, role: true } },
            },
        });
        await tx.deposit.create({
            data: {
                depositNo,
                rentalId: rental.id,
                amount: depositAmount,
                createdBy: operatorId,
            },
        });
        await tx.instrument.update({
            where: { id: instrumentId },
            data: { status: enums_1.InstrumentStatus.RENTED },
        });
        const response = {
            success: true,
            data: rental,
            message: '租赁创建成功',
        };
        await (0, auditService_1.createAuditLog)({
            action: enums_1.AuditAction.RENTAL_CREATE,
            entityType: enums_1.EntityType.RENTAL,
            entityId: rental.id,
            newValue: rental,
            remark: `租赁创建，单号${rentalNo}，客户${customerName}，租期${startDate.toISOString().split('T')[0]}到${expectedEndDate.toISOString().split('T')[0]}`,
            operatorId,
            operatorName,
            operatorRole,
            idempotencyKey,
            responseBody: response,
        });
        return rental;
    });
};
exports.createRental = createRental;
const returnRental = async (params) => {
    const { rentalId, actualEndDate, checkinNotes, hasDamage, operatorId, operatorName, operatorRole, idempotencyKey, } = params;
    return prisma_1.default.$transaction(async (tx) => {
        const oldRental = await tx.rental.findUnique({
            where: { id: rentalId },
            include: { instrument: true, deposit: true },
        });
        if (!oldRental) {
            throw new errorHandler_1.BusinessError('租赁单不存在', 404, 404);
        }
        if (oldRental.status !== enums_1.RentalStatus.ACTIVE) {
            throw new errorHandler_1.BusinessError(`租赁单状态为${oldRental.status}，不可归还`, 400, 400);
        }
        const returnDate = actualEndDate || new Date();
        const rentalFee = (0, utils_1.calculateRentalFee)(Number(oldRental.dailyRate), oldRental.startDate, returnDate);
        const updatedRental = await tx.rental.update({
            where: { id: rentalId },
            data: {
                status: enums_1.RentalStatus.RETURNED,
                actualEndDate: returnDate,
                checkinNotes,
                handledBy: operatorId,
            },
            include: {
                instrument: true,
                customer: true,
                deposit: true,
                handler: { select: { id: true, name: true, role: true } },
            },
        });
        if (!hasDamage) {
            await tx.instrument.update({
                where: { id: oldRental.instrumentId },
                data: { status: enums_1.InstrumentStatus.AVAILABLE },
            });
        }
        else {
            await tx.instrument.update({
                where: { id: oldRental.instrumentId },
                data: { status: enums_1.InstrumentStatus.DAMAGED },
            });
        }
        const changes = (0, utils_1.compareObjects)({ status: oldRental.status, actualEndDate: oldRental.actualEndDate }, { status: updatedRental.status, actualEndDate: updatedRental.actualEndDate });
        const response = {
            success: true,
            data: {
                ...updatedRental,
                rentalFee,
            },
            message: '归还成功',
        };
        await (0, auditService_1.createAuditLog)({
            action: enums_1.AuditAction.RENTAL_RETURN,
            entityType: enums_1.EntityType.RENTAL,
            entityId: rentalId,
            oldValue: oldRental,
            newValue: updatedRental,
            changes,
            remark: `租赁归还，单号${oldRental.rentalNo}，租金${rentalFee}元，${hasDamage ? '有损坏待处理' : '无损坏'}`,
            operatorId,
            operatorName,
            operatorRole,
            idempotencyKey,
            responseBody: response,
        });
        return { ...updatedRental, rentalFee };
    });
};
exports.returnRental = returnRental;
const getRentalList = async (status, customerId, instrumentId, page = 1, pageSize = 20) => {
    const where = {};
    if (status)
        where.status = status;
    if (customerId)
        where.customerId = customerId;
    if (instrumentId)
        where.instrumentId = instrumentId;
    const [total, items] = await Promise.all([
        prisma_1.default.rental.count({ where }),
        prisma_1.default.rental.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                instrument: true,
                customer: true,
                deposit: true,
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
exports.getRentalList = getRentalList;
const getRentalDetail = async (id) => {
    const rental = await prisma_1.default.rental.findUnique({
        where: { id },
        include: {
            instrument: true,
            customer: true,
            deposit: true,
            damageClaims: {
                include: {
                    creator: { select: { id: true, name: true, role: true } },
                    handler: { select: { id: true, name: true, role: true } },
                },
            },
            creator: { select: { id: true, name: true, role: true } },
            handler: { select: { id: true, name: true, role: true } },
        },
    });
    if (!rental) {
        const auditTrail = await (0, auditService_1.getEntityAuditTrail)(enums_1.EntityType.RENTAL, id);
        throw new errorHandler_1.BusinessError(`租赁单不存在，ID: ${id}`, 404, 404, { auditTrail, requestedId: id });
    }
    const notes = await (0, noteService_1.getEntityNotes)(enums_1.EntityType.RENTAL, id);
    const auditLogs = await (0, auditService_1.getEntityAuditTrail)(enums_1.EntityType.RENTAL, id);
    const damageClaimsWithNotes = await Promise.all(rental.damageClaims.map(async (claim) => {
        const claimNotes = await (0, noteService_1.getEntityNotes)(enums_1.EntityType.DAMAGE_CLAIM, claim.id);
        return {
            ...claim,
            evidenceUrls: (0, jsonUtils_1.parseEvidenceUrls)(claim.evidenceUrls),
            notes: claimNotes,
        };
    }));
    return {
        ...rental,
        damageClaims: damageClaimsWithNotes,
        notes,
        auditLogs,
    };
};
exports.getRentalDetail = getRentalDetail;
const getInstrumentList = async (status, category, page = 1, pageSize = 20) => {
    const where = {};
    if (status)
        where.status = status;
    if (category)
        where.category = category;
    const [total, items] = await Promise.all([
        prisma_1.default.instrument.count({ where }),
        prisma_1.default.instrument.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
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
exports.getInstrumentList = getInstrumentList;
