import { Module, forwardRef } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { PlayersModule } from './players/players.module';
import { AppGateway } from './app.gateway';
import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [forwardRef(() => GameModule), forwardRef(() => PlayersModule)],
  providers: [AppGateway, AppService],
  controllers: [AppController],
})
export class AppModule {}
