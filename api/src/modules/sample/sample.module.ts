import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SampleLoan } from '../../entities/sample-loan.entity';
import { SampleService } from './sample.service';
import { SampleController } from './sample.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([SampleLoan]), CommonModule],
  providers: [SampleService],
  controllers: [SampleController],
  exports: [SampleService],
})
export class SampleModule {}
