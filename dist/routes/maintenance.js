"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const idempotency_1 = require("../middleware/idempotency");
const validate_1 = require("../middleware/validate");
const validation_1 = require("../lib/validation");
const maintenanceService_1 = require("../services/maintenanceService");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/summary', (0, auth_1.requirePermission)('maintenance:read'), async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const result = await (0, maintenanceService_1.getMaintenanceCostSummary)(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
router.get('/', (0, auth_1.requirePermission)('maintenance:read'), async (req, res, next) => {
    try {
        const { instrumentId, damageClaimId, status, page, pageSize } = req.query;
        const result = await (0, maintenanceService_1.getMaintenanceList)(instrumentId, damageClaimId, status, Number(page) || 1, Number(pageSize) || 20);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', (0, auth_1.requirePermission)('maintenance:read'), async (req, res, next) => {
    try {
        const result = await (0, maintenanceService_1.getMaintenanceDetail)(req.params.id);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', (0, auth_1.requirePermission)('maintenance:create'), idempotency_1.idempotencyMiddleware, (0, validate_1.validateRequest)(validation_1.createMaintenanceSchema), async (req, res, next) => {
    try {
        const maintenance = await (0, maintenanceService_1.createMaintenance)({
            ...req.body,
            operatorId: req.user.id,
            operatorName: req.user.name,
            operatorRole: req.user.role,
            idempotencyKey: req.idempotencyKey,
        });
        const response = { success: true, data: maintenance, message: '维修单创建成功' };
        if (req.idempotencyKey) {
            await (0, idempotency_1.saveIdempotentResponse)(req.idempotencyKey, response);
        }
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/complete', (0, auth_1.requirePermission)('maintenance:complete'), idempotency_1.idempotencyMiddleware, (0, validate_1.validateRequest)(validation_1.completeMaintenanceSchema), async (req, res, next) => {
    try {
        const maintenance = await (0, maintenanceService_1.completeMaintenance)({
            ...req.body,
            maintenanceId: req.params.id,
            operatorId: req.user.id,
            operatorName: req.user.name,
            operatorRole: req.user.role,
            idempotencyKey: req.idempotencyKey,
        });
        const response = { success: true, data: maintenance, message: '维修完成' };
        if (req.idempotencyKey) {
            await (0, idempotency_1.saveIdempotentResponse)(req.idempotencyKey, response);
        }
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
