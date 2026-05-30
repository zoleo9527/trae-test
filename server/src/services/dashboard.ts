import db from '../db';
import { DashboardOverview, TrendData } from '../types';

export function getOverview(): DashboardOverview {
  const today = new Date().toISOString().split('T')[0];

  const todayRecharge = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM wallet_transactions
    WHERE type = 'recharge' AND DATE(created_at) = ?
  `).get(today) as { total: number };

  const todayConsume = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM wallet_transactions
    WHERE type = 'consume' AND DATE(created_at) = ?
  `).get(today) as { total: number };

  const totalWallet = db.prepare(`
    SELECT COALESCE(SUM(principal_balance + gift_balance), 0) as total
    FROM wallets
  `).get() as { total: number };

  const totalPrincipal = db.prepare(`
    SELECT COALESCE(SUM(principal_balance), 0) as total
    FROM wallets
  `).get() as { total: number };

  const totalGift = db.prepare(`
    SELECT COALESCE(SUM(gift_balance), 0) as total
    FROM wallets
  `).get() as { total: number };

  const todayBookings = db.prepare(`
    SELECT COUNT(*) as count
    FROM bookings
    WHERE booking_date = ? AND status IN ('checked_in', 'completed')
  `).get(today) as { count: number };

  const totalBays = db.prepare(`
    SELECT COUNT(*) as count
    FROM bays
    WHERE status = 'available'
  `).get() as { count: number };

  const bayUtilization = totalBays.count > 0 ? Math.round((todayBookings.count / (totalBays.count * 12)) * 100) : 0;

  const pendingExceptions = db.prepare(`
    SELECT COUNT(*) as count
    FROM exceptions
    WHERE status IN ('pending', 'processing')
  `).get() as { count: number };

  const pendingReconciliation = db.prepare(`
    SELECT COUNT(*) as count
    FROM reconciliations
    WHERE status = 'pending'
  `).get() as { count: number };

  return {
    today_revenue: todayRecharge.total,
    total_wallet_balance: totalWallet.total,
    total_principal_balance: totalPrincipal.total,
    total_gift_balance: totalGift.total,
    today_bookings: todayBookings.count,
    bay_utilization: bayUtilization,
    pending_exceptions: pendingExceptions.count,
    pending_reconciliation: pendingReconciliation.count
  };
}

export function getTrends(days: number = 7): TrendData[] {
  const dateArray: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dateArray.push(date.toISOString().split('T')[0]);
  }

  const placeholders = dateArray.map(() => '?').join(', ');

  const data = db.prepare(`
    SELECT
      DATE(created_at) as date,
      COALESCE(SUM(CASE WHEN type = 'recharge' THEN amount ELSE 0 END), 0) as recharge,
      COALESCE(SUM(CASE WHEN type = 'consume' THEN amount ELSE 0 END), 0) as consume
    FROM wallet_transactions
    WHERE DATE(created_at) IN (${placeholders})
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all(...dateArray) as { date: string; recharge: number; consume: number }[];

  const bookingData = db.prepare(`
    SELECT
      booking_date as date,
      COUNT(*) as bookings
    FROM bookings
    WHERE booking_date IN (${placeholders})
    GROUP BY booking_date
    ORDER BY date
  `).all(...dateArray) as { date: string; bookings: number }[];

  const result: TrendData[] = dateArray.map(date => {
    const dayData = data.find(d => d.date === date) || { date, recharge: 0, consume: 0 };
    const dayBooking = bookingData.find(b => b.date === date) || { date, bookings: 0 };
    return {
      date,
      recharge: dayData.recharge,
      consume: dayData.consume,
      bookings: dayBooking.bookings
    };
  });

  return result;
}
