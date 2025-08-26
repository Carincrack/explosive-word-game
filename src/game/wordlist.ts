import { Injectable } from '@nestjs/common';

     const ES_SYLLABLES = ['ma', 're', 'to', 'la', 'co', 'tri', 'bra', 'qui', 'chu', 'cio', 'gra', 'pla', 'rio', 'fri', 'gua', 'ven', 'tur', 'mar', 'sol', 'pan', 'nar', 'ras', 'zar', 'lon'];
     const DICTIONARY = new Set(['casa', 'mesa', 'sol', 'nariz', 'guitarra', 'libro', 'árbol', 'perro', 'gato', 'río']);

     @Injectable()
     export class WordlistService {
       normalize(word: string) {
         return word
           .toLowerCase()
           .trim()
           .normalize('NFD')
           .replace(/\p{Diacritic}+/gu, '');
       }

       isAlpha(word: string) {
         return /^(?=.{2,40}$)[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+$/u.test(word);
       }

       containsPrompt(word: string, prompt: string) {
         return this.normalize(word).includes(this.normalize(prompt));
       }

       nextSyllable(): string {
         return ES_SYLLABLES[Math.floor(Math.random() * ES_SYLLABLES.length)];
       }

       isValidWord(word: string): boolean {
         return DICTIONARY.has(this.normalize(word));
       }
     }