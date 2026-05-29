"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMaintenanceCostSummary = exports.getMaintenanceDetail = exports.getMaintenanceList = exports.completeMaintenance = exports.createMaintenance = void 0;
const enums_1 = require("../types/enums");
const prisma_1 = __importDefault(require("../lib/prisma"));
const utils_1 = require("../lib/utils");
const errorHandler_1 = require("../middleware/errorHandler");
const auditService_1 = require("./auditService");
const noteService_1 = require("./noteService");
const createMaintenance = async (params) => {
    const { instrumentId, damageClaimId, description, partsCost = 0, laborCost = 0, startDate, operatorId, operatorName, operatorRole, idempotencyKey, } = params;
    return prisma_1.default.$transaction(async (tx) => {
        const instrument = await tx.instrument.findUnique({
            where: { id: instrumentId },
        });
        if (!instrument) {
            throw new errorHandler_1.BusinessError('乐器不存在', 404, 404);
        }
        const maintenanceNo = (0, utils_1.generateOrderNo)('MT');
        const totalCost = Number((partsCost + laborCost).toFixed(2));
        const maintenance = await tx.maintenance.create({
            data: {
                maintenanceNo,
                instrumentId,
                damageClaimId,
                description,
                partsCost,
                laborCost,
                totalCost,
                status: 'IN_PROGRESS',
                startDate: startDate || new Date(),
                createdBy: operatorId,
            },
            include: {
                instrument: true,
                damageClaim: true,
                creator: { select: { id: true, name: true, role: true } },
            },
        });
        await tx.instrument.update({
            where: { id: instrumentId },
            data: { status: enums_1.InstrumentStatus.IN_MAINTENANCE },
        });
        const response = {
            success: true,
            data: maintenance,
            message: '维修单创建成功',
        };
        await (0, auditService_1.createAuditLog)({
            action: enums_1.AuditAction.MAINTENANCE_CREATE,
            entityType: enums_1.EntityType.MAINTENANCE,
            entityId: maintenance.id,
            newValue: maintenance,
            remark: `维修单创建，单号${maintenanceNo}，预估费用${totalCost}元`,
            operatorId,
            operatorName,
            operatorRole,
            idempotencyKey,
            responseBody: response,
        });
        return maintenance;
    });
};
exports.createMaintenance = createMaintenance;
const completeMaintenance = async (params) => {
    const { maintenanceId, partsCost, laborCost, completeDate, operatorId, operatorName, operatorRole, idempotencyKey, } = params;
    return prisma_1.default.$transaction(async (tx) => {
        const oldMaintenance = await tx.maintenance.findUnique({
            where: { id: maintenanceId },
            include: { instrument: true },
        });
        if (!oldMaintenance) {
            throw new errorHandler_1.BusinessError('维修单不存在', 404, 404);
        }
        if (oldMaintenance.status === 'COMPLETED') {
            throw new errorHandler_1.BusinessError('该维修单已完成，不可重复操作', 400, 400);
        }
        const totalCost = Number((partsCost + laborCost).toFixed(2));
        const updatedMaintenance = await tx.maintenance.update({
            where: { id: maintenanceId },
            data: {
                partsCost,
                laborCost,
                totalCost,
                status: 'COMPLETED',
                completeDate: completeDate || new Date(),
                handledBy: operatorId,
            },
            include: {
                instrument: true,
                damageClaim: true,
                handler: { select: { id: true, name: true, role: true } },
            },
        });
        const hasUnresolvedDamage = await tx.damageClaim.findFirst({
            where: {
                instrumentId: oldMaintenance.instrumentId,
                status: { in: [enums_1.DamageClaimStatus.PENDING, enums_1.DamageClaimStatus.DISPUTED] },
            },
        });
        if (!hasUnresolvedDamage) {
            await tx.instrument.update({
                where: { id: oldMaintenance.instrumentId },
                data: { status: enums_1.InstrumentStatus.AVAILABLE },
            });
        }
        else {
            await tx.instrument.update({
                where: { id: oldMaintenance.instrumentId },
                data: { status: enums_1.InstrumentStatus.DAMAGED },
            });
        }
        const changes = (0, utils_1.compareObjects)({
            partsCost: oldMaintenance.partsCost,
            laborCost: oldMaintenance.laborCost,
            totalCost: oldMaintenance.totalCost,
            status: oldMaintenance.status,
        }, {
            partsCost,
            laborCost,
            totalCost,
            status: 'COMPLETED',
        });
        const response = {
            success: true,
            data: updatedMaintenance,
            message: '维修完成',
        };
        await (0, auditService_1.createAuditLog)({
            action: enums_1.AuditAction.MAINTENANCE_COMPLETE,
            entityType: enums_1.EntityType.MAINTENANCE,
            entityId: maintenanceId,
            oldValue: oldMaintenance,
            newValue: updatedMaintenance,
            changes,
            remark: `维修完成，单号${oldMaintenance.maintenanceNo}，实际费用${totalCost}元`,
            operatorId,
            operatorName,
            operatorRole,
            idempotencyKey,
            responseBody: response,
        });
        return updatedMaintenance;
    });
};
exports.completeMaintenance = completeMaintenance;
const getMaintenanceList = async (instrumentId, damageClaimId, status, page = 1, pageSize = 20) => {
    const where = {};
    if (instrumentId)
        where.instrumentId = instrumentId;
    if (damageClaimId)
        where.damageClaimId = damageClaimId;
    if (status)
        where.status = status;
    const [total, items] = await Promise.all([
        prisma_1.default.maintenance.count({ where }),
        prisma_1.default.maintenance.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                instrument: true,
                damageClaim: true,
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
exports.getMaintenanceList = getMaintenanceList;
const getMaintenanceDetail = async (id) => {
    const maintenance = await prisma_1.default.maintenance.findUnique({
        where: { id },
        include: {
            instrument: true,
            damageClaim: true,
            creator: { select: { id: true, name: true, role: true } },
            handler: { select: { id: true, name: true, role: true } },
        },
    });
    if (!maintenance) {
        const auditTrail = await (0, auditService_1.getEntityAuditTrail)(enums_1.EntityType.MAINTENANCE, id);
        throw new errorHandler_1.BusinessError(`维修单不存在，ID: ${id}`, 404, 404, { auditTrail, requestedId: id });
    }
    const notes = await (0, noteService_1.getEntityNotes)(enums_1.EntityType.MAINTENANCE, id);
    const auditLogs = await (0, auditService_1.getEntityAuditTrail)(enums_1.EntityType.MAINTENANCE, id);
    return {
        ...maintenance,
        notes,
        auditLogs,
    };
};
exports.getMaintenanceDetail = getMaintenanceDetail;
const getMaintenanceCostSummary = async (startDate, endDate) => {
    const where = { status: 'COMPLETED' };
    if (startDate)
        where.completeDate = { gte: startDate };
    if (endDate) {
        if (!where.completeDate)
            where.completeDate = {};
        where.completeDate.lte = endDate;
    }
    const maintenances = await prisma_1.default.maintenance.findMany({
        where,
        select: {
            partsCost: true,
            laborCost: true,
            totalCost: true,
            description: true,
            instrument: { select: { category: true } },
        },
    });
    const summary = {
        totalCount: maintenances.length,
        totalPartsCost: maintenances.reduce((sum, m) => sum + Number(m.partsCost), 0),
        totalLaborCost: maintenances.reduce((sum, m) => sum + Number(m.laborCost), 0),
        totalCost: maintenances.reduce((sum, m) => sum + Number(m.totalCost), 0),
        byType: {},
        byCategory: {},
    };
    maintenances.forEach((m) => {
        if (!summary.byType[m.description]) {
            summary.byType[m.description] = { count: 0, cost: 0 };
        }
        summary.byType[m.description].count++;
        summary.byType[m.description].cost += Number(m.totalCost);
        const category = m.instrument.category;
        if (!summary.byCategory[category]) {
            summary.byCategory[category] = { count: 0, cost: 0 };
        }
        summary.byCategory[category].count++;
        summary.byCategory[category].cost += Number(m.totalCost);
    });
    return summary;
};
exports.getMaintenanceCostSummary = getMaintenanceCostSummary;
