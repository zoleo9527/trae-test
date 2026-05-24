import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepairService } from './repair.service';
import { RepairController } from './repair.controller';
import { Repair, RepairStep, WorkOrder, AuditLog } from '../../database/entities';
import { RepairStateMachine } from '../../common/state-machine';
import { AuditService } from '../../common/audit';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repair, RepairStep, WorkOrder, AuditLog]),
  ],
  controllers: [RepairController],
  providers: [RepairService, RepairStateMachine, AuditService],
  exports: [RepairService],
})
export class RepairModule {}
