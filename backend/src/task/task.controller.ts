import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TaskService } from './task.service';
import { UserRole } from '@prisma/client';

interface CompleteTaskDto {
  resultNote: string;
  inspectionResult?: string;
  inspectionPhoto?: string;
}

@Controller('api/tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('board')
  getTaskBoard() {
    return this.taskService.getTaskBoard();
  }

  @Get('my')
  getTasksByRole(
    @Query('role') role: UserRole,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.taskService.getTasksByRole(role, assigneeId);
  }

  @Post(':id/assign')
  assignTask(@Param('id') id: string, @Body('assigneeId') assigneeId: string) {
    return this.taskService.assignTask(id, assigneeId);
  }

  @Post(':id/start')
  startTask(@Param('id') id: string, @Body('assigneeId') assigneeId: string) {
    return this.taskService.startTask(id, assigneeId);
  }

  @Post(':id/complete')
  completeTask(@Param('id') id: string, @Body() body: CompleteTaskDto) {
    return this.taskService.completeTask(id, {
      resultNote: body.resultNote,
      inspectionResult: body.inspectionResult,
      inspectionPhoto: body.inspectionPhoto,
    });
  }

  @Post('replenishment')
  createReplenishmentTask(
    @Body('stationId') stationId: string,
    @Body('supplyType') supplyType: string,
  ) {
    return this.taskService.createReplenishmentTask(stationId, supplyType);
  }
}
