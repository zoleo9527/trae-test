import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/users', authenticate, async (req: AuthRequest, res, next) => {
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
});

router.get('/projects', authenticate, async (req: AuthRequest, res, next) => {
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
});

router.get('/projects/:id', authenticate, async (req: AuthRequest, res, next) => {
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
    res.json({
      code: 'SUCCESS',
      data: project
    });
  } catch (error) {
    next(error);
  }
});

router.get('/materials/:id/audit-logs', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query as any;
    const result = await prisma.auditLog.findMany({
      where: { materialId: req.params.id },
      include: {
        user: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(pageSize),
      take: parseInt(pageSize)
    });
    res.json({
      code: 'SUCCESS',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.post('/materials/:id/comments', authenticate, async (req: AuthRequest, res, next) => {
  try {
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
    res.status(201).json({
      code: 'SUCCESS',
      message: '评论添加成功',
      data: comment
    });
  } catch (error) {
    next(error);
  }
});

router.post('/materials/:id/evidences', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const evidence = await prisma.evidence.create({
      data: {
        materialId: req.params.id,
        type: req.body.type,
        url: req.body.url,
        description: req.body.description,
        uploadedBy: req.user!.id
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
});

export default router;
