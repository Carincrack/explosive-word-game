import { Module } from '@nestjs/common';
import { WordlistService } from './wordlist.service';
import { WordlistController } from './wordlist.controller';

@Module({
  providers: [WordlistService],
  controllers: [WordlistController],
  exports: [WordlistService],
})
export class WordlistModule {}