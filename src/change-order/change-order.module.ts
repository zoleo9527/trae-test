import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangeOrderService } from './change-order.service';
import { ChangeOrderController } from './change-order.controller';
import { ChangeOrder } from './entities/change-order.entity';
import { ChangeOrderVersion } from './entities/change-order-version.entity';
import { SignOff } from '../sign-off/entities/sign-off.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChangeOrder, ChangeOrderVersion, SignOff]),
    AuditModule,
  ],
  controllers: [ChangeOrderController],
  providers: [ChangeOrderService],
  exports: [ChangeOrderService],
})
export class ChangeOrderModule {}
