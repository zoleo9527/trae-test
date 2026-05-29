import { Module } from '@nestjs/common';
import { FilmRollsService } from './film-rolls.service';
import { FilmRollsController } from './film-rolls.controller';

@Module({
  controllers: [FilmRollsController],
  providers: [FilmRollsService],
  exports: [FilmRollsService],
})
export class FilmRollsModule {}
