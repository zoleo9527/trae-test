import { Router } from 'express';
import chainService from '../services/chainService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/:chainId', async (req, res, next) => {
  try {
    const chainDetail = await chainService.getChainDetail(req.params.chainId);
    res.json({
      success: true,
      data: chainDetail,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/plan/:berthingPlanId', async (req, res, next) => {
  try {
    const chainDetail = await chainService.getChainByPlanId(req.params.berthingPlanId);
    res.json({
      success: true,
      data: chainDetail,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:chainId/timeline', async (req, res, next) => {
  try {
    const timeline = await chainService.getChainTimeline(req.params.chainId);
    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:chainId/stats', async (req, res, next) => {
  try {
    const stats = await chainService.getChainStats(req.params.chainId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/my/list', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
    };
    const chains = await chainService.getUserChains(req.user.id, filters);
    res.json({
      success: true,
      data: chains,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
