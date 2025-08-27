import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getDatabaseConfig } from './config/database.config';
import { GameModule } from './game/game.module';
import { PlayersModule } from './players/players.module';
import { AppGateway } from './app.gateway';
import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    forwardRef(() => GameModule),
    forwardRef(() => PlayersModule),
  ],
  providers: [AppGateway, AppService],
  controllers: [AppController],
})
export class AppModule {}
