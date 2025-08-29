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
import { Room, RoomStatus } from 'src/room/room.entity';
import { Player } from 'src/player/player.entity';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game) private games: Repository<Game>,
    @InjectRepository(Room) private rooms: Repository<Room>,
    @InjectRepository(Player) private players: Repository<Player>,
    private engine: GameEngineService,
  ) {}

  // Por simplicidad, pasas la lista de playerIds desde el frontend (o mantenla en memoria en Gateway)
  async createAndStart(roomId: number, playerIds: number[] = []) {
    const room = await this.rooms.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Sala no existe');
    if (room.status !== RoomStatus.Waiting)
      throw new BadRequestException('La sala ya está en juego');

    const game = await this.games.save(
      this.games.create({ room, status: GameStatus.InProgress }),
    );
    // Carga nombres
    const players = await this.players.findByIds(playerIds);
    const statePlayers = players.map((p) => ({
      playerId: p.id,
      name: p.name,
      lives: 3,
      eliminated: false,
    }));
    const state = this.engine.createState(game.id, room.id, statePlayers);
    this.engine.startTurn(state.gameId);
    // marca sala en progreso
    room.status = RoomStatus.InProgress;
    await this.rooms.save(room);
    return { gameId: game.id, roomId: room.id };
  }
}
