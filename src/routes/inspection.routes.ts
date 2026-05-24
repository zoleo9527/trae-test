import { Router } from 'express';
import Joi from 'joi';
import { InspectionType, EvidenceType, UserRole } from '@prisma/client';
import { inspectionService } from '../services/inspection.service';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

const createBodySchema = Joi.object({
  materialId: Joi.string().uuid().required(),
  type: Joi.string().valid(...Object.values(InspectionType)).required(),
  result: Joi.string().valid('PASS', 'FAIL').required(),
  status: Joi.string().required(),
  rejectionReason: Joi.string().optional(),
  supplementNote: Joi.string().optional(),
  evidences: Joi.array().items(Joi.object({
    type: Joi.string().valid(...Object.values(EvidenceType)).required(),
    url: Joi.string().required(),
    description: Joi.string().optional()
  })).optional()
});

const rejectBodySchema = Joi.object({
  rejectionReason: Joi.string().required()
});

const supplementBodySchema = Joi.object({
  supplementNote: Joi.string().required(),
  evidences: Joi.array().items(Joi.object({
    type: Joi.string().valid(...Object.values(EvidenceType)).required(),
    url: Joi.string().required(),
    description: Joi.string().optional()
  })).optional()
});

const commentBodySchema = Joi.object({
  content: Joi.string().required()
});

const idParamsSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const materialIdParamsSchema = Joi.object({
  materialId: Joi.string().uuid().required()
});

router.post(
  '/',
  authenticate,
  requireRoles(UserRole.SUPERVISOR),
  validate({ body: createBodySchema }),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await inspectionService.create(req.body, req.user!.id, req.ip);
      res.status(201).json({
        code: 'SUCCESS',
        message: '验收记录创建成功',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/material/:materialId',
  authenticate,
  validate({ params: materialIdParamsSchema }),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await inspectionService.getByMaterial(req.params.materialId);
      res.json({
        code: 'SUCCESS',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/reject',
  authenticate,
  requireRoles(UserRole.SUPERVISOR),
  validate({ params: idParamsSchema, body: rejectBodySchema }),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await inspectionService.reject(
        req.params.id,
        req.body.rejectionReason,
        req.user!.id,
        req.ip
      );
      res.json({
        code: 'SUCCESS',
        message: '驳回成功',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/supplement',
  authenticate,
  requireRoles(UserRole.SUPERVISOR, UserRole.PROJECT_MANAGER),
  validate({ params: idParamsSchema, body: supplementBodySchema }),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await inspectionService.supplement(
        req.params.id,
        req.body,
        req.user!.id,
        req.ip
      );
      res.json({
        code: 'SUCCESS',
        message: '补录成功',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/comments',
  authenticate,
  requireRoles(UserRole.SUPERVISOR, UserRole.PROJECT_MANAGER, UserRole.CUSTOMER_SERVICE),
  validate({ params: idParamsSchema, body: commentBodySchema }),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await inspectionService.addComment(
        req.params.id,
        req.body.content,
        req.user!.id
      );
      res.status(201).json({
        code: 'SUCCESS',
        message: '评论添加成功',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
