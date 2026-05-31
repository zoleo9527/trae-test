import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('地坪施工-变更报价与签认留痕系统')
    .setDescription('变更报价、签认留痕、审计追踪的完整解决方案')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`系统启动成功: http://localhost:${port}`);
  console.log(`API文档: http://localhost:${port}/api`);
}

bootstrap();
