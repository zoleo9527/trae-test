import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplaintService } from './complaint.service';
import { ComplaintController } from './complaint.controller';
import { Complaint } from '../../common/entities/complaint.entity';
import { StatusLog } from '../../common/entities/status-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Complaint, StatusLog])],
  providers: [ComplaintService],
  controllers: [ComplaintController],
  exports: [ComplaintService],
})
export class ComplaintModule {}
