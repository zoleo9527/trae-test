import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DowntimeController } from './downtime.controller';
import { DowntimeService } from './downtime.service';
import { DowntimeRecord } from '../../entities/downtime-record.entity';
import { WorkOrder } from '../../entities/work-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DowntimeRecord, WorkOrder])],
  controllers: [DowntimeController],
  providers: [DowntimeService],
  exports: [DowntimeService],
})
export class DowntimeModule {}
