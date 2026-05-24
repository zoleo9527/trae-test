"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const student_module_1 = require("./modules/student/student.module");
const consultant_module_1 = require("./modules/consultant/consultant.module");
const work_order_module_1 = require("./modules/work-order/work-order.module");
const refund_module_1 = require("./modules/refund/refund.module");
const transfer_module_1 = require("./modules/transfer/transfer.module");
const material_module_1 = require("./modules/material/material.module");
const comment_module_1 = require("./modules/comment/comment.module");
const deadline_module_1 = require("./modules/deadline/deadline.module");
const audit_module_1 = require("./modules/audit/audit.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 5432,
                username: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_DATABASE || 'study_abroad',
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: true,
                logging: false,
            }),
            student_module_1.StudentModule,
            consultant_module_1.ConsultantModule,
            work_order_module_1.WorkOrderModule,
            refund_module_1.RefundModule,
            transfer_module_1.TransferModule,
            material_module_1.MaterialModule,
            comment_module_1.CommentModule,
            deadline_module_1.DeadlineModule,
            audit_module_1.AuditModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map