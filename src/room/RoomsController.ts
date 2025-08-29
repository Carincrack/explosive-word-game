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

  @Get(':roomId/players')
  players(@Param('roomId') roomId: number) {
    return this.rooms.getPlayers(+roomId);
  }

  @Post(':roomId/start')
  start(@Param('roomId') roomId: number) {
    return this.rooms.startGame(+roomId);
  }
}
