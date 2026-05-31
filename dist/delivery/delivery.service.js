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
exports.DeliveryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const delivery_entity_1 = require("./entities/delivery.entity");
const audit_enum_1 = require("../common/enums/audit.enum");
const audit_service_1 = require("../audit/audit.service");
let DeliveryService = class DeliveryService {
    constructor(deliveryRepository, auditService) {
        this.deliveryRepository = deliveryRepository;
        this.auditService = auditService;
    }
    generateDeliveryNumber() {
        const date = new Date();
        const prefix = `DL-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${random}`;
    }
    async create(createDto, user) {
        const delivery = this.deliveryRepository.create({
            ...createDto,
            deliveryNumber: this.generateDeliveryNumber(),
            createdById: user.id,
            createdBy: user,
        });
        const saved = await this.deliveryRepository.save(delivery);
        await this.auditService.createLog({
            action: audit_enum_1.AuditAction.CREATE,
            entityType: audit_enum_1.AuditEntityType.DELIVERY,
            entityId: saved.id,
            entityName: saved.deliveryNumber,
            user,
            newValues: saved,
            description: '创建发货回单',
        });
        return this.findOne(saved.id);
    }
    async findAll(page = 1, limit = 20, filters) {
        const queryBuilder = this.deliveryRepository.createQueryBuilder('d')
            .leftJoinAndSelect('d.createdBy', 'createdBy')
            .leftJoinAndSelect('d.receivedBy', 'receivedBy')
            .leftJoinAndSelect('d.changeOrder', 'changeOrder');
        if (filters?.projectId) {
            queryBuilder.andWhere('d.projectId = :projectId', { projectId: filters.projectId });
        }
        if (filters?.status) {
            queryBuilder.andWhere('d.status = :status', { status: filters.status });
        }
        const [data, total] = await queryBuilder
            .orderBy('d.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { data, total, page, limit };
    }
    async findOne(id) {
        const delivery = await this.deliveryRepository.findOne({
            where: { id },
            relations: ['createdBy', 'receivedBy', 'changeOrder', 'signOffs'],
        });
        if (!delivery) {
            throw new common_1.NotFoundException('发货回单不存在');
        }
        return delivery;
    }
    async update(id, updateDto, user) {
        const delivery = await this.findOne(id);
        const oldValues = { ...delivery };
        Object.assign(delivery, updateDto);
        const saved = await this.deliveryRepository.save(delivery);
        await this.auditService.createLog({
            action: audit_enum_1.AuditAction.UPDATE,
            entityType: audit_enum_1.AuditEntityType.DELIVERY,
            entityId: id,
            entityName: saved.deliveryNumber,
            user,
            oldValues,
            newValues: saved,
            description: '更新发货回单',
        });
        return this.findOne(id);
    }
    async receive(id, user) {
        const delivery = await this.findOne(id);
        const oldValues = { status: delivery.status };
        delivery.status = delivery_entity_1.DeliveryStatus.RECEIVED;
        delivery.receivedById = user.id;
        delivery.receivedBy = user;
        delivery.actualDeliveryDate = new Date();
        const saved = await this.deliveryRepository.save(delivery);
        await this.auditService.createLog({
            action: audit_enum_1.AuditAction.STATUS_CHANGE,
            entityType: audit_enum_1.AuditEntityType.DELIVERY,
            entityId: id,
            entityName: saved.deliveryNumber,
            user,
            oldValues,
            newValues: { status: delivery_entity_1.DeliveryStatus.RECEIVED },
            description: '确认收货',
        });
        return this.findOne(id);
    }
    async findByChangeOrder(changeOrderId) {
        return this.deliveryRepository.find({
            where: { changeOrderId },
            relations: ['createdBy', 'receivedBy'],
            order: { createdAt: 'DESC' },
        });
    }
};
exports.DeliveryService = DeliveryService;
exports.DeliveryService = DeliveryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(delivery_entity_1.Delivery)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_1.AuditService])
], DeliveryService);
//# sourceMappingURL=delivery.service.js.map