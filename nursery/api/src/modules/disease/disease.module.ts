import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiseaseTimeline } from './disease-timeline.entity';
import { DiseaseController } from './disease.controller';
import { Disease } from './disease.entity';
import { DiseaseService } from './disease.service';

@Module({
  imports: [TypeOrmModule.forFeature([Disease, DiseaseTimeline])],
  providers: [DiseaseService],
  controllers: [DiseaseController],
  exports: [DiseaseService],
})
export class DiseaseModule {}
