import { Room } from 'src/room/room.entity';
import { Round } from 'src/rounds/entities/round.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';

export enum GameStatus {
  Waiting = 'Waiting',
  InProgress = 'InProgress',
  Finished = 'Finished',
}

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Room, (r) => r.games, { eager: true })
  room: Room;

  @Column({ type: 'enum', enum: GameStatus, default: GameStatus.InProgress })
  status: GameStatus;

  @Column({ type: 'int', nullable: true }) // ✅ TIPO SQL EXPLÍCITO
  winnerPlayerId: number | null;

  @Column({ type: 'int', default: 1 }) // ✅ TIPO EXPLÍCITO
  roundNumber: number;

  @Column({ type: 'datetime', nullable: true })
  turnExpiresAt: Date | null;

  @Column({ type: 'int', nullable: true }) // ✅ TIPO EXPLÍCITO
  currentPlayerId: number | null;

  @OneToMany(() => Round, (r) => r.game)
  rounds: Round[];
}
