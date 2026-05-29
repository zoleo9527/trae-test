import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusLog } from '../entities/status-log.entity';
import { StateMachineService } from './services/state-machine.service';
import { QueryBuilderService } from './services/query-builder.service';
import { ExportService } from './services/export.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([StatusLog])],
  providers: [StateMachineService, QueryBuilderService, ExportService],
  exports: [StateMachineService, QueryBuilderService, ExportService],
})
export class CommonModule {}
