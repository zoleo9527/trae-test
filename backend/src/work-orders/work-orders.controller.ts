import { Controller, Get, Post, Patch, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto, BatchUpdateDto, AddNoteDto } from './work-order.dto';

@Controller('work-orders')
@UseGuards(AuthGuard('jwt'))
export class WorkOrdersController {
  constructor(private workOrdersService: WorkOrdersService) {}

  @Get()
  async findAll(@Query() query: any, @Request() req: any) {
    return this.workOrdersService.findAll(query, req.user);
  }

  @Get('stats')
  async getStats() {
    return this.workOrdersService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.workOrdersService.findOne(id, req.user);
  }

  @Post()
  async create(@Body() createDto: CreateWorkOrderDto, @Request() req: any) {
    return this.workOrdersService.create(createDto, req.user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateWorkOrderDto, @Request() req: any) {
    return this.workOrdersService.update(id, updateDto, req.user);
  }

  @Post('batch')
  async batchUpdate(@Body() batchDto: BatchUpdateDto, @Request() req: any) {
    return this.workOrdersService.batchUpdate(batchDto, req.user);
  }

  @Get(':id/notes')
  async getNotes(@Param('id') id: string, @Request() req: any) {
    return this.workOrdersService.getNotes(id, req.user?.role);
  }

  @Post(':id/notes')
  async addNote(@Param('id') id: string, @Body() noteDto: AddNoteDto, @Request() req: any) {
    return this.workOrdersService.addNote(id, noteDto, req.user);
  }

  @Get(':id/status-logs')
  async getStatusLogs(@Param('id') id: string) {
    return this.workOrdersService.getStatusLogs(id);
  }
}
