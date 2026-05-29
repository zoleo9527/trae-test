import { Controller, Get, Param, Query, Patch, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilmRollsService } from './film-rolls.service';
import { IsString } from 'class-validator';

class UpdateStatusDto {
  @IsString()
  status: string;
}

@Controller('film-rolls')
@UseGuards(AuthGuard('jwt'))
export class FilmRollsController {
  constructor(private filmRollsService: FilmRollsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.filmRollsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.filmRollsService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.filmRollsService.updateStatus(id, dto.status);
  }
}
