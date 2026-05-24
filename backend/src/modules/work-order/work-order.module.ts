import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrder } from './work-order.entity';
import { WorkOrderService } from './work-order.service';
import { WorkOrderController } from './work-order.controller';
import { AuditLog } from '../audit/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder, AuditLog])],
  controllers: [WorkOrderController],
  providers: [WorkOrderService],
  exports: [WorkOrderService],
})
export class WorkOrderModule {}
