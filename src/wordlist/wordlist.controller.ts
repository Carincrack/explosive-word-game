
// wordlist.controller.ts
import { Controller, Get, Post, Body, Query, Put } from '@nestjs/common';
import { WordlistService } from './wordlist.service';
import { IsString, IsBoolean, IsOptional, IsArray, Length, IsUrl } from 'class-validator';

class UpdateApiConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsUrl()
  url?: string;
}

class AddWordsDto {
  @IsArray()
  @IsString({ each: true })
  @Length(2, 40, { each: true })
  words!: string[];
}

class ValidateWordDto {
  @IsString()
  @Length(2, 40)
  word!: string;
}

@Controller('wordlist')
export class WordlistController {
  constructor(private readonly wordlistService: WordlistService) {}

  @Get('stats')
  getStats() {
    return {
      success: true,
      data: this.wordlistService.getStats()
    };
  }

  @Get('syllable')
  async getRandomSyllable() {
    const syllable = await this.wordlistService.nextSyllable();
    return {
      success: true,
      syllable
    };
  }

  @Get('random-words')
  getRandomWords(@Query('count') count?: string) {
    const wordCount = count ? Math.min(parseInt(count), 50) : 10;
    const words = this.wordlistService.getRandomWords(wordCount);
    return {
      success: true,
      words,
      count: words.length
    };
  }

  @Get('search')
  searchWordsBySyllable(
    @Query('syllable') syllable: string,
    @Query('limit') limit?: string
  ) {
    if (!syllable) {
      return {
        success: false,
        error: 'Parámetro syllable es requerido'
      };
    }

    const searchLimit = limit ? Math.min(parseInt(limit), 50) : 10;
    const words = this.wordlistService.findWordsWithSyllable(syllable, searchLimit);
    
    return {
      success: true,
      syllable,
      words,
      count: words.length
    };
  }

  @Post('validate')
  async validateWord(@Body() dto: ValidateWordDto) {
    if (!this.wordlistService.isAlpha(dto.word)) {
      return {
        success: false,
        valid: false,
        reason: 'Caracteres inválidos'
      };
    }

    const isValid = await this.wordlistService.isValidWord(dto.word);
    return {
      success: true,
      word: dto.word,
      valid: isValid,
      normalized: this.wordlistService.normalize(dto.word)
    };
  }

  @Post('add-words')
  addWords(@Body() dto: AddWordsDto) {
    const added = this.wordlistService.addWords(dto.words);
    return {
      success: true,
      message: `${added} palabras añadidas al diccionario`,
      added,
      total: this.wordlistService.getStats().totalWords
    };
  }

  @Put('api-config')
  updateApiConfig(@Body() dto: UpdateApiConfigDto) {
    if (dto.enabled !== undefined) {
      this.wordlistService.setExternalApiEnabled(dto.enabled);
    }
    
    if (dto.url) {
      this.wordlistService.setExternalApiUrl(dto.url);
    }

    return {
      success: true,
      message: 'Configuración actualizada',
      config: this.wordlistService.getStats()
    };
  }

  @Get('test-syllable')
  async testSyllable(@Query('syllable') syllable?: string) {
    const testSyllable = syllable || await this.wordlistService.nextSyllable();
    const words = this.wordlistService.findWordsWithSyllable(testSyllable, 5);
    
    return {
      success: true,
      syllable: testSyllable,
      foundWords: words,
      count: words.length,
      message: words.length > 0 
        ? `Encontradas ${words.length} palabras con la sílaba '${testSyllable}'`
        : `No se encontraron palabras con la sílaba '${testSyllable}'`
    };
  }
}