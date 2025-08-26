import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { WordlistService } from './wordlist';
import { PlayersModule } from '../players/players.module';

@Module({
  imports: [forwardRef(() => PlayersModule)], // <-- forwardRef aquí también
  providers: [GameService, GameGateway, WordlistService],
  exports: [GameService],
})
export class GameModule {}
