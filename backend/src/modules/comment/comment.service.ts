import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly auditService: AuditService,
  ) {}

  async create(
    data: {
      workOrderId?: string;
      refundId?: string;
      transferId?: string;
      materialId?: string;
      content: string;
      isPrivate?: boolean;
    },
    authorId: string,
    authorName: string,
  ): Promise<Comment> {
    const comment = this.commentRepository.create({
      ...data,
      authorId,
      isPrivate: data.isPrivate || false,
    });

    const saved = await this.commentRepository.save(comment);

    const entityType = this.getEntityType(data);
    const entityId = this.getEntityId(data);

    if (entityType && entityId) {
      await this.auditService.log(
        entityType,
        entityId,
        'ADD_COMMENT',
        null,
        { commentId: saved.id },
        authorId,
        authorName,
        '添加备注',
      );
    }

    return this.commentRepository.findOne({
      where: { id: saved.id },
      relations: ['author'],
    });
  }

  async findByEntity(filters: {
    workOrderId?: string;
    refundId?: string;
    transferId?: string;
    materialId?: string;
  }): Promise<Comment[]> {
    const where: any = {};
    if (filters.workOrderId) where.workOrderId = filters.workOrderId;
    if (filters.refundId) where.refundId = filters.refundId;
    if (filters.transferId) where.transferId = filters.transferId;
    if (filters.materialId) where.materialId = filters.materialId;

    return this.commentRepository.find({
      where,
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  private getEntityType(data: any): string | null {
    if (data.workOrderId) return 'WorkOrder';
    if (data.refundId) return 'Refund';
    if (data.transferId) return 'Transfer';
    if (data.materialId) return 'Material';
    return null;
  }

  private getEntityId(data: any): string | null {
    if (data.workOrderId) return data.workOrderId;
    if (data.refundId) return data.refundId;
    if (data.transferId) return data.transferId;
    if (data.materialId) return data.materialId;
    return null;
  }
}
