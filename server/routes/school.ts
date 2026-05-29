import { Router } from 'express';
import { db } from '../database/mockData';
import { authenticateToken, AuthRequest, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/partners', authenticateToken, (req, res) => {
  res.json(db.schoolPartners);
});

router.get('/invoices', authenticateToken, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 10, status, schoolPartnerId } = req.query as any;

  let filteredData = [...db.schoolInvoices];

  if (status) {
    filteredData = filteredData.filter((i) => i.status === status);
  }

  if (schoolPartnerId) {
    filteredData = filteredData.filter((i) => i.schoolPartnerId === schoolPartnerId);
  }

  filteredData.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = filteredData.length;
  const start = (Number(page) - 1) * Number(pageSize);
  const data = filteredData.slice(start, start + Number(pageSize));

  res.json({
    data,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});

router.get(
  '/invoices/:id',
  authenticateToken,
  requireRoles('store_owner', 'admin'),
  (req, res) => {
    const invoice = db.schoolInvoices.find((i) => i.id === req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: '账单不存在' });
    }
    res.json(invoice);
  }
);

router.post(
  '/invoices/:id/mark-paid',
  authenticateToken,
  requireRoles('store_owner', 'admin'),
  (req: AuthRequest, res) => {
    const invoiceIdx = db.schoolInvoices.findIndex(
      (i) => i.id === req.params.id
    );
    if (invoiceIdx === -1) {
      return res.status(404).json({ error: '账单不存在' });
    }

    const { amount } = req.body;

    db.schoolInvoices[invoiceIdx].paidAmount += amount;
    db.schoolInvoices[invoiceIdx].balance =
      db.schoolInvoices[invoiceIdx].totalAmount -
      db.schoolInvoices[invoiceIdx].paidAmount;

    if (db.schoolInvoices[invoiceIdx].balance <= 0) {
      db.schoolInvoices[invoiceIdx].status = 'paid';
      db.schoolInvoices[invoiceIdx].paidAt = new Date().toISOString();
    }

    res.json(db.schoolInvoices[invoiceIdx]);
  }
);

router.get('/statistics', authenticateToken, (req, res) => {
  const activeRentals = db.rentals.filter(
    (r) => r.source === 'school_partner' && r.status === 'active'
  ).length;

  const totalOutstanding = db.schoolInvoices.reduce(
    (sum, i) => sum + i.balance,
    0
  );

  const overdueInvoices = db.schoolInvoices.filter(
    (i) => i.status === 'sent' && new Date(i.dueDate) < new Date()
  ).length;

  const thisMonthRevenue = db.schoolInvoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  res.json({
    activeRentals,
    totalOutstanding,
    overdueInvoices,
    thisMonthRevenue,
  });
});

export default router;
