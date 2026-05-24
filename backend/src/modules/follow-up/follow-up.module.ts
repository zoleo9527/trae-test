import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowUpService } from './follow-up.service';
import { FollowUpController } from './follow-up.controller';
import { FollowUp, WorkOrder, Member, AuditLog } from '../../database/entities';
import { AuditService } from '../../common/audit';

@Module({
  imports: [
    TypeOrmModule.forFeature([FollowUp, WorkOrder, Member, AuditLog]),
  ],
  controllers: [FollowUpController],
  providers: [FollowUpService, AuditService],
  exports: [FollowUpService],
})
export class FollowUpModule {}
