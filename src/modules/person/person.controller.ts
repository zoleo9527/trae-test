import { Controller, Get, Post, Body, Param, Put, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PersonService } from './person.service';
import { CreatePersonDto, UpdatePersonDto, PersonQueryDto } from './dto/person.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ApiResponse, PaginatedResponse } from '../../common/dto/response.dto';
import { Person } from '../../entities/person.entity';

@ApiTags('persons')
@Controller('api/persons')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  @ApiOperation({ summary: '创建人员' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreatePersonDto): Promise<ApiResponse<Person>> {
    const data = await this.personService.create(createDto);
    return new ApiResponse(data, 'Person created successfully');
  }

  @Get()
  @ApiOperation({ summary: '获取人员列表' })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query() filters: PersonQueryDto,
  ): Promise<ApiResponse<PaginatedResponse<Person>>> {
    const data = await this.personService.findAll(pagination, filters);
    return new ApiResponse(data);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取人员详情' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<Person>> {
    const data = await this.personService.findOne(id);
    return new ApiResponse(data);
  }

  @Get('idcard/:idCardNo')
  @ApiOperation({ summary: '根据身份证号获取人员' })
  async findByIdCardNo(@Param('idCardNo') idCardNo: string): Promise<ApiResponse<Person>> {
    const data = await this.personService.findByIdCardNo(idCardNo);
    return new ApiResponse(data);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新人员' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePersonDto,
  ): Promise<ApiResponse<Person>> {
    const data = await this.personService.update(id, updateDto);
    return new ApiResponse(data, 'Person updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除人员' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.personService.remove(id);
  }
}
