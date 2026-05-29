import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Disease } from '../disease/disease.entity';
import { Inspection } from '../inspection/inspection.entity';
import { Negotiation } from '../negotiation/negotiation.entity';
import { Plot } from '../plot/plot.entity';
import { User } from '../user/user.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Plot, Inspection, Disease, Negotiation, User])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
