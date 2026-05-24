"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../../database/entities");
const audit_1 = require("../../common/audit");
let MemberService = class MemberService {
    constructor(memberRepository, auditService) {
        this.memberRepository = memberRepository;
        this.auditService = auditService;
    }
    async generateMemberNo() {
        const date = new Date();
        const prefix = `M${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const lastMember = await this.memberRepository
            .createQueryBuilder('m')
            .where('m.memberNo LIKE :prefix', { prefix: `${prefix}%` })
            .orderBy('m.memberNo', 'DESC')
            .getOne();
        if (lastMember) {
            const lastNum = parseInt(lastMember.memberNo.slice(-5));
            return `${prefix}${String(lastNum + 1).padStart(5, '0')}`;
        }
        return `${prefix}00001`;
    }
    async create(dto, operator) {
        const existing = await this.memberRepository.findOne({
            where: { phone: dto.phone, isDeleted: false },
        });
        if (existing) {
            throw new common_1.ConflictException('该手机号已存在会员记录');
        }
        const memberNo = await this.generateMemberNo();
        const member = this.memberRepository.create({
            memberNo,
            realName: dto.realName,
            phone: dto.phone,
            gender: dto.gender,
            birthday: dto.birthday,
            level: dto.level,
            remark: dto.remark,
            createdBy: operator.id,
            updatedBy: operator.id,
        });
        const saved = await this.memberRepository.save(member);
        await this.auditService.logCreate(entities_1.AuditModule.MEMBER, saved.id, { ...saved }, operator);
        return saved;
    }
    async findAll(filters, page = 1, limit = 20) {
        const queryBuilder = this.memberRepository
            .createQueryBuilder('m')
            .where('m.isDeleted = :isDeleted', { isDeleted: false });
        if (filters?.keyword) {
            queryBuilder.andWhere('(m.realName LIKE :keyword OR m.phone LIKE :keyword OR m.memberNo LIKE :keyword)', { keyword: `%${filters.keyword}%` });
        }
        if (filters?.level) {
            queryBuilder.andWhere('m.level = :level', { level: filters.level });
        }
        queryBuilder.orderBy('m.createdAt', 'DESC');
        queryBuilder.skip((page - 1) * limit);
        queryBuilder.take(limit);
        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total, page, limit };
    }
    async findOne(id) {
        const member = await this.memberRepository.findOne({
            where: { id, isDeleted: false },
            relations: ['workOrders', 'followUps'],
        });
        if (!member) {
            throw new common_1.NotFoundException('会员不存在');
        }
        return member;
    }
    async update(id, dto, operator) {
        const member = await this.findOne(id);
        const oldValues = { ...member };
        if (dto.phone && dto.phone !== member.phone) {
            const existing = await this.memberRepository.findOne({
                where: { phone: dto.phone, isDeleted: false },
            });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException('该手机号已存在会员记录');
            }
        }
        Object.assign(member, dto);
        member.updatedBy = operator.id;
        const updated = await this.memberRepository.save(member);
        await this.auditService.logUpdate(entities_1.AuditModule.MEMBER, id, oldValues, { ...updated }, operator);
        return updated;
    }
    async findByPhone(phone) {
        const member = await this.memberRepository.findOne({
            where: { phone, isDeleted: false },
        });
        if (!member) {
            throw new common_1.NotFoundException('会员不存在');
        }
        return member;
    }
};
exports.MemberService = MemberService;
exports.MemberService = MemberService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Member)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_1.AuditService])
], MemberService);
//# sourceMappingURL=member.service.js.map