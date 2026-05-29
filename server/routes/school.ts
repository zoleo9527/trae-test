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

    const invoice = db.schoolInvoices[invoiceIdx];
    const { amount } = req.body;

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: '账单已结清，无需重复回款' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: '回款金额必须大于0' });
    }

    const remaining = invoice.totalAmount - invoice.paidAmount;
    const actualPayment = Math.min(amount, remaining);

    invoice.paidAmount += actualPayment;
    invoice.balance = invoice.totalAmount - invoice.paidAmount;

    if (invoice.balance <= 0) {
      invoice.status = 'paid';
      invoice.paidAt = new Date().toISOString();
    } else {
      invoice.status = 'sent';
    }

    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      entityType: 'invoice',
      entityId: invoice.id,
      action: 'payment_recorded',
      changes: {
        paidAmount: { old: invoice.paidAmount - actualPayment, new: invoice.paidAmount },
        balance: { old: invoice.balance + actualPayment, new: invoice.balance },
        status: { old: invoice.status, new: invoice.status },
      },
      performedBy: req.user!.id,
      performedByName: req.user!.name,
      performedAt: new Date().toISOString(),
    });

    res.json({
      ...invoice,
      _meta: {
        requestedAmount: amount,
        actualPayment,
        wasCapped: amount > remaining,
      },
    });
  }
);

router.get('/statistics', authenticateToken, (req, res) => {
  const activeRentals = db.rentals.filter(
    (r) => r.source === 'school_partner' && r.status === 'active'
  ).length;

  const totalOutstanding = db.schoolInvoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + i.balance, 0);

  const overdueInvoices = db.schoolInvoices.filter(
    (i) => i.status === 'sent' && new Date(i.dueDate) < new Date()
  ).length;

  const totalPaid = db.schoolInvoices.reduce(
    (sum, i) => sum + i.paidAmount,
    0
  );

  const fullySettled = db.schoolInvoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  res.json({
    activeRentals,
    totalOutstanding,
    overdueInvoices,
    thisMonthRevenue: fullySettled,
    totalPaid,
  });
});

export default router;
