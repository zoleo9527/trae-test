import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RepairService, CreateRepairDto, UpdateRepairDto, ChangeRepairStatusDto, UpdateStepDto } from './repair.service';
import { RolesGuard, Roles } from '../../common/auth';
import { UserRole } from '../../database/entities';

@Controller('repairs')
@UseGuards(RolesGuard)
export class RepairController {
  constructor(private readonly repairService: RepairService) {}

  @Post()
  @Roles(UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN)
  create(@Body() dto: CreateRepairDto, @Request() req: any) {
    return this.repairService.create(dto, req.user);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('repairType') repairType?: string,
    @Query('workOrderId') workOrderId?: string,
    @Query('technicianId') technicianId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.repairService.findAll(
      { status: status as any, repairType: repairType as any, workOrderId, technicianId },
      Number(page),
      Number(limit),
    );
  }

  @Get('work-order/:workOrderId')
  findByWorkOrderId(@Param('workOrderId') workOrderId: string) {
    return this.repairService.findByWorkOrderId(workOrderId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.repairService.findOne(id);
  }

  @Get(':id/transitions')
  getAvailableTransitions(@Param('id') id: string, @Request() req: any) {
    return this.repairService.getAvailableTransitions(id, req.user.role);
  }

  @Put(':id')
  @Roles(UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateRepairDto, @Request() req: any) {
    return this.repairService.update(id, dto, req.user);
  }

  @Put(':id/status')
  @Roles(UserRole.WORKSHOP, UserRole.SALES, UserRole.MANAGER, UserRole.ADMIN)
  changeStatus(@Param('id') id: string, @Body() dto: ChangeRepairStatusDto, @Request() req: any) {
    return this.repairService.changeStatus(id, dto, req.user);
  }

  @Post(':id/steps')
  @Roles(UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN)
  addStep(@Param('id') repairId: string, @Body() stepDto: any, @Request() req: any) {
    return this.repairService.addStep(repairId, stepDto, req.user);
  }

  @Put('steps/:stepId')
  @Roles(UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN)
  updateStep(@Param('stepId') stepId: string, @Body() dto: UpdateStepDto, @Request() req: any) {
    return this.repairService.updateStep(stepId, dto, req.user);
  }
}
