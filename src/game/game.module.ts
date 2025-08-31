// src/game/game.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { Room } from 'src/room/room.entity';
import { Player } from 'src/player/player.entity';

import { GamesService } from './game.service';
import { GameEngineService } from './engine/game-engine.service';
import { RoomMember } from 'src/room/room-member.entity';
import { GameGateway } from './gateway/game.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, Room, Player, RoomMember]), // <-- Repos necesarios para GamesService
  ],
  providers: [GamesService, GameEngineService, GameGateway],
  exports: [GamesService], // <-- Para que otros módulos puedan usarlo
})
export class GameModule {}
