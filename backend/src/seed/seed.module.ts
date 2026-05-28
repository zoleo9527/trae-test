import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Camper, Room, Material, User, ResupplyRequest, EvidenceChain, CheckIn, MedicalReport, MaterialDistribution } from '../entities';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Camper, Room, Material, User, ResupplyRequest, EvidenceChain, CheckIn, MedicalReport, MaterialDistribution])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
