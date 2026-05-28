import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entities';
import { CamperModule } from './modules/camper/camper.module';
import { RoomModule } from './modules/room/room.module';
import { MaterialModule } from './modules/material/material.module';
import { ResupplyModule } from './modules/resupply/resupply.module';
import { CheckInModule } from './modules/check-in/check-in.module';
import { MedicalModule } from './modules/medical/medical.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'camp_management',
      entities: Object.values(entities),
      synchronize: true,
      logging: false,
    }),
    CamperModule,
    RoomModule,
    MaterialModule,
    ResupplyModule,
    CheckInModule,
    MedicalModule,
    DashboardModule,
    SeedModule,
  ],
})
export class AppModule {}
