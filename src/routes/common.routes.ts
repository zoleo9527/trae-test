import { Router } from 'express';
import Joi from 'joi';
import { UserRole, EvidenceType } from '@prisma/client';
import prisma from '../utils/prisma';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { idempotency } from '../middleware/idempotency';

const router = Router();

const idParamsSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const commentBodySchema = Joi.object({
  content: Joi.string().required()
});

const evidenceBodySchema = Joi.object({
  type: Joi.string().valid(...Object.values(EvidenceType)).required(),
  url: Joi.string().required(),
  description: Joi.string().optional()
});

const auditLogQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20)
});

router.get(
  '/users',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true
        }
      });
      res.json({
        code: 'SUCCESS',
        data: users
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/projects',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const projects = await prisma.project.findMany({
        include: {
          _count: {
            select: { materials: true }
          }
        }
      });
      res.json({
        code: 'SUCCESS',
        data: projects
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/projects/:id',
  authenticate,
  validate({ params: idParamsSchema }),
  async (req: AuthRequest, res, next) => {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        include: {
          materials: {
            select: {
              id: true,
              name: true,
              category: true,
              status: true,
              createdAt: true
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({
          code: 'PROJECT_NOT_FOUND',
          message: '项目不存在'
        });
      }

      res.json({
        code: 'SUCCESS',
        data: project
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/materials/:id/audit-logs',
  authenticate,
  validate({ params: idParamsSchema, query: auditLogQuerySchema }),
  async (req: AuthRequest, res, next) => {
    try {
      const { page = 1, pageSize = 20 } = req.query as any;
      const skip = (parseInt(page) - 1) * parseInt(pageSize);

      const [total, data] = await Promise.all([
        prisma.auditLog.count({ where: { materialId: req.params.id } }),
        prisma.auditLog.findMany({
          where: { materialId: req.params.id },
          include: {
            user: { select: { name: true, role: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(pageSize)
        })
      ]);

      res.json({
        code: 'SUCCESS',
        data: {
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / parseInt(pageSize)),
          data
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/materials/:id/comments',
  authenticate,
  idempotency,
  requireRoles(UserRole.SUPERVISOR, UserRole.PROJECT_MANAGER, UserRole.CUSTOMER_SERVICE),
  validate({ params: idParamsSchema, body: commentBodySchema }),
  async (req: AuthRequest, res, next) => {
    try {
      const material = await prisma.material.findUnique({ where: { id: req.params.id } });
      if (!material) {
        return res.status(404).json({
          code: 'MATERIAL_NOT_FOUND',
          message: '主材不存在'
        });
      }

      const comment = await prisma.comment.create({
        data: {
          materialId: req.params.id,
          content: req.body.content,
          authorId: req.user!.id
        },
        include: {
          author: { select: { id: true, name: true, role: true } }
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'ADD_COMMENT',
          materialId: req.params.id,
          details: JSON.stringify({ content: req.body.content }),
          ipAddress: req.ip
        }
      });

      res.status(201).json({
        code: 'SUCCESS',
        message: '评论添加成功',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/materials/:id/evidences',
  authenticate,
  idempotency,
  requireRoles(UserRole.SUPERVISOR, UserRole.PROJECT_MANAGER),
  validate({ params: idParamsSchema, body: evidenceBodySchema }),
  async (req: AuthRequest, res, next) => {
    try {
      const material = await prisma.material.findUnique({ where: { id: req.params.id } });
      if (!material) {
        return res.status(404).json({
          code: 'MATERIAL_NOT_FOUND',
          message: '主材不存在'
        });
      }

      const evidence = await prisma.evidence.create({
        data: {
          materialId: req.params.id,
          type: req.body.type,
          url: req.body.url,
          description: req.body.description,
          uploadedBy: req.user!.id
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPLOAD_EVIDENCE',
          materialId: req.params.id,
          details: JSON.stringify({ type: req.body.type }),
          ipAddress: req.ip
        }
      });

      res.status(201).json({
        code: 'SUCCESS',
        message: '证据上传成功',
        data: evidence
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
