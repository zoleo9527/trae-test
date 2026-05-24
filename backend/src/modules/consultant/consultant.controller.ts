import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConsultantService } from './consultant.service';
import { Role } from '../../common/enums/role.enum';

@ApiTags('consultants')
@Controller('consultants')
export class ConsultantController {
  constructor(private readonly consultantService: ConsultantService) {}

  @Post()
  @ApiOperation({ summary: '创建顾问' })
  create(@Body() data: any) {
    return this.consultantService.create(data);
  }

  @Get()
  @ApiOperation({ summary: '获取顾问列表' })
  findAll(@Query('role') role?: Role) {
    return this.consultantService.findAll(role);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取顾问详情' })
  findOne(@Param('id') id: string) {
    return this.consultantService.findOne(id);
  }
}
