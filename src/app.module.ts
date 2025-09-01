import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { PlayersModule } from './players/players.module';
import { WordlistModule } from './wordlist/wordlist.module';

@Module({
  imports: [GameModule, PlayersModule, WordlistModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}