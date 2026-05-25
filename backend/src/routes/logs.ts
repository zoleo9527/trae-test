import { Router } from 'express';
import { db } from '../data/database';
import { AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireRole('THEATER_MANAGER', 'TICKET_SUPERVISOR', 'BACKEND_COORDINATOR'), async (req: AuthRequest, res) => {
  try {
    const { targetType, userId, action, limit = 50, offset = 0 } = req.query;

    let logs = [...db.operationLogs];

    if (targetType) {
      logs = logs.filter((l) => l.targetType === targetType);
    }
    if (userId) {
      logs = logs.filter((l) => l.userId === userId);
    }
    if (action) {
      logs = logs.filter((l) => l.action.includes(action as string));
    }

    const paginatedLogs = logs.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      total: logs.length,
      logs: paginatedLogs,
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const pendingOrders = db.groupOrders.filter((o) => o.status === 'PENDING').length;
    const pendingRefunds = db.refundRequests.filter((r) => r.status === 'PENDING' || r.status === 'APPROVED_TICKET').length;
    const modifiedShows = db.shows.filter((s) => s.status === 'MODIFIED').length;
    const unsettledAmount = db.groupOrders
      .filter((o) => o.settlement && o.settlement.status !== 'SETTLED')
      .reduce((sum, o) => sum + (o.settlement?.netAmount || 0) - (o.settlement?.paidAmount || 0), 0);

    const recentActivities = db.operationLogs.slice(0, 10);

    res.json({
      pendingOrders,
      pendingRefunds,
      modifiedShows,
      unsettledAmount,
      recentActivities,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
