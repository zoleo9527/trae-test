import { Router } from 'express';
import { db } from '../database/mockData';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Rental, FilterOptions, PaginatedResult } from '../../src/types';

const router = Router();

router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    sortDirection = 'desc',
    search,
    status,
    source,
  } = req.query as FilterOptions;

  let filteredData = [...db.rentals];

  if (search) {
    const searchLower = search.toLowerCase();
    filteredData = filteredData.filter(
      (r) =>
        r.rentalNumber.toLowerCase().includes(searchLower) ||
        r.customerName.toLowerCase().includes(searchLower)
    );
  }

  if (status) {
    filteredData = filteredData.filter((r) => r.status === status);
  }

  if (source) {
    filteredData = filteredData.filter((r) => r.source === source);
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

  const result: PaginatedResult<Rental> = {
    data,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  };

  res.json(result);
});

router.get('/:id', authenticateToken, (req, res) => {
  const rental = db.rentals.find((r) => r.id === req.params.id);
  if (!rental) {
    return res.status(404).json({ error: '租出单不存在' });
  }

  const returnRecord = db.returns.find((r) => r.rentalId === rental.id);
  const repairs = db.repairs.filter((r) => r.rentalId === rental.id);

  res.json({
    rental,
    return: returnRecord,
    repairs,
  });
});

router.get('/:id/history', authenticateToken, (req, res) => {
  const logs = db.auditLogs.filter(
    (l) => l.entityType === 'rental' && l.entityId === req.params.id
  );
  res.json(logs);
});

export default router;
