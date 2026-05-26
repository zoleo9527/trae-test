import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstallationAppointment } from '../../entities/installation-appointment.entity';
import { Order } from '../../entities/order.entity';
import { InstallationService } from './installation.service';
import { InstallationController } from './installation.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([InstallationAppointment, Order]), CommonModule],
  providers: [InstallationService],
  controllers: [InstallationController],
  exports: [InstallationService],
})
export class InstallationModule {}
