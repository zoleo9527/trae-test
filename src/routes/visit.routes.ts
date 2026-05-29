import { Router, Response } from 'express';
import visitService from '../services/visit.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { requireIdempotency, checkIdempotency } from '../middleware/idempotency.middleware';
import { validate } from '../middleware/validation.middleware';
import { createVisitSchema, markFollowedUpSchema, paginationSchema } from '../validations';
import { AuthenticatedRequest, ApiResponse, Role, VisitResult, ROLE, VISIT_RESULT } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole([ROLE.SALES_COORDINATOR, ROLE.BASE_MANAGER]),
  requireIdempotency,
  checkIdempotency,
  validate(createVisitSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const result = await visitService.createVisit({
        ...req.body,
        idempotencyKey: req.idempotencyKey || uuidv4(),
        salesId: req.user.userId,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: '回访记录创建成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建失败',
      });
    }
  }
);

router.get(
  '/',
  requireRole([ROLE.BASE_MANAGER, ROLE.SALES_COORDINATOR]),
  validate(paginationSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const { customerName, result, hasComplaint, isFollowedUp } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const listResult = await visitService.getVisitList({
        salesId: req.user.role === ROLE.SALES_COORDINATOR ? req.user.userId : undefined,
        customerName: customerName as string,
        result: result as VisitResult,
        hasComplaint: hasComplaint === 'true',
        isFollowedUp: isFollowedUp === 'true',
        page,
        pageSize,
      });

      res.json({
        success: true,
        data: listResult.items,
        pagination: listResult.pagination,
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
  requireRole([ROLE.BASE_MANAGER, ROLE.SALES_COORDINATOR]),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const { id } = req.params;
      const result = await visitService.getVisitDetail(
        id,
        req.user.userId,
        req.user.role
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          error: '回访记录不存在',
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(error instanceof Error && error.message.includes('权限不足') ? 403 : 500).json({
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
      });
    }
  }
);

router.patch(
  '/:id/followup',
  requireRole([ROLE.SALES_COORDINATOR]),
  requireIdempotency,
  checkIdempotency,
  validate(markFollowedUpSchema),
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    try {
      if (!req.user) throw new Error('用户未认证');

      const { id } = req.params;
      const { followUpNote } = req.body;

      const result = await visitService.markFollowedUp(
        id,
        req.user.userId,
        followUpNote
      );

      res.json({
        success: true,
        data: result,
        message: '跟进完成',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '操作失败',
      });
    }
  }
);

export default router;
