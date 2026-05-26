import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecheckService } from './recheck.service';
import { RecheckController } from './recheck.controller';
import { Recheck } from '../../common/entities/recheck.entity';
import { Complaint } from '../../common/entities/complaint.entity';
import { StatusLog } from '../../common/entities/status-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Recheck, Complaint, StatusLog])],
  providers: [RecheckService],
  controllers: [RecheckController],
  exports: [RecheckService],
})
export class RecheckModule {}
