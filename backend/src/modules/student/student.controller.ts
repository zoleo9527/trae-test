import { Controller, Get, Post, Put, Body, Param, Query, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StudentService } from './student.service';
import { BusinessExceptionFilter } from '../../common/filters/http-exception.filter';

@ApiTags('students')
@Controller('students')
@UseFilters(BusinessExceptionFilter)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @ApiOperation({ summary: '创建学生' })
  create(@Body() data: any) {
    return this.studentService.create(data);
  }

  @Get()
  @ApiOperation({ summary: '获取学生列表' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('keyword') keyword?: string,
  ) {
    return this.studentService.findAll(page, limit, keyword);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取学生详情' })
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新学生信息' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.studentService.update(id, data);
  }
}
