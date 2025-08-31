// src/rooms/rooms.controller.ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RoomsService } from './rooms.service';

@Controller('api/rooms')
export class RoomsController {
  constructor(private rooms: RoomsService) {}

  @Post() create() {
    return this.rooms.create();
  }

  @Post(':roomId/join')
  join(@Param('roomId') roomId: number, @Body() body: { playerId: number }) {
    return this.rooms.join(+roomId, body.playerId);
  }

  @Post('code/:roomCode/join')
  joinByCode(
    @Param('roomCode') roomCode: string,
    @Body() body: { playerId: number },
  ) {
    return this.rooms.joinByCode(roomCode, body.playerId);
  }

  @Get(':roomId/players')
  players(@Param('roomId') roomId: number) {
    return this.rooms.getPlayers(+roomId);
  }

  @Post(':roomId/start')
  start(@Param('roomId') roomId: number) {
    return this.rooms.startGame(+roomId);
  }

  // ✅ iniciar por CÓDIGO
  @Post('code/:roomCode/start')
  startByCode(@Param('roomCode') roomCode: string) {
    return this.rooms.startGameByCode(roomCode);
  }
}
