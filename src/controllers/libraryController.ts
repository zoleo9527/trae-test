import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import { success, notFound, serverError, paginated } from '../utils/response';

export async function getLibraryList(req: AuthRequest, res: Response) {
  try {
    const { page, pageSize, keyword } = req.query as any;

    const where: any = { isActive: true };

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { address: { contains: keyword } },
      ];
    }

    const [total, libraries] = await Promise.all([
      prisma.library.count({ where }),
      prisma.library.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          manager: { select: { id: true, name: true, phone: true } },
          _count: { select: { activities: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return paginated(res, libraries, total, page, pageSize);
  } catch (err) {
    return serverError(res, err);
  }
}

export async function getLibraryDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const library = await prisma.library.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, phone: true } },
        activities: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!library) {
      return notFound(res, '书房不存在');
    }

    return success(res, library, '获取成功');
  } catch (err) {
    return serverError(res, err);
  }
}

export async function getLibraryStats(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const [totalActivities, totalRegistrations, totalCheckIns] = await Promise.all([
      prisma.activity.count({ where: { libraryId: id } }),
      prisma.registration.count({ where: { activity: { libraryId: id } } }),
      prisma.checkInRecord.count({ where: { activity: { libraryId: id } } }),
    ]);

    return success(
      res,
      {
        totalActivities,
        totalRegistrations,
        totalCheckIns,
      },
      '获取成功'
    );
  } catch (err) {
    return serverError(res, err);
  }
}
