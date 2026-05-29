"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const idempotency_1 = require("../middleware/idempotency");
const validate_1 = require("../middleware/validate");
const validation_1 = require("../lib/validation");
const damageClaimService_1 = require("../services/damageClaimService");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.requirePermission)('damage:read'), async (req, res, next) => {
    try {
        const { status, rentalId, instrumentId, page, pageSize } = req.query;
        const result = await (0, damageClaimService_1.getDamageClaimList)(status, rentalId, instrumentId, Number(page) || 1, Number(pageSize) || 20);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', (0, auth_1.requirePermission)('damage:read'), async (req, res, next) => {
    try {
        const result = await (0, damageClaimService_1.getDamageClaimDetail)(req.params.id);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id/evidence', (0, auth_1.requirePermission)('damage:read'), async (req, res, next) => {
    try {
        const result = await (0, damageClaimService_1.getEvidenceChain)(req.params.id);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', (0, auth_1.requirePermission)('damage:create'), idempotency_1.idempotencyMiddleware, (0, validate_1.validateRequest)(validation_1.createDamageClaimSchema), async (req, res, next) => {
    try {
        const claim = await (0, damageClaimService_1.createDamageClaim)({
            ...req.body,
            operatorId: req.user.id,
            operatorName: req.user.name,
            operatorRole: req.user.role,
            idempotencyKey: req.idempotencyKey,
        });
        res.json({ success: true, data: claim, message: '损坏申诉创建成功' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/confirm', (0, auth_1.requirePermission)('damage:report'), idempotency_1.idempotencyMiddleware, async (req, res, next) => {
    try {
        const claim = await (0, damageClaimService_1.confirmDamageClaim)(req.params.id, req.user.id, req.user.name, req.user.role, req.idempotencyKey);
        res.json({ success: true, data: claim, message: '损坏判定已确认' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/dispute', (0, auth_1.requirePermission)('damage:report'), idempotency_1.idempotencyMiddleware, (0, validate_1.validateRequest)(validation_1.disputeDamageClaimSchema), async (req, res, next) => {
    try {
        const claim = await (0, damageClaimService_1.disputeDamageClaim)({
            ...req.body,
            claimId: req.params.id,
            operatorId: req.user.id,
            operatorName: req.user.name,
            operatorRole: req.user.role,
            idempotencyKey: req.idempotencyKey,
        });
        res.json({ success: true, data: claim, message: '客户申诉已提交' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/reject', (0, auth_1.requirePermission)('damage:resolve'), idempotency_1.idempotencyMiddleware, (0, validate_1.validateRequest)(validation_1.rejectDisputeSchema), async (req, res, next) => {
    try {
        const claim = await (0, damageClaimService_1.rejectDispute)({
            ...req.body,
            claimId: req.params.id,
            operatorId: req.user.id,
            operatorName: req.user.name,
            operatorRole: req.user.role,
            idempotencyKey: req.idempotencyKey,
        });
        res.json({ success: true, data: claim, message: '申诉已驳回' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/resolve', (0, auth_1.requirePermission)('damage:resolve'), idempotency_1.idempotencyMiddleware, (0, validate_1.validateRequest)(validation_1.resolveDisputeSchema), async (req, res, next) => {
    try {
        const claim = await (0, damageClaimService_1.resolveDispute)({
            ...req.body,
            claimId: req.params.id,
            operatorId: req.user.id,
            operatorName: req.user.name,
            operatorRole: req.user.role,
            idempotencyKey: req.idempotencyKey,
        });
        res.json({ success: true, data: claim, message: '申诉已通过，重新判定完成' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/close', (0, auth_1.requirePermission)('damage:close'), idempotency_1.idempotencyMiddleware, async (req, res, next) => {
    try {
        const claim = await (0, damageClaimService_1.closeDamageClaim)(req.params.id, req.user.id, req.user.name, req.user.role, req.idempotencyKey);
        res.json({ success: true, data: claim, message: '损坏申诉已结案' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
