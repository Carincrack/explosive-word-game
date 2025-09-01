// src/combinations/combinations.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Combination } from './combination.entity';
import { Word } from './word.entity';
import { CombinationsService } from './combinations.service';
import { SeederService } from './seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Combination, Word])],
  providers: [CombinationsService, SeederService],
  exports: [CombinationsService, SeederService], // para usarlo en el motor del juego
})
export class CombinationsModule {}
