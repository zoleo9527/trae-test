import { Router } from 'express';
import { db } from '../database/mockData';
import { authenticateToken, AuthRequest, requireRoles } from '../middleware/auth';
import { PaginatedResult, Return } from '../../src/types';

const router = Router();

router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'returnedAt',
    sortDirection = 'desc',
    search,
    status,
  } = req.query as any;

  let filteredData = [...db.returns];

  if (search) {
    const searchLower = search.toLowerCase();
    filteredData = filteredData.filter((r) =>
      r.rentalNumber.toLowerCase().includes(searchLower)
    );
  }

  if (status) {
    filteredData = filteredData.filter((r) => r.status === status);
  }

  filteredData.sort((a: any, b: any) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const modifier = sortDirection === 'asc' ? 1 : -1;
    return aVal > bVal ? modifier : -modifier;
  });

  const total = filteredData.length;
  const start = (Number(page) - 1) * Number(pageSize);
  const data = filteredData.slice(start, start + Number(pageSize));

  const result: PaginatedResult<Return> = {
    data,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  };

  res.json(result);
});

router.get('/pending-review', authenticateToken, (req, res) => {
  const pending = db.returns.filter((r) => r.status === 'pending_review');
  res.json(pending);
});

router.post(
  '/:id/review',
  authenticateToken,
  requireRoles('store_owner', 'admin'),
  (req: AuthRequest, res) => {
    const returnIdx = db.returns.findIndex((r) => r.id === req.params.id);
    if (returnIdx === -1) {
      return res.status(404).json({ error: '归还记录不存在' });
    }

    const { action, notes } = req.body;

    if (action === 'approve') {
      db.returns[returnIdx].status = 'reviewed';
      db.returns[returnIdx].reviewedBy = req.user!.id;
      db.returns[returnIdx].reviewedByName = req.user!.name;
      db.returns[returnIdx].reviewedAt = new Date().toISOString();
    } else if (action === 'dispute') {
      db.returns[returnIdx].status = 'disputed';
    }

    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      entityType: 'return',
      entityId: req.params.id,
      action: action === 'approve' ? 'reviewed' : 'disputed',
      changes: {
        status: {
          old: 'pending_review',
          new: action === 'approve' ? 'reviewed' : 'disputed',
        },
      },
      performedBy: req.user!.id,
      performedByName: req.user!.name,
      performedAt: new Date().toISOString(),
    });

    res.json(db.returns[returnIdx]);
  }
);

router.post(
  '/batch-review',
  authenticateToken,
  requireRoles('store_owner', 'admin'),
  (req: AuthRequest, res) => {
    const { ids, action } = req.body;
    const results: { id: string; success: boolean; message?: string }[] = [];

    ids.forEach((id: string) => {
      const returnIdx = db.returns.findIndex((r) => r.id === id);
      if (returnIdx === -1) {
        results.push({ id, success: false, message: '记录不存在' });
        return;
      }

      if (db.returns[returnIdx].status !== 'pending_review') {
        results.push({ id, success: false, message: '状态不允许复核' });
        return;
      }

      if (action === 'approve') {
        db.returns[returnIdx].status = 'reviewed';
        db.returns[returnIdx].reviewedBy = req.user!.id;
        db.returns[returnIdx].reviewedByName = req.user!.name;
        db.returns[returnIdx].reviewedAt = new Date().toISOString();
      } else if (action === 'dispute') {
        db.returns[returnIdx].status = 'disputed';
      }

      results.push({ id, success: true });
    });

    res.json({ results, processed: results.filter((r) => r.success).length });
  }
);

export default router;
