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
exports.DowntimeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const downtime_record_entity_1 = require("../../entities/downtime-record.entity");
const work_order_entity_1 = require("../../entities/work-order.entity");
const http_exception_filter_1 = require("../../common/filters/http-exception.filter");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let DowntimeService = class DowntimeService {
    constructor(downtimeRepository, workOrderRepository) {
        this.downtimeRepository = downtimeRepository;
        this.workOrderRepository = workOrderRepository;
    }
    async create(createDto) {
        const workOrder = await this.workOrderRepository.findOne({ where: { id: createDto.workOrderId } });
        if (!workOrder) {
            throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.WORK_ORDER_NOT_FOUND, '工单不存在');
        }
        const downtime = this.downtimeRepository.create(createDto);
        return this.downtimeRepository.save(downtime);
    }
    async findAll(queryDto) {
        const { page, limit, sortBy = 'createdAt', sortOrder, workOrderId, isConfirmed, startDate, endDate } = queryDto;
        const queryBuilder = this.downtimeRepository.createQueryBuilder('downtime')
            .leftJoinAndSelect('downtime.workOrder', 'workOrder')
            .leftJoinAndSelect('downtime.confirmedBy', 'confirmedBy');
        if (workOrderId) {
            queryBuilder.andWhere('downtime.workOrderId = :workOrderId', { workOrderId });
        }
        if (isConfirmed !== undefined) {
            queryBuilder.andWhere('downtime.isConfirmed = :isConfirmed', { isConfirmed });
        }
        if (startDate && endDate) {
            queryBuilder.andWhere('downtime.startTime BETWEEN :startDate AND :endDate', { startDate, endDate });
        }
        queryBuilder.orderBy(`downtime.${sortBy}`, sortOrder);
        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return (0, pagination_dto_1.createPaginatedResult)(data, total, page, limit);
    }
    async findOne(id) {
        const downtime = await this.downtimeRepository.findOne({
            where: { id },
            relations: ['workOrder', 'confirmedBy'],
        });
        if (!downtime) {
            throw new http_exception_filter_1.BusinessException(http_exception_filter_1.ErrorCode.DOWNTIME_NOT_FOUND, '停机记录不存在');
        }
        return downtime;
    }
    async update(id, updateDto) {
        const downtime = await this.findOne(id);
        if (updateDto.startTime)
            downtime.startTime = updateDto.startTime;
        if (updateDto.endTime !== undefined) {
            downtime.endTime = updateDto.endTime;
            if (updateDto.endTime) {
                const duration = Math.floor((updateDto.endTime.getTime() - downtime.startTime.getTime()) / (1000 * 60));
                downtime.durationMinutes = duration;
            }
        }
        if (updateDto.reason)
            downtime.reason = updateDto.reason;
        return this.downtimeRepository.save(downtime);
    }
    async confirm(id, confirmDto) {
        const downtime = await this.findOne(id);
        downtime.isConfirmed = true;
        downtime.confirmedById = confirmDto.confirmedById;
        downtime.confirmedAt = new Date();
        const saved = await this.downtimeRepository.save(downtime);
        await this.updateWorkOrderDowntime(downtime.workOrderId);
        return this.findOne(id);
    }
    async delete(id) {
        const downtime = await this.findOne(id);
        const workOrderId = downtime.workOrderId;
        await this.downtimeRepository.remove(downtime);
        await this.updateWorkOrderDowntime(workOrderId);
    }
    async updateWorkOrderDowntime(workOrderId) {
        const records = await this.downtimeRepository.find({
            where: { workOrderId, isConfirmed: true },
        });
        const totalMinutes = records.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
        await this.workOrderRepository.update(workOrderId, {
            totalDowntimeMinutes: totalMinutes,
        });
    }
};
exports.DowntimeService = DowntimeService;
exports.DowntimeService = DowntimeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(downtime_record_entity_1.DowntimeRecord)),
    __param(1, (0, typeorm_1.InjectRepository)(work_order_entity_1.WorkOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], DowntimeService);
//# sourceMappingURL=downtime.service.js.map