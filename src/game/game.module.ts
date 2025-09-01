import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { PlayersModule } from '../players/players.module';
import { WordlistModule } from '../wordlist/wordlist.module';

@Module({
  imports: [
    forwardRef(() => PlayersModule),
    WordlistModule
  ],
  providers: [GameService, GameGateway],
  exports: [GameService],
})
export class GameModule {}