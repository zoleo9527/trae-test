"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('留学服务系统 API')
        .setDescription('退款协商与顾问交接服务')
        .setVersion('1.0')
        .addTag('work-orders', '工单管理')
        .addTag('refunds', '退款协商')
        .addTag('transfers', '顾问交接')
        .addTag('materials', '材料管理')
        .addTag('students', '学生管理')
        .addTag('audit', '审计日志')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 留学服务系统运行在 http://localhost:${port}`);
    console.log(`📚 API文档: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map