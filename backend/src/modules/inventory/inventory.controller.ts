import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { generateLockNo } from '../../utils/orderNo';
import { parsePagination } from '../../utils/pagination';
import { success, successWithPagination } from '../../utils/response';
import { AppError, NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { config } from '../../config';
import { InventoryLockStatus, PartApplicationStatus } from '../../types/enums';

export async function createPart(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;

    const existing = await prisma.part.findUnique({ where: { sku: data.sku } });
    if (existing) {
      throw new AppError(409, 'SKU已存在');
    }

    const part = await prisma.part.create({
      data,
    });

    return res.json(success(req, part, '配件创建成功'));
  } catch (error) {
    next(error);
  }
}

export async function getPart(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            _count: {
              select: {
                locks: {
                  where: { status: InventoryLockStatus.ACTIVE },
                },
              },
            },
          },
        },
      },
    });

    if (!part) {
      throw new NotFoundError('配件不存在');
    }

    return res.json(success(req, part));
  } catch (error) {
    next(error);
  }
}

export async function getPartList(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req);
    const { category, brand, keyword, isActive } = req.query as any;

    const where: any = {};
    if (category) where.category = category;
    if (brand) where.brand = brand;
    if (isActive !== undefined) where.isActive = isActive;
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { sku: { contains: keyword } },
        { model: { contains: keyword } },
      ];
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        skip,
        take,
        include: {
          inventory: {
            select: {
              id: true,
              warehouse: true,
              quantity: true,
              reservedQty: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.part.count({ where }),
    ]);

    return res.json(
      successWithPagination(req, parts, {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function updatePart(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body;

    const part = await prisma.part.update({
      where: { id },
      data,
    });

    return res.json(success(req, part, '配件更新成功'));
  } catch (error) {
    next(error);
  }
}

export async function createInventory(req: Request, res: Response, next: NextFunction) {
  try {
    const { expireDate, ...data } = req.body;

    const inventory = await prisma.inventory.create({
      data: {
        ...data,
        expireDate: expireDate ? new Date(expireDate) : null,
      },
      include: {
        part: true,
      },
    });

    return res.json(success(req, inventory, '库存创建成功'));
  } catch (error) {
    next(error);
  }
}

export async function getInventory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: {
        part: true,
        locks: {
          where: { status: InventoryLockStatus.ACTIVE },
          include: {
            locker: { select: { id: true, realName: true } },
            application: { select: { id: true, applicationNo: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundError('库存不存在');
    }

    const availableQty = inventory.quantity - inventory.reservedQty;

    return res.json(
      success(req, {
        ...inventory,
        availableQty,
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function getInventoryList(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req);
    const { partId, warehouse, lowStock } = req.query as any;

    const where: any = {};
    if (partId) where.partId = partId;
    if (warehouse) where.warehouse = warehouse;

    const [inventories, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        skip,
        take,
        include: {
          part: true,
          _count: {
            select: {
              locks: {
                where: { status: InventoryLockStatus.ACTIVE },
              },
            },
          },
        },
        orderBy: { quantity: 'asc' },
      }),
      prisma.inventory.count({ where }),
    ]);

    let results = inventories.map((inv) => ({
      ...inv,
      availableQty: inv.quantity - inv.reservedQty,
    }));

    if (lowStock) {
      results = results.filter(
        (inv) => inv.availableQty <= inv.minStock
      );
    }

    return res.json(
      successWithPagination(req, results, {
        page,
        pageSize,
        total: lowStock ? results.length : total,
        totalPages: Math.ceil((lowStock ? results.length : total) / pageSize),
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function updateInventory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body;

    const inventory = await prisma.inventory.update({
      where: { id },
      data,
      include: {
        part: true,
      },
    });

    return res.json(success(req, inventory, '库存更新成功'));
  } catch (error) {
    next(error);
  }
}

export async function lockInventory(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      inventoryId,
      quantity,
      reason,
      applicationId,
      applicationItemId,
      repairOrderId,
      durationHours,
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { id: inventoryId },
        select: {
          id: true,
          partId: true,
          quantity: true,
          reservedQty: true,
          warehouse: true,
        },
      });

      if (!inventory) {
        throw new NotFoundError('库存不存在');
      }

      const availableQty = inventory.quantity - inventory.reservedQty;
      if (availableQty < quantity) {
        throw new ValidationError(
          `可用库存不足，当前可用: ${availableQty}，需要: ${quantity}`
        );
      }

      let applicationItem: any = null;
      if (applicationItemId) {
        applicationItem = await tx.partApplicationItem.findUnique({
          where: { id: applicationItemId },
          select: { id: true, requestedQty: true, approvedQty: true, actualIssuedQty: true, applicationId: true },
        });

        if (!applicationItem) {
          throw new NotFoundError('申请明细不存在');
        }

        const existingLocks = await tx.inventoryLock.findMany({
          where: {
            applicationItemId,
            status: InventoryLockStatus.ACTIVE,
          },
          select: { quantity: true },
        });

        const totalLocked = existingLocks.reduce((sum, l) => sum + l.quantity, 0);
        const approvedQty = applicationItem.approvedQty ?? applicationItem.requestedQty;
        const remainToLock = approvedQty - (applicationItem.actualIssuedQty ?? 0) - totalLocked;

        if (quantity > remainToLock) {
          throw new ValidationError(
            `补锁数量超过待补锁量: 批准${approvedQty}, 已发${applicationItem.actualIssuedQty ?? 0}, 已锁${totalLocked}, 最多可补${remainToLock}`
          );
        }
      }

      const lockNo = generateLockNo();
      const expireAt = new Date();
      expireAt.setHours(
        expireAt.getHours() + (durationHours || config.inventory.lockDefaultDurationHours)
      );

      const lock = await tx.inventoryLock.create({
        data: {
          lockNo,
          inventoryId,
          quantity,
          reason,
          lockedBy: req.user!.userId,
          applicationId,
          applicationItemId,
          repairOrderId,
          expireAt,
        },
        include: {
          inventory: {
            include: {
              part: true,
            },
          },
          locker: { select: { id: true, realName: true } },
          applicationItem: {
            select: { id: true, requestedQty: true, approvedQty: true },
          },
        },
      });

      await tx.inventory.update({
        where: { id: inventoryId },
        data: {
          reservedQty: {
            increment: quantity,
          },
        },
      });

      if (applicationItemId && applicationItem) {
        const app = await tx.partApplication.findUnique({
          where: { id: applicationItem.applicationId },
          select: { id: true, status: true },
        });

        if (app && app.status === PartApplicationStatus.AWAITING_STOCK) {
          const allItems = await tx.partApplicationItem.findMany({
            where: { applicationId: app.id },
            select: { id: true, approvedQty: true, requestedQty: true, actualIssuedQty: true },
          });

          const allItemsWithLocks = await Promise.all(
            allItems.map(async (item) => {
              const locks = await tx.inventoryLock.findMany({
                where: { applicationItemId: item.id, status: InventoryLockStatus.ACTIVE },
                select: { quantity: true },
              });
              const totalLocked = locks.reduce((sum, l) => sum + l.quantity, 0);
              const approved = item.approvedQty ?? item.requestedQty;
              const issued = item.actualIssuedQty ?? 0;
              return { ...item, totalLocked, canIssue: issued + totalLocked >= approved };
            })
          );

          const allCanIssue = allItemsWithLocks.every((item) => item.canIssue);

          if (allCanIssue) {
            await tx.partApplication.update({
              where: { id: app.id },
              data: { status: PartApplicationStatus.PROCESSING },
            });

            await tx.applicationStatusHistory.create({
              data: {
                applicationId: app.id,
                fromStatus: PartApplicationStatus.AWAITING_STOCK,
                toStatus: PartApplicationStatus.PROCESSING,
                changedBy: req.user!.userId,
                changeReason: '所有明细库存已补足，可以发放',
              },
            });
          }
        }
      }

      return lock;
    });

    return res.json(success(req, result, '库存锁定成功'));
  } catch (error) {
    next(error);
  }
}

export async function releaseLock(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const lock = await tx.inventoryLock.findUnique({
        where: { id },
        select: {
          id: true,
          inventoryId: true,
          quantity: true,
          status: true,
        },
      });

      if (!lock) {
        throw new NotFoundError('锁定记录不存在');
      }

      if (lock.status !== InventoryLockStatus.ACTIVE) {
        throw new ValidationError(`当前状态${lock.status}不允许释放`);
      }

      const updatedLock = await tx.inventoryLock.update({
        where: { id },
        data: {
          status: InventoryLockStatus.RELEASED,
          releasedAt: new Date(),
        },
        include: {
          inventory: { include: { part: true } },
        },
      });

      await tx.inventory.update({
        where: { id: lock.inventoryId },
        data: {
          reservedQty: {
            decrement: lock.quantity,
          },
        },
      });

      return updatedLock;
    });

    return res.json(success(req, result, '库存已释放'));
  } catch (error) {
    next(error);
  }
}

export async function consumeLock(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const lock = await tx.inventoryLock.findUnique({
        where: { id },
        select: {
          id: true,
          inventoryId: true,
          quantity: true,
          status: true,
        },
      });

      if (!lock) {
        throw new NotFoundError('锁定记录不存在');
      }

      if (lock.status !== InventoryLockStatus.ACTIVE) {
        throw new ValidationError(`当前状态${lock.status}不允许消耗`);
      }

      const inventory = await tx.inventory.findUnique({
        where: { id: lock.inventoryId },
        select: { id: true, quantity: true, reservedQty: true },
      });

      if (!inventory || inventory.quantity < lock.quantity) {
        throw new ValidationError('库存不足，无法完成消耗');
      }

      const updatedLock = await tx.inventoryLock.update({
        where: { id },
        data: {
          status: InventoryLockStatus.CONSUMED,
          consumedAt: new Date(),
        },
        include: {
          inventory: { include: { part: true } },
        },
      });

      await tx.inventory.update({
        where: { id: lock.inventoryId },
        data: {
          quantity: {
            decrement: lock.quantity,
          },
          reservedQty: {
            decrement: lock.quantity,
          },
        },
      });

      return updatedLock;
    });

    return res.json(success(req, result, '库存已消耗'));
  } catch (error) {
    next(error);
  }
}

export async function getLockList(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req);
    const { status, inventoryId, applicationId, repairOrderId, lockedBy, expired } =
      req.query as any;

    const where: any = {};
    if (status) where.status = status;
    if (inventoryId) where.inventoryId = inventoryId;
    if (applicationId) where.applicationId = applicationId;
    if (repairOrderId) where.repairOrderId = repairOrderId;
    if (lockedBy) where.lockedBy = lockedBy;

    const now = new Date();

    const [locks, total] = await Promise.all([
      prisma.inventoryLock.findMany({
        where,
        skip,
        take,
        include: {
          inventory: {
            include: {
              part: true,
            },
          },
          locker: { select: { id: true, realName: true } },
          application: { select: { id: true, applicationNo: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryLock.count({ where }),
    ]);

    let results = locks.map((lock) => ({
      ...lock,
      isExpired: lock.expireAt < now,
    }));

    if (expired) {
      results = results.filter((lock) => lock.isExpired);
    }

    return res.json(
      successWithPagination(req, results, {
        page,
        pageSize,
        total: expired ? results.length : total,
        totalPages: Math.ceil((expired ? results.length : total) / pageSize),
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function cleanupExpiredLocks(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const expiredLocks = await tx.inventoryLock.findMany({
        where: {
          status: InventoryLockStatus.ACTIVE,
          expireAt: { lt: new Date() },
        },
        select: { id: true, inventoryId: true, quantity: true },
      });

      for (const lock of expiredLocks) {
        await tx.inventoryLock.update({
          where: { id: lock.id },
          data: {
            status: InventoryLockStatus.EXPIRED,
            releasedAt: new Date(),
          },
        });

        await tx.inventory.update({
          where: { id: lock.inventoryId },
          data: {
            reservedQty: {
              decrement: lock.quantity,
            },
          },
        });
      }

      return {
        cleanedCount: expiredLocks.length,
        cleanedLocks: expiredLocks,
      };
    });

    return res.json(success(req, result, `已清理${result.cleanedCount}个过期锁定`));
  } catch (error) {
    next(error);
  }
}
