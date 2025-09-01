import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Combination } from 'src/combinations/combination.entity';
import { Repository } from 'typeorm';
import { Word } from './word.entity';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    @InjectRepository(Combination)
    private comboRepo: Repository<Combination>,
    @InjectRepository(Word)
    private wordRepo: Repository<Word>,
  ) {}

  async onModuleInit() {
    const existing = await this.comboRepo.count();
    if (existing > 0) return; // Ya hay combinaciones, no hagas nada

    const combos = ['BRS', 'TRN', 'CRR'];
    const comboEntities = await this.comboRepo.save(
      combos.map((code) => this.comboRepo.create({ code })),
    );

    const getCombo = (code: string) =>
      comboEntities.find((c) => c.code === code)!;

    const words: { word: string; combo: string }[] = [
      { word: 'barros', combo: 'BRS' },
      { word: 'brisa', combo: 'BRS' },
      { word: 'brusco', combo: 'BRS' },
      { word: 'tren', combo: 'TRN' },
      { word: 'trino', combo: 'TRN' },
      { word: 'carro', combo: 'CRR' },
      { word: 'corre', combo: 'CRR' },
    ];

    await this.wordRepo.save(
      words.map(({ word, combo }) =>
        this.wordRepo.create({ word, combination: getCombo(combo) }),
      ),
    );

    console.log('✅ Combinations and words seeded');
  }
}
