import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditAction, AuditEntityType } from './entities/audit-log.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('审计日志')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.ACCOUNTANT)
  @ApiOperation({ summary: '获取审计日志列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'entityType', required: false, enum: AuditEntityType })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('entityType') entityType?: AuditEntityType,
    @Query('action') action?: AuditAction,
  ) {
    return this.auditService.findAll(page, limit, { entityType, action });
  }

  @Get('entity/:entityType/:entityId')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.ACCOUNTANT)
  @ApiOperation({ summary: '获取指定实体的审计日志' })
  findByEntity(
    @Param('entityType') entityType: AuditEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entityType, entityId);
  }

  @Get('entity/:entityType/:entityId/history')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.ACCOUNTANT)
  @ApiOperation({ summary: '获取指定实体的完整变更历史' })
  getEntityHistory(
    @Param('entityType') entityType: AuditEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getEntityHistory(entityType, entityId);
  }

  @Get('user/:userId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '获取指定用户的操作日志' })
  findByUser(@Param('userId') userId: string) {
    return this.auditService.findByUser(userId);
  }
}
