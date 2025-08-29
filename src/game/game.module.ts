// src/game/game.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { Room } from 'src/room/room.entity';
import { Player } from 'src/player/player.entity';

import { GamesService } from './game.service';
import { GameEngineService } from './engine/game-engine.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, Room, Player]), // <-- Repos necesarios para GamesService
  ],
  providers: [GamesService, GameEngineService],
  exports: [GamesService], // <-- Para que otros módulos puedan usarlo
})
export class GameModule {}
