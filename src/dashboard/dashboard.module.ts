import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ChangeOrder } from '../change-order/entities/change-order.entity';
import { SignOff } from '../sign-off/entities/sign-off.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChangeOrder, SignOff])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
