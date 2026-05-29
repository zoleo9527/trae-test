import { Request, Response } from 'express';
import { exportData } from '../services/export';

export async function exportController(req: Request, res: Response) {
  await exportData(req.query as unknown as any, req.user, res, req);
}

export { exportController as exportDataController };
