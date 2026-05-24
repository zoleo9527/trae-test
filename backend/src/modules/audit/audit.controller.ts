import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: '获取审计日志列表' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.auditService.findAll(page, limit);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: '获取实体的审计日志' })
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entityType, entityId);
  }

  @Get('operator/:operatorId')
  @ApiOperation({ summary: '获取操作者的审计日志' })
  findByOperator(@Param('operatorId') operatorId: string) {
    return this.auditService.findByOperator(operatorId);
  }
}
