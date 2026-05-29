import express from 'express';
import next from 'next';
import cors from 'cors';
import authRoutes from './routes/auth';
import rentalRoutes from './routes/rentals';
import returnRoutes from './routes/returns';
import repairRoutes from './routes/repairs';
import schoolRoutes from './routes/school';
import { authenticateToken } from './middleware/auth';

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use(cors());
  server.use(express.json());

  server.use('/api/auth', authRoutes);
  server.use('/api/rentals', rentalRoutes);
  server.use('/api/returns', returnRoutes);
  server.use('/api/repairs', repairRoutes);
  server.use('/api/school', schoolRoutes);

  server.get('/api/dashboard', authenticateToken, (req, res) => {
    const { db } = require('./database/mockData');

    const activeRentals = db.rentals.filter(
      (r: any) => r.status === 'active'
    ).length;
    const pendingReturns = db.returns.filter(
      (r: any) => r.status === 'pending_review'
    ).length;
    const pendingRepairs = db.repairs.filter(
      (r: any) => r.status === 'pending'
    ).length;
    const inProgressRepairs = db.repairs.filter(
      (r: any) => r.status === 'in_progress'
    ).length;

    const thisMonthRentals = db.rentals.filter((r: any) => {
      const rentalDate = new Date(r.createdAt);
      const now = new Date();
      return (
        rentalDate.getMonth() === now.getMonth() &&
        rentalDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const totalPartsCost = db.repairs.reduce(
      (sum: number, r: any) => sum + r.totalPartsCost,
      0
    );

    res.json({
      activeRentals,
      pendingReturns,
      pendingRepairs,
      inProgressRepairs,
      thisMonthRentals,
      totalPartsCost,
    });
  });

  server.get('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`> Server running on http://localhost:${port}`);
    console.log(`> API running on http://localhost:${port}/api`);
  });
});
