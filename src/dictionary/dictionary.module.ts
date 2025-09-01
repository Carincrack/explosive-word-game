// dictionary/dictionary.module.ts
import { Module } from '@nestjs/common';
import { WordlistService } from '../wordlist/wordlist.service'; // ← Nombre correcto
// No hay SyllableService separado, está integrado en WordlistService

@Module({
  providers: [WordlistService],
  exports: [WordlistService],
})
export class DictionaryModule {}