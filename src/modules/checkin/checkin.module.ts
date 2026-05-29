import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckinRecord } from '../../entities/checkin-record.entity';
import { Credential } from '../../entities/credential.entity';
import { Person } from '../../entities/person.entity';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CheckinRecord, Credential, Person])],
  controllers: [CheckinController],
  providers: [CheckinService],
  exports: [CheckinService],
})
export class CheckinModule {}
