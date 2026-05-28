import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Camper } from '../../entities';
import { CamperService } from './camper.service';
import { CamperController } from './camper.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Camper])],
  providers: [CamperService],
  controllers: [CamperController],
  exports: [CamperService],
})
export class CamperModule {}
