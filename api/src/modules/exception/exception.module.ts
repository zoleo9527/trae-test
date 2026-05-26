import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExceptionOrder } from '../../entities/exception-order.entity';
import { RepairPart } from '../../entities/repair-part.entity';
import { Order } from '../../entities/order.entity';
import { ExceptionService } from './exception.service';
import { ExceptionController } from './exception.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([ExceptionOrder, RepairPart, Order]), CommonModule],
  providers: [ExceptionService],
  controllers: [ExceptionController],
  exports: [ExceptionService],
})
export class ExceptionModule {}
