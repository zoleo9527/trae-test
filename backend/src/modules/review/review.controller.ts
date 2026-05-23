import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto, UpdateReviewDto, VerifyReviewDto, QueryReviewDto } from './dto/review.dto';
import { ReviewRecord } from '../../entities/review-record.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Controller('api/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async create(@Body() createDto: CreateReviewDto): Promise<ReviewRecord> {
    return this.reviewService.create(createDto);
  }

  @Get()
  async findAll(@Query() queryDto: QueryReviewDto): Promise<PaginatedResult<ReviewRecord>> {
    return this.reviewService.findAll(queryDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ReviewRecord> {
    return this.reviewService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateReviewDto): Promise<ReviewRecord> {
    return this.reviewService.update(id, updateDto);
  }

  @Post(':id/verify')
  async verify(@Param('id') id: string, @Body() verifyDto: VerifyReviewDto): Promise<ReviewRecord> {
    return this.reviewService.verify(id, verifyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.reviewService.delete(id);
  }
}
