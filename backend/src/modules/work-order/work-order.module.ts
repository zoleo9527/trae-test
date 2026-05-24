import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrder } from './work-order.entity';
import { WorkOrderService } from './work-order.service';
import { WorkOrderController } from './work-order.controller';
import { AuditLog } from '../audit/audit-log.entity';
import { Refund } from '../refund/refund.entity';
import { Transfer } from '../transfer/transfer.entity';
import { Material } from '../material/material.entity';
import { Comment } from '../comment/comment.entity';
import { Deadline } from '../deadline/deadline.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder, AuditLog, Refund, Transfer, Material, Comment, Deadline])],
  controllers: [WorkOrderController],
  providers: [WorkOrderService],
  exports: [WorkOrderService],
})
export class WorkOrderModule {}
