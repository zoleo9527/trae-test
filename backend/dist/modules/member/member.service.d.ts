import { Repository } from 'typeorm';
import { Member, User } from '../../database/entities';
import { AuditService } from '../../common/audit';
export interface CreateMemberDto {
    realName: string;
    phone: string;
    gender?: string;
    birthday?: Date;
    level?: string;
    remark?: string;
}
export interface UpdateMemberDto {
    realName?: string;
    phone?: string;
    gender?: string;
    birthday?: Date;
    level?: string;
    remark?: string;
}
export declare class MemberService {
    private memberRepository;
    private auditService;
    constructor(memberRepository: Repository<Member>, auditService: AuditService);
    generateMemberNo(): Promise<string>;
    create(dto: CreateMemberDto, operator: User): Promise<Member>;
    findAll(filters?: {
        keyword?: string;
        level?: string;
    }, page?: number, limit?: number): Promise<{
        data: Member[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Member>;
    update(id: string, dto: UpdateMemberDto, operator: User): Promise<Member>;
    findByPhone(phone: string): Promise<Member>;
}
