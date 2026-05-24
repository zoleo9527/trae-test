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
exports.Member = exports.MemberLevel = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const work_order_entity_1 = require("./work-order.entity");
const follow_up_entity_1 = require("./follow-up.entity");
var MemberLevel;
(function (MemberLevel) {
    MemberLevel["NORMAL"] = "normal";
    MemberLevel["SILVER"] = "silver";
    MemberLevel["GOLD"] = "gold";
    MemberLevel["PLATINUM"] = "platinum";
    MemberLevel["DIAMOND"] = "diamond";
})(MemberLevel || (exports.MemberLevel = MemberLevel = {}));
let Member = class Member extends base_entity_1.BaseEntity {
};
exports.Member = Member;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'member_no', unique: true }),
    __metadata("design:type", String)
], Member.prototype, "memberNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'real_name' }),
    __metadata("design:type", String)
], Member.prototype, "realName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, unique: true }),
    __metadata("design:type", String)
], Member.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'birthday', nullable: true }),
    __metadata("design:type", Date)
], Member.prototype, "birthday", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: MemberLevel,
        default: MemberLevel.NORMAL,
    }),
    __metadata("design:type", String)
], Member.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_consumption' }),
    __metadata("design:type", Number)
], Member.prototype, "totalConsumption", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'points' }),
    __metadata("design:type", Number)
], Member.prototype, "points", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => work_order_entity_1.WorkOrder, (workOrder) => workOrder.member),
    __metadata("design:type", Array)
], Member.prototype, "workOrders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => follow_up_entity_1.FollowUp, (followUp) => followUp.member),
    __metadata("design:type", Array)
], Member.prototype, "followUps", void 0);
exports.Member = Member = __decorate([
    (0, typeorm_1.Entity)('members')
], Member);
//# sourceMappingURL=member.entity.js.map