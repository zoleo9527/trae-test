import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settlement } from '../../entities/settlement.entity';
import { SettlementService } from './settlement.service';
import { SettlementController } from './settlement.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Settlement])],
  controllers: [SettlementController],
  providers: [SettlementService],
  exports: [SettlementService],
})
export class SettlementModule {}
