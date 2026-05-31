import express from 'express';
import prisma from '../utils/prisma.js';
import { success, error } from '../utils/response.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', auth, (req, res) => {
  success(res, req.user);
});

router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        recipeItems: { include: { material: true } },
      },
    });
    success(res, products);
  } catch (err) {
    error(res, err.message);
  }
});

router.get('/dashboard/summary', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      pendingOrders,
      todayProductions,
      lowStockMaterials,
      recentWaste,
      pendingRefunds
    ] = await Promise.all([
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.production.count({
        where: { scheduledDate: { gte: today, lt: tomorrow } }
      }),
      prisma.material.count({
        where: { currentStock: { lte: prisma.material.fields.minStock } }
      }),
      prisma.wasteRecord.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { material: true, recordedBy: { select: { name: true } } }
      }),
      prisma.refund.count({ where: { status: 'PENDING' } })
    ]);

    success(res, {
      pendingOrders,
      todayProductions,
      lowStockMaterials,
      pendingRefunds,
      recentWaste
    });
  } catch (err) {
    error(res, err.message);
  }
});

export default router;
