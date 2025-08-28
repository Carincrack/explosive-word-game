// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getDatabaseConfig } from './config/database.config';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { Player } from './player/player.entity';
import { PlayersService } from './player/players.service';
import { PlayersController } from './player/players.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    // Registramos el repositorio de Player directamente en AppModule
    TypeOrmModule.forFeature([Player]),
  ],
  // Agregamos el controller de Players aquí mismo
  controllers: [AppController, PlayersController],
  // Y el service de Players aquí mismo también
  providers: [AppService, PlayersService],
})
export class AppModule {}
