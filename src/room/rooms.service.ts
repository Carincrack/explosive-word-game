// src/rooms/rooms.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from './room.entity';
import { Player } from 'src/player/player.entity';
import { RoomMember } from './room-member.entity';
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
    @InjectRepository(RoomMember) private members: Repository<RoomMember>,
    private games: GamesService,
  ) {}

  async create() {
    const room = this.rooms.create({ code: randomCode() });
    return this.rooms.save(room);
  }

  // Unirse por ID (persiste membresía)
  async join(roomId: number, playerId: number) {
    const room = await this.rooms.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Sala no existe');

    const player = await this.players.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Jugador no existe');

    if (room.status !== RoomStatus.Waiting)
      throw new BadRequestException('La sala ya inició');

    const count = await this.members.count({
      where: { room: { id: room.id } },
    });
    if (count >= (room.maxPlayers ?? 8))
      throw new BadRequestException('Sala llena');

    const existing = await this.members.findOne({
      where: { room: { id: room.id }, player: { id: player.id } },
    });
    if (existing) throw new ConflictException('Jugador ya está en la sala');

    await this.members.save(this.members.create({ room, player }));

    return { ok: true, roomId: room.id, roomCode: room.code, player };
  }

  // Unirse por CÓDIGO (persiste membresía)
  async joinByCode(roomCode: string, playerId: number) {
    const code = roomCode.trim().toUpperCase();
    const room = await this.rooms.findOne({ where: { code } });
    if (!room) throw new NotFoundException('Sala no existe');

    return this.join(room.id, playerId);
  }

  // Listar jugadores de la sala (desde DB)
  async getPlayers(roomId: number) {
    const room = await this.rooms.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Sala no existe');

    const members = await this.members.find({
      where: { room: { id: room.id } },
      order: { joinedAt: 'ASC' },
    });

    // Devuelve solo datos del jugador (puedes ajustar)
    return members.map((m) => ({
      id: m.player.id,
      name: m.player.name,
      joinedAt: m.joinedAt,
    }));
  }

  async startGame(roomId: number) {
    // ejemplo: exigir al menos 2 jugadores
    const playerCount = await this.members.count({
      where: { room: { id: roomId } },
    });
    if (playerCount < 2)
      throw new BadRequestException('Se requieren al menos 2 jugadores');
    return this.games.createAndStart(roomId);
  }
  async startGameByCode(roomCode: string) {
    const code = roomCode.trim().toUpperCase();
    const room = await this.rooms.findOne({ where: { code } });
    if (!room) throw new NotFoundException('Sala no existe');
    return this.startGame(room.id);
  }
}
