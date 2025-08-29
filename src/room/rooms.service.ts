// src/rooms/rooms.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from './room.entity';
import { Player } from 'src/player/player.entity';
import { GamesService } from 'src/game/game.service';

function randomCode(len = 6) {
  return Math.random()
    .toString(36)
    .slice(2, 2 + len)
    .toUpperCase();
}

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private rooms: Repository<Room>,
    @InjectRepository(Player) private players: Repository<Player>,
    private games: GamesService,
  ) {}

  async create() {
    const room = this.rooms.create({ code: randomCode() });
    return this.rooms.save(room);
  }

  // Para simplicidad, el “membership” lo gestiona el engine en memoria
  async join(roomId: number, playerId: number) {
    const room = await this.rooms.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Sala no existe');
    const player = await this.players.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Jugador no existe');
    // eslint-disable-next-line prettier/prettier
    if(room.status !== RoomStatus.Waiting) throw new BadRequestException('La sala ya inició');
    // El Gateway validará pertenencia al entrar por socket
    return { ok: true, roomId: room.id, roomCode: room.code, player };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPlayers(roomId: number) {
    /* opcional si persistes membresía */ return [];
  }

  async startGame(roomId: number) {
    // crea Game y arranca engine
    return this.games.createAndStart(roomId);
  }
}
