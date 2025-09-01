import { Module, forwardRef } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PlayersGateway } from './players.gateway';
import { GameModule } from '../game/game.module';

@Module({
  imports: [forwardRef(() => GameModule)],
  providers: [PlayersService, PlayersGateway],
  exports: [PlayersService],
})
export class PlayersModule {}