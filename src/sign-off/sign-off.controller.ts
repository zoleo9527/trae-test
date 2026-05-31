import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SignOffService } from './sign-off.service';
import { CreateSignOffDto } from './dto/create-sign-off.dto';
import { ActionSignOffDto } from './dto/action-sign-off.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { SignOffStatus, SignOffType } from '../common/enums/sign-off.enum';

@ApiTags('签认管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sign-offs')
export class SignOffController {
  constructor(private readonly signOffService: SignOffService) {}

  @Post()
  @ApiOperation({ summary: '创建签认请求' })
  create(@Request() req, @Body() createSignOffDto: CreateSignOffDto) {
    return this.signOffService.create(createSignOffDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: '获取签认列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: SignOffStatus })
  @ApiQuery({ name: 'signOffType', required: false, enum: SignOffType })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: SignOffStatus,
    @Query('signOffType') signOffType?: string,
  ) {
    return this.signOffService.findAll(page, limit, { status, signOffType });
  }

  @Get('pending')
  @ApiOperation({ summary: '获取我待签认的列表' })
  getPending(@Request() req) {
    return this.signOffService.getPendingForUser(req.user);
  }

  @Get('my-signed')
  @ApiOperation({ summary: '获取我已签认的列表' })
  getMySigned(@Request() req) {
    return this.signOffService.getMySigned(req.user);
  }

  @Get('my-requested')
  @ApiOperation({ summary: '获取我发起的签认列表' })
  getMyRequested(@Request() req) {
    return this.signOffService.getMyRequested(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取签认详情' })
  findOne(@Param('id') id: string) {
    return this.signOffService.findOne(id);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: '签认通过' })
  sign(
    @Request() req,
    @Param('id') id: string,
    @Body() actionDto: ActionSignOffDto,
  ) {
    return this.signOffService.sign(id, actionDto, req.user);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '签认驳回' })
  reject(
    @Request() req,
    @Param('id') id: string,
    @Body() actionDto: ActionSignOffDto,
  ) {
    return this.signOffService.reject(id, actionDto, req.user);
  }

  @Get('change-order/:changeOrderId')
  @ApiOperation({ summary: '获取变更单的签认记录' })
  findByChangeOrder(@Param('changeOrderId') changeOrderId: string) {
    return this.signOffService.findByChangeOrder(changeOrderId);
  }
}
