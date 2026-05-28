import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Camper, Room, Material, ResupplyRequest, CheckIn, MedicalReport } from '../../entities';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Camper, Room, Material, ResupplyRequest, CheckIn, MedicalReport])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
