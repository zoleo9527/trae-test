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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignHandlerDto = exports.TransitionStatusDto = exports.QueryWorkOrderDto = exports.UpdateWorkOrderDto = exports.CreateWorkOrderDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const work_order_enum_1 = require("../../../common/enums/work-order.enum");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
class CreateWorkOrderDto {
}
exports.CreateWorkOrderDto = CreateWorkOrderDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(work_order_enum_1.AbnormalType),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "abnormalType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "station", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "equipmentNo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "reporterId", void 0);
class UpdateWorkOrderDto {
}
exports.UpdateWorkOrderDto = UpdateWorkOrderDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWorkOrderDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWorkOrderDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWorkOrderDto.prototype, "remark", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateWorkOrderDto.prototype, "powerLoss", void 0);
class QueryWorkOrderDto extends pagination_dto_1.PaginationDto {
}
exports.QueryWorkOrderDto = QueryWorkOrderDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(work_order_enum_1.WorkOrderStatus),
    __metadata("design:type", String)
], QueryWorkOrderDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(work_order_enum_1.WorkOrderStatus, { each: true }),
    __metadata("design:type", Array)
], QueryWorkOrderDto.prototype, "statuses", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(work_order_enum_1.AbnormalType),
    __metadata("design:type", String)
], QueryWorkOrderDto.prototype, "abnormalType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryWorkOrderDto.prototype, "station", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryWorkOrderDto.prototype, "keyword", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryWorkOrderDto.prototype, "reporterId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryWorkOrderDto.prototype, "handlerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], QueryWorkOrderDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], QueryWorkOrderDto.prototype, "endDate", void 0);
class TransitionStatusDto {
}
exports.TransitionStatusDto = TransitionStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(work_order_enum_1.WorkOrderStatus),
    __metadata("design:type", String)
], TransitionStatusDto.prototype, "targetStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransitionStatusDto.prototype, "remark", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TransitionStatusDto.prototype, "operatorId", void 0);
class AssignHandlerDto {
}
exports.AssignHandlerDto = AssignHandlerDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignHandlerDto.prototype, "handlerId", void 0);
//# sourceMappingURL=work-order.dto.js.map