// src/players/player.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('players')
@Unique(['name'])
export class Player {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 30 }) name: string;
  @CreateDateColumn() createdAt: Date;
}
