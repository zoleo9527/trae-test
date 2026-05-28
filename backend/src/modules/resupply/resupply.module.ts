import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResupplyRequest, EvidenceChain, Material } from '../../entities';
import { ResupplyService } from './resupply.service';
import { ResupplyController } from './resupply.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ResupplyRequest, EvidenceChain, Material])],
  providers: [ResupplyService],
  controllers: [ResupplyController],
  exports: [ResupplyService],
})
export class ResupplyModule {}
