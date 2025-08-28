// src/rooms/rooms.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { SocketGateway } from 'src/socket/socket.gateway';

@Controller('api/rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly gateway: SocketGateway,
  ) {}

  @Post()
  create() {
    return this.roomsService.create();
  }

  @Post('join')
  async join(@Body() body: { code: string; playerName: string }) {
    const room = await this.roomsService.joinByCode(body.code);

    // Emitir evento a la sala (room-{code}) por socket
    this.gateway.notifyPlayerJoined(body.code, body.playerName);

    return { message: 'Unido correctamente', room };
  }

  @Get(':code')
  find(@Param('code') code: string) {
    return this.roomsService.findByCode(code);
  }
}
