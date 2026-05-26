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
const sampleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, '样品名称不能为空'),
    sku: zod_1.z.string().min(1, 'SKU不能为空'),
    category: zod_1.z.string().min(1, '分类不能为空'),
    description: zod_1.z.string().optional(),
    location: zod_1.z.string().min(1, '位置不能为空'),
});
router.get('/', async (req, res) => {
    const { keyword, status, category } = req.query;
    const where = {};
    if (keyword) {
        where.OR = [
            { name: { contains: keyword } },
            { sku: { contains: keyword } },
        ];
    }
    if (status) {
        where.status = status;
    }
    if (category) {
        where.category = category;
    }
    const samples = await prisma_1.default.sample.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            borrowRecords: {
                where: { status: { in: [types_1.BorrowStatus.BORROWED, types_1.BorrowStatus.APPROVED] } },
                take: 1,
                include: { createdBy: { select: { name: true } } },
            },
        },
    });
    res.json({
        code: 0,
        data: samples,
    });
});
router.get('/:id', async (req, res) => {
    const sample = await prisma_1.default.sample.findUnique({
        where: { id: req.params.id },
        include: {
            borrowRecords: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { createdBy: { select: { name: true } } },
            },
        },
    });
    if (!sample) {
        return res.status(404).json({ code: 404, message: '样品不存在' });
    }
    res.json({ code: 0, data: sample });
});
router.post('/', (0, rbac_1.requireRoles)(types_1.Role.SHOWROOM_MANAGER), async (req, res) => {
    try {
        const data = sampleSchema.parse(req.body);
        const existing = await prisma_1.default.sample.findUnique({ where: { sku: data.sku } });
        if (existing) {
            return res.status(400).json({ code: 400, message: 'SKU已存在' });
        }
        const sample = await prisma_1.default.sample.create({ data });
        await (0, audit_1.createAuditLog)({
            entityType: 'Sample',
            entityId: sample.id,
            action: 'CREATE',
            newValue: sample,
            userId: req.user?.userId,
            remark: '创建样品',
        });
        res.json({ code: 0, data: sample });
    }
    catch (e) {
        if (e instanceof zod_1.z.ZodError) {
            return res.status(400).json({ code: 400, message: e.errors[0].message });
        }
        res.status(500).json({ code: 500, message: '创建失败' });
    }
});
router.put('/:id', (0, rbac_1.requireRoles)(types_1.Role.SHOWROOM_MANAGER), async (req, res) => {
    const { id } = req.params;
    const { version, ...data } = req.body;
    const existing = await prisma_1.default.sample.findUnique({ where: { id } });
    if (!existing) {
        return res.status(404).json({ code: 404, message: '样品不存在' });
    }
    if (existing.version !== version) {
        return res.status(409).json({ code: 409, message: '数据已被修改，请刷新后重试' });
    }
    const updated = await prisma_1.default.sample.update({
        where: { id },
        data: { ...data, version: { increment: 1 } },
    });
    await (0, audit_1.createAuditLog)({
        entityType: 'Sample',
        entityId: id,
        action: 'UPDATE',
        oldValue: existing,
        newValue: updated,
        userId: req.user?.userId,
        remark: '更新样品信息',
    });
    res.json({ code: 0, data: updated });
});
exports.default = router;
//# sourceMappingURL=samples.js.map