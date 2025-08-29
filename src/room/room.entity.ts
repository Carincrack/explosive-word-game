// src/rooms/room.entity.ts
import { Game } from 'src/game/entities/game.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Unique,
} from 'typeorm';

export enum RoomStatus {
  Waiting = 'Waiting',
  InProgress = 'InProgress',
  Finished = 'Finished',
}

@Entity('rooms')
@Unique(['code'])
export class Room {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 8 }) code: string; // p.ej. 6 letras
  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.Waiting })
  status: RoomStatus;
  @Column({ default: 8 }) maxPlayers: number;
  @CreateDateColumn() createdAt: Date;

  @OneToMany(() => Game, (g) => g.room) games: Game[];
}
