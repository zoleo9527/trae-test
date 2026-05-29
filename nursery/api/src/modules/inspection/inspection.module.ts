import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionController } from './inspection.controller';
import { Inspection } from './inspection.entity';
import { InspectionService } from './inspection.service';

@Module({
  imports: [TypeOrmModule.forFeature([Inspection])],
  providers: [InspectionService],
  controllers: [InspectionController],
  exports: [InspectionService],
})
export class InspectionModule {}
