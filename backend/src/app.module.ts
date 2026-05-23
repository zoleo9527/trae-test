import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

import { WorkOrderModule } from './modules/work-order/work-order.module';
import { DowntimeModule } from './modules/downtime/downtime.module';
import { SparePartModule } from './modules/spare-part/spare-part.module';
import { ReviewModule } from './modules/review/review.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'pv_operation',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
    }),
    WorkOrderModule,
    DowntimeModule,
    SparePartModule,
    ReviewModule,
    UserModule,
  ],
})
export class AppModule {}
