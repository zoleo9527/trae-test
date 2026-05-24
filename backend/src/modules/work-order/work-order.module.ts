import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrderService } from './work-order.service';
import { WorkOrderController } from './work-order.controller';
import { WorkOrder, WorkOrderItem, StatusHistory, Member, AuditLog } from '../../database/entities';
import { WorkOrderStateMachine } from '../../common/state-machine';
import { AuditService } from '../../common/audit';
import { FollowUpModule } from '../follow-up/follow-up.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkOrder, WorkOrderItem, StatusHistory, Member, AuditLog]),
    forwardRef(() => FollowUpModule),
  ],
  controllers: [WorkOrderController],
  providers: [WorkOrderService, WorkOrderStateMachine, AuditService],
  exports: [WorkOrderService],
})
export class WorkOrderModule {}
