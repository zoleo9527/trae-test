import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { paginationSchema } from '../validations';
import { AuthenticatedRequest, ApiResponse, Role, ROLE } from '../types';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireRole([ROLE.BASE_MANAGER, ROLE.MAINTENANCE_WORKER, ROLE.SALES_COORDINATOR]),
  validate(paginationSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const skip = (page - 1) * pageSize;

      const [items, total] = await Promise.all([
        prisma.plot.findMany({
          where: { isActive: true },
          skip,
          take: pageSize,
          orderBy: { plotNo: 'asc' },
          include: {
            batches: {
              where: { status: 'GROWING' },
              orderBy: { plantingDate: 'desc' },
              take: 3,
            },
            _count: {
              select: {
                batches: true,
                harvests: true,
              },
            },
          },
        }),
        prisma.plot.count({ where: { isActive: true } }),
      ]);

      res.json({
        success: true,
        data: items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
      });
    }
  }
);

router.get(
  '/:id',
  requireRole([ROLE.BASE_MANAGER, ROLE.MAINTENANCE_WORKER, ROLE.SALES_COORDINATOR]),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      const plot = await prisma.plot.findUnique({
        where: { id, isActive: true },
        include: {
          batches: {
            orderBy: { plantingDate: 'desc' },
          },
          harvests: {
            take: 10,
            orderBy: { scheduledDate: 'desc' },
            include: {
              loadings: { take: 5 },
            },
          },
        },
      });

      if (!plot) {
        return res.status(404).json({
          success: false,
          error: '地块不存在',
        });
      }

      res.json({
        success: true,
        data: plot,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
      });
    }
  }
);

export default router;
