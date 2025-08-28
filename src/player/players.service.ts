// src/players/players.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './player.entity';

@Injectable()
export class PlayersService {
  constructor(@InjectRepository(Player) private repo: Repository<Player>) {}
  async register(name: string) {
    const exists = await this.repo.findOne({ where: { name } });
    if (exists) throw new ConflictException('Nombre ya existe');
    return this.repo.save(this.repo.create({ name }));
  }
}
