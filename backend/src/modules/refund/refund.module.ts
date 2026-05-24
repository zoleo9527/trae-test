import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Refund } from './refund.entity';
import { RefundService } from './refund.service';
import { RefundController } from './refund.controller';
import { WorkOrderModule } from '../work-order/work-order.module';

@Module({
  imports: [TypeOrmModule.forFeature([Refund]), WorkOrderModule],
  controllers: [RefundController],
  providers: [RefundService],
  exports: [RefundService],
})
export class RefundModule {}
