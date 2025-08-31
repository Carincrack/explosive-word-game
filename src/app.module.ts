// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppService } from './app.service';
import { AppController } from './app.controller';

// Player
import { Player } from './player/player.entity';
import { PlayersService } from './player/players.service';
import { PlayersController } from './player/players.controller';

// Room
import { Room } from './room/room.entity';
import { RoomsController } from './room/RoomsController';
import { RoomsService } from './room/rooms.service';

// Socket
import { SocketGateway } from './socket/socket.gateway';
import { typeOrmConfig } from './config/database.config';
// import { GameModule } from './game/game.module';
import { RoundsModule } from './rounds/rounds.module';
import { RankingModule } from './ranking/ranking.module';

// src/app.module.ts
import { GameModule } from './game/game.module'; // ✅ Descomentar e importar
import { RoomMember } from './room/room-member.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    TypeOrmModule.forFeature([Player, Room, RoomMember]),
    GameModule, // ✅ <--- AHORA SÍ LO USAMOS
    RoundsModule,
    RankingModule,
  ],
  controllers: [AppController, PlayersController, RoomsController],
  providers: [AppService, PlayersService, RoomsService, SocketGateway],
})
export class AppModule {}
