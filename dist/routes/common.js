"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.get('/dashboard', async (req, res) => {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const pendingApproval = await prisma_1.default.sampleBorrow.count({
        where: { status: types_1.BorrowStatus.PENDING_APPROVAL },
    });
    const pendingReturnInspection = await prisma_1.default.sampleReturn.count({
        where: { status: types_1.ReturnStatus.PENDING_INSPECTION },
    });
    const needsReview = await prisma_1.default.sampleReturn.count({
        where: { status: types_1.ReturnStatus.NEEDS_REVIEW },
    });
    const rejected = await prisma_1.default.sampleBorrow.count({
        where: {
            status: types_1.BorrowStatus.REJECTED,
            ...(userRole === types_1.Role.SALES_CONSULTANT ? { createdById: userId } : {}),
        },
    });
    const borrowed = await prisma_1.default.sampleBorrow.count({
        where: {
            status: types_1.BorrowStatus.BORROWED,
        },
    });
    const myPending = await prisma_1.default.sampleBorrow.count({
        where: {
            createdById: userId,
            status: { in: [types_1.BorrowStatus.PENDING_APPROVAL, types_1.BorrowStatus.APPROVED, types_1.BorrowStatus.BORROWED] },
        },
    });
    const overdue = await prisma_1.default.sampleBorrow.count({
        where: {
            status: { in: [types_1.BorrowStatus.BORROWED, types_1.BorrowStatus.APPROVED] },
            expectedReturn: { lt: new Date() },
        },
    });
    const latestActivities = await prisma_1.default.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, role: true } } },
    });
    const pendingApprovalList = await prisma_1.default.sampleBorrow.findMany({
        where: { status: types_1.BorrowStatus.PENDING_APPROVAL },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            sample: { select: { name: true, sku: true } },
            createdBy: { select: { name: true } },
        },
    });
    const pendingInspectionList = await prisma_1.default.sampleReturn.findMany({
        where: { status: types_1.ReturnStatus.PENDING_INSPECTION },
        take: 5,
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
    const needsReviewList = await prisma_1.default.sampleReturn.findMany({
        where: { status: types_1.ReturnStatus.NEEDS_REVIEW },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
            borrow: {
                include: {
                    sample: { select: { name: true, sku: true } },
                    createdBy: { select: { name: true } },
                },
            },
        },
    });
    const myRejectedList = await prisma_1.default.sampleBorrow.findMany({
        where: {
            status: types_1.BorrowStatus.REJECTED,
            ...(userRole === types_1.Role.SALES_CONSULTANT ? { createdById: userId } : {}),
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
            sample: { select: { name: true, sku: true } },
            approvedBy: { select: { name: true } },
        },
    });
    res.json({
        code: 0,
        data: {
            stats: {
                pendingApproval,
                pendingReturnInspection,
                needsReview,
                rejected,
                borrowed,
                myPending,
                overdue,
            },
            pendingApprovalList,
            pendingInspectionList,
            needsReviewList,
            myRejectedList,
            latestActivities,
        },
    });
});
router.get('/audit-logs', async (req, res) => {
    const { entityType, entityId, page = '1', pageSize = '20' } = req.query;
    const where = {};
    if (entityType)
        where.entityType = entityType;
    if (entityId)
        where.entityId = entityId;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);
    const [logs, total] = await Promise.all([
        prisma_1.default.auditLog.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, role: true } } },
        }),
        prisma_1.default.auditLog.count({ where }),
    ]);
    res.json({
        code: 0,
        data: { list: logs, total, page: parseInt(page), pageSize: take },
    });
});
router.get('/notifications', async (req, res) => {
    const userId = req.user?.userId;
    const { read } = req.query;
    const where = { userId };
    if (read !== undefined) {
        where.read = read === 'true';
    }
    const notifications = await prisma_1.default.notification.findMany({
        where,
        take: 20,
        orderBy: { createdAt: 'desc' },
    });
    res.json({ code: 0, data: notifications });
});
router.post('/notifications/:id/read', async (req, res) => {
    await prisma_1.default.notification.update({
        where: { id: req.params.id, userId: req.user?.userId },
        data: { read: true },
    });
    res.json({ code: 0, message: '已标记为已读' });
});
exports.default = router;
//# sourceMappingURL=common.js.map