import prisma from '../utils/prisma';

export const auditService = {
  async log(userId: string, action: string, materialId?: string, details?: any, ipAddress?: string) {
    return prisma.auditLog.create({
      data: {
        userId,
        action,
        materialId,
        details: details ? JSON.stringify(details) : null,
        ipAddress
      }
    });
  },

  async getLogs(materialId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where: { materialId } }),
      prisma.auditLog.findMany({
        where: { materialId },
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      })
    ]);
    return { total, page, pageSize, data: logs };
  }
};
