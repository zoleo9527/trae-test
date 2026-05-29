import { Controller, Post } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private seedService: SeedService) {}

  @Post()
  async seed() {
    await this.seedService.seed();
    return { message: '演示数据已重新生成' };
  }
}
