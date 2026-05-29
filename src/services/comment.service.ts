import prisma from '../lib/prisma';
import { AuthUser } from '../types';
import { AuditService } from './audit.service';


export class CommentService {
  static async addComment(
    user: AuthUser,
    entityType: string,
    entityId: string,
    content: string,
    parentId?: string,
    ip?: string
  ) {
    const comment = await prisma.comment.create({
      data: {
        content,
        entityType,
        entityId,
        userId: user.id,
        parentId,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    await AuditService.log(user, AuditAction.CREATE, 'Comment', comment.id, {
      remark: `添加备注: ${content.substring(0, 50)}`,
      ip,
    });

    return comment;
  }

  static async getEntityComments(entityType: string, entityId: string) {
    return prisma.comment.findMany({
      where: { entityType, entityId },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async deleteComment(user: AuthUser, commentId: string, ip?: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('备注不存在');
    }

    if (comment.userId !== user.id && user.role !== 'ADMIN') {
      throw new Error('无权删除此备注');
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    await AuditService.log(user, AuditAction.DELETE, 'Comment', commentId, {
      remark: '删除备注',
      ip,
    });

    return true;
  }
}
