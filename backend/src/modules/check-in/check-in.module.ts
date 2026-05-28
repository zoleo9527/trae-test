import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckIn } from '../../entities';
import { CheckInService } from './check-in.service';
import { CheckInController } from './check-in.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CheckIn])],
  providers: [CheckInService],
  controllers: [CheckInController],
  exports: [CheckInService],
})
export class CheckInModule {}
