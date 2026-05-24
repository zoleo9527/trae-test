import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { WorkOrderModule } from './modules/work-order/work-order.module';
import { FollowUpModule } from './modules/follow-up/follow-up.module';
import { MemberModule } from './modules/member/member.module';
import { RolesGuard } from './common/auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
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
    AuthModule,
    WorkOrderModule,
    FollowUpModule,
    MemberModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
