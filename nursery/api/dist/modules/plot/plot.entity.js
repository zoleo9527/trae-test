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
exports.Plot = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
let Plot = class Plot {
};
exports.Plot = Plot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Plot.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name', length: 100 }),
    __metadata("design:type", String)
], Plot.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'location', length: 200, nullable: true }),
    __metadata("design:type", String)
], Plot.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'variety', length: 100, nullable: true }),
    __metadata("design:type", String)
], Plot.prototype, "variety", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'specification', length: 100, nullable: true }),
    __metadata("design:type", String)
], Plot.prototype, "specification", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quantity', nullable: true }),
    __metadata("design:type", Number)
], Plot.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'inspector_id' }),
    __metadata("design:type", user_entity_1.User)
], Plot.prototype, "inspector", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'inspector_id' }),
    __metadata("design:type", Number)
], Plot.prototype, "inspectorId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Plot.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Plot.prototype, "updatedAt", void 0);
exports.Plot = Plot = __decorate([
    (0, typeorm_1.Entity)('plots')
], Plot);
//# sourceMappingURL=plot.entity.js.map