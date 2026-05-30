import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard';

export async function getOverview(req: Request, res: Response) {
  const overview = dashboardService.getOverview();
  res.json({
    success: true,
    message: '获取成功',
    data: overview
  });
}

export async function getTrends(req: Request, res: Response) {
  const days = parseInt(req.query.days as string) || 7;
  const trends = dashboardService.getTrends(days);
  res.json({
    success: true,
    message: '获取成功',
    data: trends
  });
}
