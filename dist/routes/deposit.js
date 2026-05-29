"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const idempotency_1 = require("../middleware/idempotency");
const validate_1 = require("../middleware/validate");
const validation_1 = require("../lib/validation");
const depositService_1 = require("../services/depositService");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.requirePermission)('deposit:read'), async (req, res, next) => {
    try {
        const { status, rentalId, page, pageSize } = req.query;
        const result = await (0, depositService_1.getDepositList)(status, rentalId, Number(page) || 1, Number(pageSize) || 20);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', (0, auth_1.requirePermission)('deposit:read'), async (req, res, next) => {
    try {
        const result = await (0, depositService_1.getDepositDetail)(req.params.id);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/settle', (0, auth_1.requirePermission)('deposit:settle'), idempotency_1.idempotencyMiddleware, (0, validate_1.validateRequest)(validation_1.settleDepositSchema), async (req, res, next) => {
    try {
        const deposit = await (0, depositService_1.settleDeposit)({
            ...req.body,
            depositId: req.params.id,
            operatorId: req.user.id,
            operatorName: req.user.name,
            operatorRole: req.user.role,
            idempotencyKey: req.idempotencyKey,
        });
        res.json({ success: true, data: deposit, message: '押金结算完成' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/dispute', (0, auth_1.requirePermission)('deposit:dispute'), idempotency_1.idempotencyMiddleware, async (req, res, next) => {
    try {
        const deposit = await (0, depositService_1.markDepositDisputed)(req.params.id, req.user.id, req.user.name, req.user.role, req.idempotencyKey);
        res.json({ success: true, data: deposit, message: '押金标记为有争议' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
