import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { WorkflowService } from './workflow/workflow.service';
import { WorkflowController } from './workflow/workflow.controller';
import { StationService } from './station/station.service';
import { StationController } from './station/station.controller';
import { TaskService } from './task/task.service';
import { TaskController } from './task/task.controller';

@Module({
  imports: [],
  controllers: [
    WorkflowController,
    StationController,
    TaskController,
  ],
  providers: [
    PrismaService,
    WorkflowService,
    StationService,
    TaskService,
  ],
})
export class AppModule {}
