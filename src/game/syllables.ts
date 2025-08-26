import { Injectable } from '@nestjs/common';

const ES_SYLLABLES = ['ma', 're', 'to', 'la', 'co', 'tri', 'bra', 'qui', 'chu', 'cio', 'gra', 'pla', 'rio', 'fri', 'gua', 'ven', 'tur', 'mar', 'sol', 'pan', 'nar', 'ras', 'zar', 'lon'];

@Injectable()
export class SyllableService {
  next(): string {
    return ES_SYLLABLES[Math.floor(Math.random() * ES_SYLLABLES.length)];
  }
}