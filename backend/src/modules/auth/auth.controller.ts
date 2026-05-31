import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { comparePassword, generateToken, hashPassword } from '../../utils/auth';
import { success, successWithPagination } from '../../utils/response';
import { AppError, NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { Role, Permission } from '../../types/enums';
import { deserializePermissions, serializePermissions, transformUser } from '../../utils/transform';
import { parsePagination } from '../../utils/pagination';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        realName: true,
        role: true,
        permissions: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError(401, '用户名或密码错误');
    }

    if (!user.isActive) {
      throw new AppError(403, '账号已被禁用');
    }

    if (!comparePassword(password, user.password)) {
      throw new AppError(401, '用户名或密码错误');
    }

    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role as Role,
      permissions: deserializePermissions(user.permissions),
    };

    const token = generateToken(payload);

    return res.json(
      success(req, {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          role: user.role,
          permissions: deserializePermissions(user.permissions),
        },
      }, '登录成功')
    );
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        role: true,
        permissions: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    return res.json(success(req, transformUser(user)));
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { password: true },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    if (!comparePassword(oldPassword, user.password)) {
      throw new ValidationError('原密码错误');
    }

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { password: hashPassword(newPassword) },
    });

    return res.json(success(req, null, '密码修改成功'));
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password, realName, email, phone, role, permissions } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      throw new AppError(409, '用户名已存在');
    }

    const defaultPermissions = getDefaultPermissionsForRole(role);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashPassword(password),
        realName,
        email,
        phone,
        role: role as string,
        permissions: JSON.stringify((permissions as Permission[]) || defaultPermissions),
      },
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.json(success(req, transformUser(user), '用户创建成功'));
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateData: any = { ...data };
    if (updateData.permissions) {
      updateData.permissions = serializePermissions(updateData.permissions);
    }
    if (updateData.role) {
      updateData.role = updateData.role as string;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        role: true,
        permissions: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return res.json(success(req, transformUser(user), '用户更新成功'));
  } catch (error) {
    next(error);
  }
}

export async function getUserList(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req);
    const { role, isActive, keyword } = req.query as any;

    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { realName: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          username: true,
          realName: true,
          email: true,
          phone: true,
          role: true,
          permissions: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const transformedUsers = users.map((u) => transformUser(u));

    return res.json(
      successWithPagination(req, transformedUsers, {
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

function getDefaultPermissionsForRole(role: Role): Permission[] {
  const permissionsMap: Record<Role, Permission[]> = {
    [Role.ADMIN]: Object.values(Permission),
    [Role.SERVICE_MANAGER]: [
      Permission.REPAIR_ORDER_VIEW,
      Permission.REPAIR_ORDER_EDIT,
      Permission.PART_APPLICATION_VIEW,
      Permission.PART_APPLICATION_APPROVE,
      Permission.PART_APPLICATION_REJECT,
      Permission.INVENTORY_VIEW,
      Permission.INVENTORY_LOCK,
      Permission.INVENTORY_UNLOCK,
      Permission.EXPORT_DATA,
    ],
    [Role.RECEPTIONIST]: [
      Permission.REPAIR_ORDER_CREATE,
      Permission.REPAIR_ORDER_VIEW,
      Permission.REPAIR_ORDER_EDIT,
      Permission.PART_APPLICATION_CREATE,
      Permission.PART_APPLICATION_VIEW,
      Permission.INVENTORY_VIEW,
    ],
    [Role.TECHNICIAN]: [
      Permission.REPAIR_ORDER_VIEW,
      Permission.PART_APPLICATION_CREATE,
      Permission.PART_APPLICATION_VIEW,
      Permission.INVENTORY_VIEW,
    ],
  };
  return permissionsMap[role] || [];
}
