import { Body, Controller, Post } from '@nestjs/common';
import { PlayersService } from './players.service';
import { RegisterPlayerDto } from './register-player.dto';

@Controller('api/players')
export class PlayersController {
  constructor(private readonly players: PlayersService) {}
  @Post('register')
  register(@Body() dto: RegisterPlayerDto) {
    return this.players.register(dto.name);
  }
}
