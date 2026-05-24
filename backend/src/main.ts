import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
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
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 留学服务系统运行在 http://localhost:${port}`);
  console.log(`📚 API文档: http://localhost:${port}/api`);
}

bootstrap();
