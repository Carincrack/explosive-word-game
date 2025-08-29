import { Game } from 'src/game/entities/game.entity';
import { Player } from 'src/player/player.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';

@Entity('rounds')
export class Round {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Game, (g) => g.rounds)
  game: Game;

  @Column({ type: 'int' })
  number: number;

  @Column({ type: 'varchar', length: 3 })
  letters: string;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  endedAt: Date | null;

  @ManyToOne(() => Player, { nullable: true })
  @JoinColumn({ name: 'playedByPlayerId' })
  playedByPlayer: Player;

  @Column({ type: 'int', nullable: true })
  playedByPlayerId: number;

  @Column({ type: 'varchar', nullable: true })
  word: string | null;

  @Column({ type: 'boolean', nullable: true })
  valid: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  failReason: string | null;
}
