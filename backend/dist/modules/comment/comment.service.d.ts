import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { AuditService } from '../audit/audit.service';
export declare class CommentService {
    private readonly commentRepository;
    private readonly auditService;
    constructor(commentRepository: Repository<Comment>, auditService: AuditService);
    create(data: {
        workOrderId?: string;
        refundId?: string;
        transferId?: string;
        materialId?: string;
        content: string;
        isPrivate?: boolean;
    }, authorId: string, authorName: string): Promise<Comment>;
    findByEntity(filters: {
        workOrderId?: string;
        refundId?: string;
        transferId?: string;
        materialId?: string;
    }): Promise<Comment[]>;
    private getEntityType;
    private getEntityId;
}
