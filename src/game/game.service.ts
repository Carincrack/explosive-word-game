// src/games/games.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameEngineService } from './engine/game-engine.service';
import { Game, GameStatus } from './entities/game.entity';
import { Player } from 'src/player/player.entity';
import { Room, RoomStatus } from 'src/room/room.entity';
import { RoomMember } from 'src/room/room-member.entity';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game) private games: Repository<Game>,
    @InjectRepository(Room) private rooms: Repository<Room>,
    @InjectRepository(Player) private players: Repository<Player>,
    @InjectRepository(RoomMember) private members: Repository<RoomMember>, // 👈 inyectar
    private engine: GameEngineService,
  ) {}

  async createAndStart(roomId: number) {
    const room = await this.rooms.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Sala no existe');
    if (room.status !== RoomStatus.Waiting)
      throw new BadRequestException('La sala ya está en juego');

    // ✅ Cargar jugadores unidos a la sala
    const members = await this.members.find({
      where: { room: { id: roomId } },
      relations: ['player'], // 👈 asegúrate de traer el Player
    });

    if (members.length < 2)
      throw new BadRequestException('Se requieren al menos 2 jugadores');

    // Crea el juego
    const game = await this.games.save(
      this.games.create({ room, status: GameStatus.InProgress }),
    );

    // Estructura los jugadores para el GameState
    const statePlayers = members.map((m) => ({
      playerId: m.player.id,
      name: m.player.name,
      lives: 3,
      eliminated: false,
    }));

    // Crear estado e iniciar primer turno
    const state = this.engine.createState(game.id, room.id, statePlayers);
    this.engine.startTurn(state.gameId);

    // Marcar la sala como InProgress
    room.status = RoomStatus.InProgress;
    await this.rooms.save(room);

    return { gameId: game.id, roomId: room.id };
  }
  async createAndStartByCode(roomCode: string) {
    const room = await this.rooms.findOne({
      where: { code: roomCode.trim().toUpperCase() },
    });
    if (!room) throw new NotFoundException('Sala no encontrada');
    return this.createAndStart(room.id);
  }
}
