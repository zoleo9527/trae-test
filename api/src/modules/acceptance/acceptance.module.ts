import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcceptanceRecord } from '../../entities/acceptance-record.entity';
import { Order } from '../../entities/order.entity';
import { AcceptanceService } from './acceptance.service';
import { AcceptanceController } from './acceptance.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([AcceptanceRecord, Order]), CommonModule],
  providers: [AcceptanceService],
  controllers: [AcceptanceController],
  exports: [AcceptanceService],
})
export class AcceptanceModule {}
