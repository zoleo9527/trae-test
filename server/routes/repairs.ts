import { Router, Response } from 'express';
import { db } from '../database/mockData';
import { authenticateToken, AuthRequest, requireRoles } from '../middleware/auth';
import { PaginatedResult, Repair, PartUsage } from '../../src/types';

const router = Router();

function recalculateRepairCosts(repairIdx: number) {
  const repair = db.repairs[repairIdx];
  repair.totalLaborCost = repair.laborHours * repair.laborRate;
  repair.totalPartsCost = repair.partsUsed.reduce((sum, p) => sum + p.totalCost, 0);
  repair.totalRepairCost = repair.totalPartsCost + repair.totalLaborCost;
}

function syncReturnCosts(returnId: string | undefined) {
  if (!returnId) return;
  const returnIdx = db.returns.findIndex((r) => r.id === returnId);
  if (returnIdx === -1) return;

  const related = db.repairs.filter(
    (r) => r.returnId === returnId && r.status !== 'cancelled'
  );

  db.returns[returnIdx] = {
    ...db.returns[returnIdx],
    actualPartsCost: related.reduce((s, r) => s + r.totalPartsCost, 0),
    actualLaborCost: related.reduce((s, r) => s + r.totalLaborCost, 0),
    actualRepairCost: related.reduce((s, r) => s + r.totalRepairCost, 0),
  };
}

function applyLaborAndDiagnosis(repairIdx: number, body: { laborHours?: number; diagnosis?: string }) {
  if (body.laborHours !== undefined) {
    db.repairs[repairIdx].laborHours = body.laborHours;
  }
  if (body.diagnosis !== undefined) {
    db.repairs[repairIdx].diagnosis = body.diagnosis;
  }
  recalculateRepairCosts(repairIdx);
  syncReturnCosts(db.repairs[repairIdx].returnId);
}

router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    sortDirection = 'desc',
    search,
    status,
    priority,
    assignedTo,
  } = req.query as any;

  let filteredData = [...db.repairs];

  if (search) {
    const searchLower = search.toLowerCase();
    filteredData = filteredData.filter(
      (r) =>
        r.repairNumber.toLowerCase().includes(searchLower) ||
        r.instrumentName.toLowerCase().includes(searchLower)
    );
  }

  if (status) {
    filteredData = filteredData.filter((r) => r.status === status);
  }

  if (priority) {
    filteredData = filteredData.filter((r) => r.priority === priority);
  }

  if (assignedTo) {
    filteredData = filteredData.filter((r) => r.assignedTo === assignedTo);
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

  const result: PaginatedResult<Repair> = {
    data,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  };

  res.json(result);
});

router.get('/:id', authenticateToken, (req, res) => {
  const repair = db.repairs.find((r) => r.id === req.params.id);
  if (!repair) {
    return res.status(404).json({ error: '维修单不存在' });
  }
  res.json(repair);
});

router.post(
  '/:id/assign',
  authenticateToken,
  requireRoles('store_owner', 'admin', 'repair_technician'),
  (req: AuthRequest, res: Response) => {
    const repairIdx = db.repairs.findIndex((r) => r.id === req.params.id);
    if (repairIdx === -1) {
      return res.status(404).json({ error: '维修单不存在' });
    }

    const { technicianId, technicianName } = req.body;

    db.repairs[repairIdx].assignedTo = technicianId;
    db.repairs[repairIdx].assignedToName = technicianName;

    res.json(db.repairs[repairIdx]);
  }
);

router.post(
  '/:id/start',
  authenticateToken,
  requireRoles('repair_technician', 'admin'),
  (req: AuthRequest, res: Response) => {
    const repairIdx = db.repairs.findIndex((r) => r.id === req.params.id);
    if (repairIdx === -1) {
      return res.status(404).json({ error: '维修单不存在' });
    }

    db.repairs[repairIdx].status = 'in_progress';
    db.repairs[repairIdx].startedAt = new Date().toISOString();

    res.json(db.repairs[repairIdx]);
  }
);

router.post(
  '/:id/add-part',
  authenticateToken,
  requireRoles('repair_technician', 'admin'),
  (req: AuthRequest, res: Response) => {
    const repairIdx = db.repairs.findIndex((r) => r.id === req.params.id);
    if (repairIdx === -1) {
      return res.status(404).json({ error: '维修单不存在' });
    }

    const part: PartUsage = req.body;
    part.totalCost = part.quantity * part.unitCost;

    db.repairs[repairIdx].partsUsed.push(part);
    recalculateRepairCosts(repairIdx);
    syncReturnCosts(db.repairs[repairIdx].returnId);

    res.json(db.repairs[repairIdx]);
  }
);

router.post(
  '/:id/update-labor',
  authenticateToken,
  requireRoles('repair_technician', 'admin'),
  (req: AuthRequest, res: Response) => {
    const repairIdx = db.repairs.findIndex((r) => r.id === req.params.id);
    if (repairIdx === -1) {
      return res.status(404).json({ error: '维修单不存在' });
    }

    applyLaborAndDiagnosis(repairIdx, req.body);

    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      entityType: 'repair',
      entityId: db.repairs[repairIdx].id,
      action: 'labor_updated',
      changes: {
        laborHours: { old: null, new: db.repairs[repairIdx].laborHours },
        totalLaborCost: { old: null, new: db.repairs[repairIdx].totalLaborCost },
        totalRepairCost: { old: null, new: db.repairs[repairIdx].totalRepairCost },
      },
      performedBy: req.user!.id,
      performedByName: req.user!.name,
      performedAt: new Date().toISOString(),
    });

    res.json(db.repairs[repairIdx]);
  }
);

router.post(
  '/:id/complete',
  authenticateToken,
  requireRoles('repair_technician', 'admin'),
  (req: AuthRequest, res: Response) => {
    const repairIdx = db.repairs.findIndex((r) => r.id === req.params.id);
    if (repairIdx === -1) {
      return res.status(404).json({ error: '维修单不存在' });
    }

    applyLaborAndDiagnosis(repairIdx, req.body);

    db.repairs[repairIdx].status = 'completed';
    const completedAt = new Date().toISOString();
    db.repairs[repairIdx].completedAt = completedAt;

    const returnId = db.repairs[repairIdx].returnId;
    if (returnId) {
      syncReturnCosts(returnId);

      const returnIdx = db.returns.findIndex((r) => r.id === returnId);
      if (returnIdx !== -1) {
        db.returns[returnIdx].repairCompletedAt = completedAt;

        db.auditLogs.push({
          id: `audit-${Date.now()}`,
          entityType: 'return',
          entityId: returnId,
          action: 'repair_cost_updated',
          changes: {
            actualPartsCost: { old: null, new: db.returns[returnIdx].actualPartsCost },
            actualLaborCost: { old: null, new: db.returns[returnIdx].actualLaborCost },
            actualRepairCost: { old: null, new: db.returns[returnIdx].actualRepairCost },
          },
          performedBy: req.user!.id,
          performedByName: req.user!.name,
          performedAt: completedAt,
        });
      }
    }

    db.auditLogs.push({
      id: `audit-${Date.now() + 1}`,
      entityType: 'repair',
      entityId: db.repairs[repairIdx].id,
      action: 'completed',
      changes: {
        status: { old: 'in_progress', new: 'completed' },
        totalRepairCost: { old: null, new: db.repairs[repairIdx].totalRepairCost },
      },
      performedBy: req.user!.id,
      performedByName: req.user!.name,
      performedAt: completedAt,
    });

    res.json(db.repairs[repairIdx]);
  }
);

export default router;
