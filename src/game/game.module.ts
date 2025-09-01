// src/Game/game.module.ts
import { Module } from '@nestjs/common';
import { GameGateway } from './gateways/game.gateway';
import { GameService } from './services/game.service';
import { LobbyService } from './services/lobby.service';
import { DictionaryService } from '../dictionary.service'; // Mover aquí

@Module({
  providers: [
    GameGateway, 
    GameService, 
    LobbyService, 
    DictionaryService
  ],
  exports: [
    GameService, 
    LobbyService, 
    DictionaryService
  ],
})
export class GameModule {}