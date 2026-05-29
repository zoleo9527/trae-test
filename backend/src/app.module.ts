import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FilmRollsModule } from './film-rolls/film-rolls.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { CompensationModule } from './compensation/compensation.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    DbModule,
    AuthModule,
    UsersModule,
    FilmRollsModule,
    WorkOrdersModule,
    CompensationModule,
    SeedModule,
  ],
})
export class AppModule {}
