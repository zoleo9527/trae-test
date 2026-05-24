import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultant } from './consultant.entity';
import { ConsultantService } from './consultant.service';
import { ConsultantController } from './consultant.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Consultant])],
  controllers: [ConsultantController],
  providers: [ConsultantService],
  exports: [ConsultantService],
})
export class ConsultantModule {}
