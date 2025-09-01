// src/combinations/combinations.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Combination } from './combination.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CombinationsService {
  constructor(
    @InjectRepository(Combination)
    private comboRepo: Repository<Combination>,
  ) {}

  async getRandom(): Promise<Combination> {
    const combination = await this.comboRepo
      .createQueryBuilder('c')
      .orderBy('RAND()') // RANDOM() en PostgreSQL
      .limit(1)
      .getOne();

    if (!combination) {
      throw new Error('No combination found');
    }
    return combination;
  }
}
