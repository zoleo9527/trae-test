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
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const core_1 = require("@nestjs/core");
const auth_module_1 = require("./modules/auth/auth.module");
const work_order_module_1 = require("./modules/work-order/work-order.module");
const follow_up_module_1 = require("./modules/follow-up/follow-up.module");
const member_module_1 = require("./modules/member/member.module");
const repair_module_1 = require("./modules/repair/repair.module");
const auth_1 = require("./common/auth");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                username: process.env.DB_USER || 'jewelry',
                password: process.env.DB_PASSWORD || 'jewelry123',
                database: process.env.DB_DATABASE || 'jewelry_aftersales',
                entities: [__dirname + '/database/entities/**/*.entity{.ts,.js}'],
                synchronize: true,
                logging: process.env.NODE_ENV === 'development',
            }),
            auth_module_1.AuthModule,
            work_order_module_1.WorkOrderModule,
            follow_up_module_1.FollowUpModule,
            member_module_1.MemberModule,
            repair_module_1.RepairModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: auth_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map