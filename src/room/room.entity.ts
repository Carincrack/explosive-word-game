// src/rooms/room.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('rooms')
@Unique(['code'])
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 8 })
  code: string; // código de unión único

  @Column({ default: 0 })
  playerCount: number; // contador simple (no guardamos los jugadores aquí)

  @CreateDateColumn()
  createdAt: Date;
}
