import { Module } from '@nestjs/common';
import { GameGateway } from './gateways/game.gateway';
import { GameService } from './services/game.service';
import { LobbyService } from './services/lobby.service';

@Module({
  providers: [GameGateway, GameService, LobbyService],
  exports: [GameService, LobbyService],
})
export class GameModule {}