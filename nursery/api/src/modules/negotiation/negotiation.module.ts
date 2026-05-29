import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiseaseModule } from '../disease/disease.module';
import { NegotiationController } from './negotiation.controller';
import { Negotiation } from './negotiation.entity';
import { NegotiationService } from './negotiation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Negotiation]), DiseaseModule],
  providers: [NegotiationService],
  controllers: [NegotiationController],
  exports: [NegotiationService],
})
export class NegotiationModule {}
