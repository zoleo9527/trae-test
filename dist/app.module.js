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
const app_controller_1 = require("./app.controller");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const change_order_module_1 = require("./change-order/change-order.module");
const daily_report_module_1 = require("./daily-report/daily-report.module");
const delivery_module_1 = require("./delivery/delivery.module");
const sign_off_module_1 = require("./sign-off/sign-off.module");
const audit_module_1 = require("./audit/audit.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const change_order_entity_1 = require("./change-order/entities/change-order.entity");
const sign_off_entity_1 = require("./sign-off/entities/sign-off.entity");
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
                port: parseInt(process.env.DB_PORT || '5432', 10),
                username: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_DATABASE || 'floor_construction',
                autoLoadEntities: true,
                synchronize: process.env.NODE_ENV !== 'production',
                logging: process.env.NODE_ENV === 'development',
            }),
            typeorm_1.TypeOrmModule.forFeature([change_order_entity_1.ChangeOrder, sign_off_entity_1.SignOff]),
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            change_order_module_1.ChangeOrderModule,
            daily_report_module_1.DailyReportModule,
            delivery_module_1.DeliveryModule,
            sign_off_module_1.SignOffModule,
            audit_module_1.AuditModule,
            dashboard_module_1.DashboardModule,
        ],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map