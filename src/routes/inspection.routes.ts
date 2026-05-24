import { Router } from 'express';
import Joi from 'joi';
import { InspectionType, EvidenceType } from '@prisma/client';
import { inspectionService } from '../services/inspection.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

const createSchema = Joi.object({
  body: Joi.object({
    materialId: Joi.string().required(),
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
  })
});

const rejectSchema = Joi.object({
  body: Joi.object({
    rejectionReason: Joi.string().required()
  })
});

const supplementSchema = Joi.object({
  body: Joi.object({
    supplementNote: Joi.string().required(),
    evidences: Joi.array().items(Joi.object({
      type: Joi.string().valid(...Object.values(EvidenceType)).required(),
      url: Joi.string().required(),
      description: Joi.string().optional()
    })).optional()
  })
});

const commentSchema = Joi.object({
  body: Joi.object({
    content: Joi.string().required()
  })
});

router.post('/', authenticate, validate(createSchema), async (req: AuthRequest, res, next) => {
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
});

router.get('/material/:materialId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await inspectionService.getByMaterial(req.params.materialId);
    res.json({
      code: 'SUCCESS',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reject', authenticate, validate(rejectSchema), async (req: AuthRequest, res, next) => {
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
});

router.post('/:id/supplement', authenticate, validate(supplementSchema), async (req: AuthRequest, res, next) => {
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
});

router.post('/:id/comments', authenticate, validate(commentSchema), async (req: AuthRequest, res, next) => {
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
});

export default router;
