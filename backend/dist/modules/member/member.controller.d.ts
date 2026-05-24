import { MemberService, CreateMemberDto, UpdateMemberDto } from './member.service';
import { User } from '../../database/entities';
export declare class MemberController {
    private memberService;
    constructor(memberService: MemberService);
    create(dto: CreateMemberDto, user: User): Promise<import("../../database/entities").Member>;
    findAll(keyword?: string, level?: string, page?: number, limit?: number): Promise<{
        data: import("../../database/entities").Member[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("../../database/entities").Member>;
    findByPhone(phone: string): Promise<import("../../database/entities").Member>;
    update(id: string, dto: UpdateMemberDto, user: User): Promise<import("../../database/entities").Member>;
}
