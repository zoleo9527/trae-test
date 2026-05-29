import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlotController } from './plot.controller';
import { Plot } from './plot.entity';
import { PlotService } from './plot.service';

@Module({
  imports: [TypeOrmModule.forFeature([Plot])],
  providers: [PlotService],
  controllers: [PlotController],
  exports: [PlotService],
})
export class PlotModule {}
