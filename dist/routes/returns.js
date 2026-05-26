"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const rbac_1 = require("../middleware/rbac");
const types_1 = require("../types");
const audit_1 = require("../services/audit");
const router = (0, express_1.Router)();
router.get('/', (0, rbac_1.requireRoles)(types_1.Role.SHOWROOM_MANAGER, types_1.Role.INSTALL_COORDINATOR), async (req, res) => {
    const { status } = req.query;
    const where = {};
    if (status) {
        where.status = status;
    }
    const returns = await prisma_1.default.sampleReturn.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            borrow: {
                include: {
                    sample: { select: { name: true, sku: true } },
                    createdBy: { select: { name: true } },
                },
            },
        },
    });
    res.json({ code: 0, data: returns });
});
router.post('/:id/inspect-pass', (0, rbac_1.requireRoles)(types_1.Role.SHOWROOM_MANAGER, types_1.Role.INSTALL_COORDINATOR), async (req, res) => {
    const { id } = req.params;
    const { version, remarks } = req.body;
    const returnRecord = await prisma_1.default.sampleReturn.findUnique({
        where: { id },
        include: { borrow: { include: { sample: true, createdBy: true } } },
    });
    if (!returnRecord) {
        return res.status(404).json({ code: 404, message: '记录不存在' });
    }
    if (returnRecord.status !== types_1.ReturnStatus.PENDING_INSPECTION && returnRecord.status !== types_1.ReturnStatus.NEEDS_REVIEW) {
        return res.status(400).json({ code: 400, message: '当前状态不可验收' });
    }
    if (returnRecord.version !== version) {
        return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
    }
    const updatedReturn = await prisma_1.default.sampleReturn.update({
        where: { id },
        data: {
            status: types_1.ReturnStatus.INSPECTION_PASSED,
            version: { increment: 1 },
        },
        include: { borrow: { include: { sample: true } } },
    });
    await (0, audit_1.createAuditLog)({
        entityType: 'SampleReturn',
        entityId: id,
        action: types_1.AuditAction.INSPECT,
        oldValue: returnRecord,
        newValue: updatedReturn,
        userId: req.user?.userId,
        remark: '验收通过',
    });
    if (returnRecord.borrow.createdById) {
        await (0, audit_1.createNotification)([returnRecord.borrow.createdById], '样品归还验收通过', `您借出的样品「${returnRecord.borrow.sample.name}」已完成验收`, 'RETURN_COMPLETED', returnRecord.borrowId);
    }
    res.json({ code: 0, data: updatedReturn });
});
router.post('/:id/need-review', (0, rbac_1.requireRoles)(types_1.Role.SHOWROOM_MANAGER), async (req, res) => {
    const { id } = req.params;
    const { version, reason } = req.body;
    const returnRecord = await prisma_1.default.sampleReturn.findUnique({
        where: { id },
        include: { borrow: { include: { sample: true, createdBy: true } } },
    });
    if (!returnRecord) {
        return res.status(404).json({ code: 404, message: '记录不存在' });
    }
    if (returnRecord.status !== types_1.ReturnStatus.PENDING_INSPECTION) {
        return res.status(400).json({ code: 400, message: '当前状态不可操作' });
    }
    if (returnRecord.version !== version) {
        return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
    }
    const updatedReturn = await prisma_1.default.sampleReturn.update({
        where: { id },
        data: {
            status: types_1.ReturnStatus.NEEDS_REVIEW,
            reviewReason: reason,
            version: { increment: 1 },
        },
        include: { borrow: { include: { sample: true } } },
    });
    await (0, audit_1.createAuditLog)({
        entityType: 'SampleReturn',
        entityId: id,
        action: types_1.AuditAction.INSPECT,
        oldValue: returnRecord,
        newValue: updatedReturn,
        userId: req.user?.userId,
        remark: `需回查：${reason}`,
    });
    const concernedUsers = await prisma_1.default.user.findMany({
        where: {
            OR: [
                { id: returnRecord.borrow.createdById || '' },
                { role: types_1.Role.SALES_CONSULTANT },
            ],
        },
        select: { id: true },
    });
    await (0, audit_1.createNotification)(concernedUsers.map((u) => u.id), '样品归还需回查', `样品「${returnRecord.borrow.sample.name}」归还验收需回查：${reason}`, 'RETURN_NEEDS_REVIEW', returnRecord.borrowId);
    res.json({ code: 0, data: updatedReturn });
});
router.post('/:id/complete', (0, rbac_1.requireRoles)(types_1.Role.SHOWROOM_MANAGER), async (req, res) => {
    const { id } = req.params;
    const { version } = req.body;
    const returnRecord = await prisma_1.default.sampleReturn.findUnique({
        where: { id },
        include: { borrow: { include: { sample: true, createdBy: true } } },
    });
    if (!returnRecord) {
        return res.status(404).json({ code: 404, message: '记录不存在' });
    }
    if (returnRecord.status !== types_1.ReturnStatus.INSPECTION_PASSED) {
        return res.status(400).json({ code: 400, message: '请先完成验收' });
    }
    if (returnRecord.version !== version) {
        return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
    }
    const updatedReturn = await prisma_1.default.sampleReturn.update({
        where: { id },
        data: {
            status: types_1.ReturnStatus.COMPLETED,
            version: { increment: 1 },
        },
    });
    await prisma_1.default.sampleBorrow.update({
        where: { id: returnRecord.borrowId },
        data: { status: types_1.BorrowStatus.COMPLETED, version: { increment: 1 } },
    });
    await prisma_1.default.sample.update({
        where: { id: returnRecord.borrow.sampleId },
        data: { status: 'AVAILABLE' },
    });
    await (0, audit_1.createAuditLog)({
        entityType: 'SampleReturn',
        entityId: id,
        action: types_1.AuditAction.UPDATE,
        oldValue: returnRecord,
        newValue: updatedReturn,
        userId: req.user?.userId,
        remark: '归还流程完成',
    });
    res.json({ code: 0, data: updatedReturn });
});
exports.default = router;
//# sourceMappingURL=returns.js.map