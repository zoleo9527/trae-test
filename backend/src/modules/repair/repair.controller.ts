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
import { AuthGuard } from '@nestjs/passport';
import { RepairService, CreateRepairDto, UpdateRepairDto, ChangeRepairStatusDto, UpdateStepDto } from './repair.service';
import { CurrentUser, RolesGuard, Roles } from '../../common/auth';
import { User, UserRole } from '../../database/entities';

@Controller('repairs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RepairController {
  constructor(private readonly repairService: RepairService) {}

  @Post()
  @Roles(UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN)
  create(@Body() dto: CreateRepairDto, @CurrentUser() user: User) {
    return this.repairService.create(dto, user);
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
  getAvailableTransitions(@Param('id') id: string, @CurrentUser() user: User) {
    return this.repairService.getAvailableTransitions(id, user.role);
  }

  @Put(':id')
  @Roles(UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateRepairDto, @CurrentUser() user: User) {
    return this.repairService.update(id, dto, user);
  }

  @Put(':id/status')
  @Roles(UserRole.WORKSHOP, UserRole.SALES, UserRole.MANAGER, UserRole.ADMIN)
  changeStatus(@Param('id') id: string, @Body() dto: ChangeRepairStatusDto, @CurrentUser() user: User) {
    return this.repairService.changeStatus(id, dto, user);
  }

  @Post(':id/steps')
  @Roles(UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN)
  addStep(@Param('id') repairId: string, @Body() stepDto: any, @CurrentUser() user: User) {
    return this.repairService.addStep(repairId, stepDto, user);
  }

  @Put('steps/:stepId')
  @Roles(UserRole.WORKSHOP, UserRole.MANAGER, UserRole.ADMIN)
  updateStep(@Param('stepId') stepId: string, @Body() dto: UpdateStepDto, @CurrentUser() user: User) {
    return this.repairService.updateStep(stepId, dto, user);
  }
}
