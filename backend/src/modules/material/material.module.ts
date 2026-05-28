import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material, MaterialDistribution } from '../../entities';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Material, MaterialDistribution])],
  providers: [MaterialService],
  controllers: [MaterialController],
  exports: [MaterialService],
})
export class MaterialModule {}
