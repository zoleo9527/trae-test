"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const idempotency_1 = require("../middleware/idempotency");
const validate_1 = require("../middleware/validate");
const validation_1 = require("../lib/validation");
const rentalService_1 = require("../services/rentalService");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.requirePermission)('rental:read'), async (req, res, next) => {
    try {
        const { status, customerId, instrumentId, page, pageSize } = req.query;
        const result = await (0, rentalService_1.getRentalList)(status, customerId, instrumentId, Number(page) || 1, Number(pageSize) || 20);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', (0, auth_1.requirePermission)('rental:read'), async (req, res, next) => {
    try {
        const result = await (0, rentalService_1.getRentalDetail)(req.params.id);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', (0, auth_1.requirePermission)('rental:create'), idempotency_1.idempotencyMiddleware, (0, validate_1.validateRequest)(validation_1.createRentalSchema), async (req, res, next) => {
    try {
        const rental = await (0, rentalService_1.createRental)({
            ...req.body,
            operatorId: req.user.id,
            operatorName: req.user.name,
            operatorRole: req.user.role,
            idempotencyKey: req.idempotencyKey,
        });
        res.json({ success: true, data: rental, message: '租赁创建成功' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/return', (0, auth_1.requirePermission)('rental:return'), idempotency_1.idempotencyMiddleware, (0, validate_1.validateRequest)(validation_1.returnRentalSchema), async (req, res, next) => {
    try {
        const rental = await (0, rentalService_1.returnRental)({
            ...req.body,
            rentalId: req.params.id,
            operatorId: req.user.id,
            operatorName: req.user.name,
            operatorRole: req.user.role,
            idempotencyKey: req.idempotencyKey,
        });
        res.json({ success: true, data: rental, message: '归还成功' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
