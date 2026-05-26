import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';

@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('isSample') isSample?: string,
  ) {
    return this.productService.findAll(
      { page: +page, pageSize: +pageSize },
      keyword,
      category,
      isSample ? isSample === 'true' : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Post()
  create(@Body() dto: CreateProductDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.productService.create(dto, operator);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.productService.update(+id, dto, operator);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const operator = req.headers['x-operator'] || 'system';
    return this.productService.remove(+id, operator);
  }
}
