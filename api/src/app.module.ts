import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderModule } from './modules/order/order.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ProductModule } from './modules/product/product.module';
import { InstallationModule } from './modules/installation/installation.module';
import { AcceptanceModule } from './modules/acceptance/acceptance.module';
import { ExceptionModule } from './modules/exception/exception.module';
import { SampleModule } from './modules/sample/sample.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'furniture.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
    }),
    OrderModule,
    CustomerModule,
    ProductModule,
    InstallationModule,
    AcceptanceModule,
    ExceptionModule,
    SampleModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
