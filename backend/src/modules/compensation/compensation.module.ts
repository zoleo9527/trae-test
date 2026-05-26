import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompensationService } from './compensation.service';
import { CompensationController } from './compensation.controller';
import { Compensation } from '../../common/entities/compensation.entity';
import { Complaint } from '../../common/entities/complaint.entity';
import { StatusLog } from '../../common/entities/status-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Compensation, Complaint, StatusLog])],
  providers: [CompensationService],
  controllers: [CompensationController],
  exports: [CompensationService],
})
export class CompensationModule {}
