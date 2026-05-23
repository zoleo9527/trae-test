import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrderController } from './work-order.controller';
import { WorkOrderService } from './work-order.service';
import { WorkOrder } from '../../entities/work-order.entity';
import { StatusHistory } from '../../entities/status-history.entity';
import { User } from '../../entities/user.entity';
import { DowntimeRecord } from '../../entities/downtime-record.entity';
import { SparePart } from '../../entities/spare-part.entity';
import { PartUsage } from '../../entities/part-usage.entity';
import { ReviewRecord } from '../../entities/review-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder, StatusHistory, User, DowntimeRecord, SparePart, PartUsage, ReviewRecord])],
  controllers: [WorkOrderController],
  providers: [WorkOrderService],
  exports: [WorkOrderService],
})
export class WorkOrderModule {}
