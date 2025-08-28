// src/rooms/rooms.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';

function generateCode(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}

@Injectable()
export class RoomsService {
  constructor(@InjectRepository(Room) private repo: Repository<Room>) {}

  async create(): Promise<Room> {
    const code = generateCode();
    const room = this.repo.create({ code });
    return this.repo.save(room);
  }

  async joinByCode(code: string): Promise<Room> {
    const room = await this.repo.findOne({ where: { code } });
    if (!room) throw new NotFoundException('La sala no existe');
    room.playerCount++;
    return this.repo.save(room);
  }

  async findByCode(code: string): Promise<Room> {
    const room = await this.repo.findOne({ where: { code } });
    if (!room) throw new NotFoundException('La sala no existe');
    return room;
  }
}
