import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalReport } from '../../entities';
import { MedicalService } from './medical.service';
import { MedicalController } from './medical.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalReport])],
  providers: [MedicalService],
  controllers: [MedicalController],
  exports: [MedicalService],
})
export class MedicalModule {}
