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
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const disease_timeline_entity_1 = require("./modules/disease/disease-timeline.entity");
const disease_entity_1 = require("./modules/disease/disease.entity");
const disease_module_1 = require("./modules/disease/disease.module");
const inspection_entity_1 = require("./modules/inspection/inspection.entity");
const inspection_module_1 = require("./modules/inspection/inspection.module");
const negotiation_entity_1 = require("./modules/negotiation/negotiation.entity");
const negotiation_module_1 = require("./modules/negotiation/negotiation.module");
const plot_entity_1 = require("./modules/plot/plot.entity");
const plot_module_1 = require("./modules/plot/plot.module");
const user_entity_1 = require("./modules/user/user.entity");
const user_module_1 = require("./modules/user/user.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                username: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_DATABASE || 'nursery',
                synchronize: true,
                entities: [user_entity_1.User, plot_entity_1.Plot, inspection_entity_1.Inspection, disease_entity_1.Disease, disease_timeline_entity_1.DiseaseTimeline, negotiation_entity_1.Negotiation],
            }),
            user_module_1.UserModule,
            plot_module_1.PlotModule,
            inspection_module_1.InspectionModule,
            disease_module_1.DiseaseModule,
            negotiation_module_1.NegotiationModule,
            dashboard_module_1.DashboardModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map