import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentModule } from './modules/student/student.module';
import { WorkOrderModule } from './modules/work-order/work-order.module';
import { RefundModule } from './modules/refund/refund.module';
import { TransferModule } from './modules/transfer/transfer.module';
import { MaterialModule } from './modules/material/material.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
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
    StudentModule,
    WorkOrderModule,
    RefundModule,
    TransferModule,
    MaterialModule,
    AuditModule,
  ],
})
export class AppModule {}
