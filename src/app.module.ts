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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfig, // 👈 usa la función real definida abajo
    }),
    TypeOrmModule.forFeature([Player, Room]),
  ],
  controllers: [AppController, PlayersController, RoomsController],
  providers: [AppService, PlayersService, RoomsService, SocketGateway],
})
export class AppModule {}
