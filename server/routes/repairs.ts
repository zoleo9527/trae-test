import { Router } from 'express';
import { db } from '../database/mockData';
import { authenticateToken, AuthRequest, requireRoles } from '../middleware/auth';
import { PaginatedResult, Repair, PartUsage } from '../../src/types';

const router = Router();

router.get('/', authenticateToken, (req: AuthRequest, res) => {
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
  (req: AuthRequest, res) => {
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
  (req: AuthRequest, res) => {
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
  (req: AuthRequest, res) => {
    const repairIdx = db.repairs.findIndex((r) => r.id === req.params.id);
    if (repairIdx === -1) {
      return res.status(404).json({ error: '维修单不存在' });
    }

    const part: PartUsage = req.body;
    part.totalCost = part.quantity * part.unitCost;

    db.repairs[repairIdx].partsUsed.push(part);
    db.repairs[repairIdx].totalPartsCost = db.repairs[repairIdx].partsUsed.reduce(
      (sum, p) => sum + p.totalCost,
      0
    );
    db.repairs[repairIdx].totalRepairCost =
      db.repairs[repairIdx].totalPartsCost +
      db.repairs[repairIdx].totalLaborCost;

    res.json(db.repairs[repairIdx]);
  }
);

router.post(
  '/:id/complete',
  authenticateToken,
  requireRoles('repair_technician', 'admin'),
  (req: AuthRequest, res) => {
    const repairIdx = db.repairs.findIndex((r) => r.id === req.params.id);
    if (repairIdx === -1) {
      return res.status(404).json({ error: '维修单不存在' });
    }

    const { diagnosis, laborHours } = req.body;

    if (diagnosis) db.repairs[repairIdx].diagnosis = diagnosis;
    if (laborHours) {
      db.repairs[repairIdx].laborHours = laborHours;
      db.repairs[repairIdx].totalLaborCost =
        laborHours * db.repairs[repairIdx].laborRate;
    }

    db.repairs[repairIdx].totalRepairCost =
      db.repairs[repairIdx].totalPartsCost +
      db.repairs[repairIdx].totalLaborCost;

    db.repairs[repairIdx].status = 'completed';
    db.repairs[repairIdx].completedAt = new Date().toISOString();

    res.json(db.repairs[repairIdx]);
  }
);

export default router;
