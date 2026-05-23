import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SparePartController, PartUsageController } from './spare-part.controller';
import { SparePartService } from './spare-part.service';
import { SparePart } from '../../entities/spare-part.entity';
import { PartUsage } from '../../entities/part-usage.entity';
import { WorkOrder } from '../../entities/work-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SparePart, PartUsage, WorkOrder])],
  controllers: [SparePartController, PartUsageController],
  providers: [SparePartService],
  exports: [SparePartService],
})
export class SparePartModule {}
