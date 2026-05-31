import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ChangeOrderModule } from './change-order/change-order.module';
import { DailyReportModule } from './daily-report/daily-report.module';
import { DeliveryModule } from './delivery/delivery.module';
import { SignOffModule } from './sign-off/sign-off.module';
import { AuditModule } from './audit/audit.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ChangeOrder } from './change-order/entities/change-order.entity';
import { SignOff } from './sign-off/entities/sign-off.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
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
    TypeOrmModule.forFeature([ChangeOrder, SignOff]),
    AuthModule,
    UserModule,
    ChangeOrderModule,
    DailyReportModule,
    DeliveryModule,
    SignOffModule,
    AuditModule,
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
