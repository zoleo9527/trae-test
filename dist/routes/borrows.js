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
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const createBorrowSchema = zod_1.z.object({
    sampleId: zod_1.z.string().min(1, '样品ID不能为空'),
    borrowerName: zod_1.z.string().min(1, '借用人姓名不能为空'),
    borrowerContact: zod_1.z.string().min(1, '借用人联系方式不能为空'),
    purpose: zod_1.z.string().min(1, '借出用途不能为空'),
    expectedReturn: zod_1.z.string().min(1, '预计归还日期不能为空'),
});
router.get('/', async (req, res) => {
    const { status, my } = req.query;
    const where = {};
    if (status) {
        where.status = status;
    }
    if (my === 'true' && req.user) {
        where.createdById = req.user.userId;
    }
    const borrows = await prisma_1.default.sampleBorrow.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            sample: { select: { name: true, sku: true, location: true } },
            createdBy: { select: { name: true, role: true } },
            approvedBy: { select: { name: true } },
            returnRecord: true,
        },
    });
    res.json({ code: 0, data: borrows });
});
router.get('/:id', async (req, res) => {
    const borrow = await prisma_1.default.sampleBorrow.findUnique({
        where: { id: req.params.id },
        include: {
            sample: true,
            createdBy: { select: { name: true, role: true } },
            approvedBy: { select: { name: true } },
            returnRecord: true,
        },
    });
    if (!borrow) {
        return res.status(404).json({ code: 404, message: '记录不存在' });
    }
    const auditConditions = [{ entityType: 'SampleBorrow', entityId: req.params.id }];
    if (borrow.returnRecord) {
        auditConditions.push({ entityType: 'SampleReturn', entityId: borrow.returnRecord.id });
    }
    const auditLogs = await prisma_1.default.auditLog.findMany({
        where: { OR: auditConditions },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
    });
    res.json({ code: 0, data: { ...borrow, auditLogs } });
});
router.post('/', (0, rbac_1.requireRoles)(types_1.Role.SALES_CONSULTANT, types_1.Role.SHOWROOM_MANAGER), async (req, res) => {
    try {
        const body = createBorrowSchema.parse(req.body);
        const sample = await prisma_1.default.sample.findUnique({ where: { id: body.sampleId } });
        if (!sample) {
            return res.status(404).json({ code: 404, message: '样品不存在' });
        }
        if (sample.status !== 'AVAILABLE') {
            return res.status(400).json({ code: 400, message: '样品当前不可借出' });
        }
        const borrow = await prisma_1.default.sampleBorrow.create({
            data: {
                sampleId: body.sampleId,
                borrowerName: body.borrowerName,
                borrowerContact: body.borrowerContact,
                purpose: body.purpose,
                expectedReturn: new Date(body.expectedReturn),
                status: types_1.BorrowStatus.PENDING_APPROVAL,
                createdById: req.user?.userId,
            },
            include: { sample: true, createdBy: true },
        });
        await (0, audit_1.createAuditLog)({
            entityType: 'SampleBorrow',
            entityId: borrow.id,
            action: types_1.AuditAction.CREATE,
            newValue: borrow,
            userId: req.user?.userId,
            remark: '提交借出申请',
        });
        const managers = await prisma_1.default.user.findMany({
            where: { role: types_1.Role.SHOWROOM_MANAGER },
            select: { id: true },
        });
        await (0, audit_1.createNotification)(managers.map((m) => m.id), '新的借出申请待审批', `${req.user?.name} 提交了样品「${sample.name}」的借出申请`, 'BORROW_APPROVAL', borrow.id);
        res.json({ code: 0, data: borrow });
    }
    catch (e) {
        if (e instanceof zod_1.z.ZodError) {
            return res.status(400).json({ code: 400, message: e.errors[0].message });
        }
        res.status(500).json({ code: 500, message: '创建失败' });
    }
});
router.post('/:id/approve', (0, rbac_1.requireRoles)(types_1.Role.SHOWROOM_MANAGER), async (req, res) => {
    const { id } = req.params;
    const { version } = req.body;
    const borrow = await prisma_1.default.sampleBorrow.findUnique({ where: { id }, include: { sample: true } });
    if (!borrow) {
        return res.status(404).json({ code: 404, message: '记录不存在' });
    }
    if (borrow.status !== types_1.BorrowStatus.PENDING_APPROVAL) {
        return res.status(400).json({ code: 400, message: '当前状态不可审批' });
    }
    if (borrow.version !== version) {
        return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
    }
    const updated = await prisma_1.default.sampleBorrow.update({
        where: { id },
        data: {
            status: types_1.BorrowStatus.APPROVED,
            approvedById: req.user?.userId,
            version: { increment: 1 },
        },
        include: { sample: true, createdBy: true },
    });
    await (0, audit_1.createAuditLog)({
        entityType: 'SampleBorrow',
        entityId: id,
        action: types_1.AuditAction.APPROVE,
        oldValue: borrow,
        newValue: updated,
        userId: req.user?.userId,
        remark: '审批通过',
    });
    if (borrow.createdById) {
        await (0, audit_1.createNotification)([borrow.createdById], '借出申请已通过', `您申请的样品「${borrow.sample.name}」已通过审批`, 'BORROW_APPROVED', id);
    }
    res.json({ code: 0, data: updated });
});
router.post('/:id/reject', (0, rbac_1.requireRoles)(types_1.Role.SHOWROOM_MANAGER), async (req, res) => {
    const { id } = req.params;
    const { version, reason } = req.body;
    const borrow = await prisma_1.default.sampleBorrow.findUnique({ where: { id }, include: { sample: true } });
    if (!borrow) {
        return res.status(404).json({ code: 404, message: '记录不存在' });
    }
    if (borrow.status !== types_1.BorrowStatus.PENDING_APPROVAL) {
        return res.status(400).json({ code: 400, message: '当前状态不可驳回' });
    }
    if (borrow.version !== version) {
        return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
    }
    const updated = await prisma_1.default.sampleBorrow.update({
        where: { id },
        data: {
            status: types_1.BorrowStatus.REJECTED,
            rejectReason: reason,
            version: { increment: 1 },
        },
        include: { sample: true, createdBy: true },
    });
    await (0, audit_1.createAuditLog)({
        entityType: 'SampleBorrow',
        entityId: id,
        action: types_1.AuditAction.REJECT,
        oldValue: borrow,
        newValue: updated,
        userId: req.user?.userId,
        remark: `驳回申请：${reason}`,
    });
    if (borrow.createdById) {
        await (0, audit_1.createNotification)([borrow.createdById], '借出申请被驳回', `您申请的样品「${borrow.sample.name}」被驳回：${reason}`, 'BORROW_REJECTED', id);
    }
    res.json({ code: 0, data: updated });
});
router.post('/:id/confirm-borrow', (0, rbac_1.requireRoles)(types_1.Role.SALES_CONSULTANT, types_1.Role.SHOWROOM_MANAGER, types_1.Role.INSTALL_COORDINATOR), async (req, res) => {
    const { id } = req.params;
    const { version } = req.body;
    const borrow = await prisma_1.default.sampleBorrow.findUnique({ where: { id }, include: { sample: true } });
    if (!borrow) {
        return res.status(404).json({ code: 404, message: '记录不存在' });
    }
    if (borrow.status !== types_1.BorrowStatus.APPROVED) {
        return res.status(400).json({ code: 400, message: '请先完成审批' });
    }
    if (borrow.version !== version) {
        return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
    }
    const updated = await prisma_1.default.sampleBorrow.update({
        where: { id },
        data: {
            status: types_1.BorrowStatus.BORROWED,
            version: { increment: 1 },
        },
        include: { sample: true, createdBy: true },
    });
    await prisma_1.default.sample.update({
        where: { id: borrow.sampleId },
        data: { status: 'BORROWED' },
    });
    await (0, audit_1.createAuditLog)({
        entityType: 'SampleBorrow',
        entityId: id,
        action: types_1.AuditAction.BORROW,
        oldValue: borrow,
        newValue: updated,
        userId: req.user?.userId,
        remark: '确认样品已借出',
    });
    res.json({ code: 0, data: updated });
});
router.post('/:id/return', (0, rbac_1.requireRoles)(types_1.Role.SALES_CONSULTANT, types_1.Role.SHOWROOM_MANAGER), async (req, res) => {
    const { id } = req.params;
    const { version, condition, remarks } = req.body;
    const borrow = await prisma_1.default.sampleBorrow.findUnique({ where: { id }, include: { sample: true } });
    if (!borrow) {
        return res.status(404).json({ code: 404, message: '记录不存在' });
    }
    if (borrow.status !== types_1.BorrowStatus.BORROWED) {
        return res.status(400).json({ code: 400, message: '当前状态不可归还' });
    }
    if (borrow.version !== version) {
        return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
    }
    const returnRecord = await prisma_1.default.sampleReturn.create({
        data: {
            borrowId: id,
            returnDate: new Date(),
            condition: condition || 'GOOD',
            remarks: remarks || '',
        },
    });
    const updatedBorrow = await prisma_1.default.sampleBorrow.update({
        where: { id },
        data: {
            status: types_1.BorrowStatus.RETURNING,
            actualReturn: new Date(),
            version: { increment: 1 },
        },
        include: { sample: true, createdBy: true },
    });
    await (0, audit_1.createAuditLog)({
        entityType: 'SampleBorrow',
        entityId: id,
        action: types_1.AuditAction.RETURN,
        newValue: { returnRecord, borrow: updatedBorrow },
        userId: req.user?.userId,
        remark: '提交归还，待验收',
    });
    await (0, audit_1.createAuditLog)({
        entityType: 'SampleReturn',
        entityId: returnRecord.id,
        action: types_1.AuditAction.RETURN,
        newValue: returnRecord,
        userId: req.user?.userId,
        remark: '提交归还，待验收',
    });
    const managers = await prisma_1.default.user.findMany({
        where: { role: types_1.Role.SHOWROOM_MANAGER },
        select: { id: true },
    });
    await (0, audit_1.createNotification)(managers.map((m) => m.id), '样品归还待验收', `样品「${borrow.sample.name}」已归还，待验收`, 'RETURN_INSPECTION', id);
    res.json({ code: 0, data: { borrow: updatedBorrow, returnRecord } });
});
exports.default = router;
//# sourceMappingURL=borrows.js.map