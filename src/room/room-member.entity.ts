// src/rooms/room-member.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { Player } from 'src/player/player.entity';

@Entity('room_members')
export class RoomMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Room, (room) => room.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ManyToOne(() => Player, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playerId' })
  player: Player;

  @CreateDateColumn()
  joinedAt: Date;
}
