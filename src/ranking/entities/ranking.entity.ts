// src/games/ranking.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('rankings')
@Unique(['playerId'])
export class Ranking {
  @PrimaryGeneratedColumn() id: number;
  @Column() playerId: number;
  @Column({ default: 0 }) wins: number;
  @Column({ default: 0 }) losses: number;
  @Column({ default: 0 }) gamesPlayed: number;
}
