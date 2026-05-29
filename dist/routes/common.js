"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const idempotency_1 = require("../middleware/idempotency");
const validate_1 = require("../middleware/validate");
const validation_1 = require("../lib/validation");
const noteService_1 = require("../services/noteService");
const auditService_1 = require("../services/auditService");
const rentalService_1 = require("../services/rentalService");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/instruments', (0, auth_1.requirePermission)('rental:read'), async (req, res, next) => {
    try {
        const { status, category, page, pageSize } = req.query;
        const result = await (0, rentalService_1.getInstrumentList)(status, category, Number(page) || 1, Number(pageSize) || 20);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
router.get('/customers', (0, auth_1.requirePermission)('rental:read'), async (req, res, next) => {
    try {
        const { name, phone, page, pageSize } = req.query;
        const where = {};
        if (name)
            where.name = { contains: name };
        if (phone)
            where.phone = { contains: phone };
        const [total, items] = await Promise.all([
            prisma_1.default.customer.count({ where }),
            prisma_1.default.customer.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (Number(page) - 1 || 0) * (Number(pageSize) || 20),
                take: Number(pageSize) || 20,
                include: {
                    _count: { select: { rentals: true } },
                },
            }),
        ]);
        res.json({
            success: true,
            data: {
                items,
                total,
                page: Number(page) || 1,
                pageSize: Number(pageSize) || 20,
                totalPages: Math.ceil(total / (Number(pageSize) || 20)),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/audit-logs', (0, auth_1.requirePermission)('audit:read'), async (req, res, next) => {
    try {
        const { entityType, entityId, action, operatorId, page, pageSize } = req.query;
        const result = await (0, auditService_1.getAuditLogs)(entityType, entityId, action, operatorId, Number(page) || 1, Number(pageSize) || 20);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
router.get('/audit-logs/:entityType/:entityId', (0, auth_1.requirePermission)('audit:read'), async (req, res, next) => {
    try {
        const result = await (0, auditService_1.getEntityAuditTrail)(req.params.entityType, req.params.entityId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
router.get('/notes/:entityType/:entityId', (0, auth_1.requirePermission)('note:read'), async (req, res, next) => {
    try {
        const { withTimeline } = req.query;
        if (withTimeline === 'true') {
            const result = await (0, noteService_1.getNotesWithTimeline)(req.params.entityType, req.params.entityId);
            res.json({ success: true, data: result });
        }
        else {
            const result = await (0, noteService_1.getEntityNotes)(req.params.entityType, req.params.entityId);
            res.json({ success: true, data: result });
        }
    }
    catch (error) {
        next(error);
    }
});
router.post('/notes', (0, auth_1.requirePermission)('note:create'), idempotency_1.idempotencyMiddleware, (0, validate_1.validateRequest)(validation_1.addNoteSchema), async (req, res, next) => {
    try {
        const note = await (0, noteService_1.addNote)({
            ...req.body,
            operatorId: req.user.id,
            operatorName: req.user.name,
            operatorRole: req.user.role,
            idempotencyKey: req.idempotencyKey,
        });
        res.json({ success: true, data: note, message: '备注添加成功' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/notes/supplement', (0, auth_1.requirePermission)('note:supplement'), idempotency_1.idempotencyMiddleware, (0, validate_1.validateRequest)(validation_1.addNoteSchema), async (req, res, next) => {
    try {
        const { supplementReason } = req.body;
        if (!supplementReason) {
            return res.status(400).json({
                success: false,
                error: '补录备注必须填写补录原因',
                code: 400,
            });
        }
        const note = await (0, noteService_1.addSupplementNote)({
            ...req.body,
            operatorId: req.user.id,
            operatorName: req.user.name,
            operatorRole: req.user.role,
            idempotencyKey: req.idempotencyKey,
        });
        res.json({ success: true, data: note, message: '补录备注成功' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
