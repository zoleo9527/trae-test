import { Router } from 'express';
import Joi from 'joi';
import { MaterialStatus, UserRole } from '@prisma/client';
import { materialService } from '../services/material.service';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { idempotency } from '../middleware/idempotency';
import { createObjectCsvWriter } from 'csv-writer';

const router = Router();

const createBodySchema = Joi.object({
  projectId: Joi.string().required(),
  name: Joi.string().required(),
  category: Joi.string().required(),
  brand: Joi.string().required(),
  model: Joi.string().required(),
  quantity: Joi.number().integer().positive().required(),
  unit: Joi.string().required(),
  estimatedPrice: Joi.number().optional(),
  expectedArrivalDate: Joi.date().optional()
});

const listQuerySchema = Joi.object({
  projectId: Joi.string().optional(),
  status: Joi.string().valid(...Object.values(MaterialStatus)).optional(),
  category: Joi.string().optional(),
  keyword: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20)
});

const statusBodySchema = Joi.object({
  status: Joi.string().valid(...Object.values(MaterialStatus)).required()
});

const assignBodySchema = Joi.object({
  handlerId: Joi.string().required()
});

const idParamsSchema = Joi.object({
  id: Joi.string().uuid().required()
});

router.post(
  '/',
  authenticate,
  idempotency,
  requireRoles(UserRole.PROJECT_MANAGER, UserRole.SUPERVISOR),
  validate({ body: createBodySchema }),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await materialService.create(req.body, req.user!.id, req.ip);
      res.status(201).json({
        code: 'SUCCESS',
        message: '主材创建成功',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/',
  authenticate,
  validate({ query: listQuerySchema }),
  async (req: AuthRequest, res, next) => {
    try {
      const { projectId, status, category, keyword, page, pageSize } = req.query as any;
      const result = await materialService.list({
        projectId,
        status: status as MaterialStatus,
        category,
        keyword,
        page: parseInt(page || '1'),
        pageSize: parseInt(pageSize || '20')
      });
      res.json({
        code: 'SUCCESS',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/export',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const { projectId, status } = req.query as any;
      const data = await materialService.export({
        projectId,
        status: status as MaterialStatus
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=materials.csv');

      const csvWriter = createObjectCsvWriter({
        path: 'temp.csv',
        header: [
          { id: 'name', title: '主材名称' },
          { id: 'category', title: '分类' },
          { id: 'brand', title: '品牌' },
          { id: 'model', title: '型号' },
          { id: 'quantity', title: '数量' },
          { id: 'unit', title: '单位' },
          { id: 'status', title: '状态' },
          { id: 'projectName', title: '项目' },
          { id: 'creatorName', title: '创建人' },
          { id: 'handlerName', title: '处理人' },
          { id: 'createdAt', title: '创建时间' }
        ]
      });

      const records = data.map(m => ({
        name: m.name,
        category: m.category,
        brand: m.brand,
        model: m.model,
        quantity: m.quantity,
        unit: m.unit,
        status: m.status,
        projectName: m.project.name,
        creatorName: m.creator?.name || '',
        handlerName: m.handler?.name || '',
        createdAt: m.createdAt.toISOString()
      }));

      res.write('\uFEFF');
      csvWriter.writeRecords(records).then(() => {
        const fs = require('fs');
        const csv = fs.readFileSync('temp.csv', 'utf8');
        fs.unlinkSync('temp.csv');
        res.end(csv);
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  authenticate,
  validate({ params: idParamsSchema }),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await materialService.getDetail(req.params.id);
      res.json({
        code: 'SUCCESS',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id/status',
  authenticate,
  idempotency,
  requireRoles(UserRole.SUPERVISOR, UserRole.PROJECT_MANAGER),
  validate({ params: idParamsSchema, body: statusBodySchema }),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await materialService.updateStatus(
        req.params.id,
        req.body.status,
        req.user!.id,
        req.ip
      );
      res.json({
        code: 'SUCCESS',
        message: '状态更新成功',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id/assign',
  authenticate,
  idempotency,
  requireRoles(UserRole.PROJECT_MANAGER),
  validate({ params: idParamsSchema, body: assignBodySchema }),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await materialService.assignHandler(
        req.params.id,
        req.body.handlerId,
        req.user!.id,
        req.ip
      );
      res.json({
        code: 'SUCCESS',
        message: '分配成功',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
