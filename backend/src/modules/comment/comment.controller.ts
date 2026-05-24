import { Controller, Get, Post, Body, Query, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { BusinessExceptionFilter } from '../../common/filters/http-exception.filter';

@ApiTags('comments')
@Controller('comments')
@UseFilters(BusinessExceptionFilter)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: '添加备注' })
  create(@Body() data: any) {
    return this.commentService.create(
      data,
      data.authorId,
      data.authorName || 'System',
    );
  }

  @Get()
  @ApiOperation({ summary: '获取备注列表' })
  findByEntity(@Query() filters: any) {
    return this.commentService.findByEntity(filters);
  }
}
