import { Injectable, Logger } from '@nestjs/common';

// Sílabas más comunes en español, organizadas por dificultad
const EASY_SYLLABLES = [
  'ma', 're', 'to', 'la', 'co', 'sa', 'me', 'do', 'mi', 'ca', 
  'te', 'na', 'ro', 'no', 'se', 'ta', 'da', 'ra', 'pa', 'ga'
];

const MEDIUM_SYLLABLES = [
  'tri', 'bra', 'qui', 'chu', 'gra', 'pla', 'rio', 'fri', 'gua', 'ven',
  'tur', 'mar', 'sol', 'pan', 'nar', 'ras', 'zar', 'lon', 'mor', 'cor',
  'ber', 'cer', 'der', 'fer', 'ger', 'her', 'jer', 'ker', 'ler', 'mer'
];

const HARD_SYLLABLES = [
  'blo', 'clo', 'flo', 'glo', 'plo', 'tro', 'cro', 'dro', 'fro', 'gro',
  'pro', 'ble', 'cle', 'fle', 'gle', 'ple', 'tre', 'cre', 'dre', 'fre',
  'gre', 'pre', 'bri', 'cri', 'dri', 'fri', 'gri', 'pri', 'bli', 'cli'
];

const EXPERT_SYLLABLES = [
  'scr', 'spr', 'str', 'thr', 'sch', 'spl', 'squ', 'chr', 'phr', 'rhy',
  'xil', 'xer', 'psi', 'phi', 'rho', 'chi', 'xi', 'eta', 'omy', 'ogy'
];

@Injectable()
export class SyllableService {
  private readonly logger = new Logger(SyllableService.name);
  
  private allSyllables: string[] = [
    ...EASY_SYLLABLES,
    ...MEDIUM_SYLLABLES,
    ...HARD_SYLLABLES,
    ...EXPERT_SYLLABLES
  ];

  constructor() {
    this.logger.log(`Initialized with ${this.allSyllables.length} syllables`);
  }

  /**
   * Obtiene una sílaba aleatoria
   */
  getRandomSyllable(): string {
    return this.allSyllables[Math.floor(Math.random() * this.allSyllables.length)];
  }

  /**
   * Obtiene una sílaba basada en dificultad
   * @param difficulty - 'easy' | 'medium' | 'hard' | 'expert' | 'random'
   */
  getSyllableByDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'random' = 'random'): string {
    let syllables: string[];
    
    switch (difficulty) {
      case 'easy':
        syllables = EASY_SYLLABLES;
        break;
      case 'medium':
        syllables = MEDIUM_SYLLABLES;
        break;
      case 'hard':
        syllables = HARD_SYLLABLES;
        break;
      case 'expert':
        syllables = EXPERT_SYLLABLES;
        break;
      case 'random':
      default:
        syllables = this.allSyllables;
        break;
    }
    
    return syllables[Math.floor(Math.random() * syllables.length)];
  }

  /**
   * Obtiene una sílaba progresiva basada en la ronda
   * Las primeras rondas son más fáciles
   */
  getProgressiveSyllable(round: number): string {
    if (round <= 5) return this.getSyllableByDifficulty('easy');
    if (round <= 15) return this.getSyllableByDifficulty('medium');
    if (round <= 30) return this.getSyllableByDifficulty('hard');
    return this.getSyllableByDifficulty('expert');
  }

  /**
   * Valida si un texto contiene la sílaba requerida
   */
  containsSyllable(word: string, syllable: string): boolean {
    if (!word || !syllable) return false;
    
    const normalizedWord = this.normalize(word.toLowerCase());
    const normalizedSyllable = this.normalize(syllable.toLowerCase());
    
    return normalizedWord.includes(normalizedSyllable);
  }

  /**
   * Normaliza texto removiendo acentos y caracteres especiales
   */
  private normalize(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .toLowerCase()
      .trim();
  }

  /**
   * Obtiene estadísticas de las sílabas
   */
  getStats(): {
    total: number;
    easy: number;
    medium: number;
    hard: number;
    expert: number;
  } {
    return {
      total: this.allSyllables.length,
      easy: EASY_SYLLABLES.length,
      medium: MEDIUM_SYLLABLES.length,
      hard: HARD_SYLLABLES.length,
      expert: EXPERT_SYLLABLES.length,
    };
  }

  /**
   * Añade sílabas personalizadas (para extensibilidad futura)
   */
  addCustomSyllables(syllables: string[]): void {
    const validSyllables = syllables.filter(s => 
      typeof s === 'string' && 
      s.length >= 2 && 
      s.length <= 4 &&
      /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+$/u.test(s)
    );
    
    this.allSyllables.push(...validSyllables);
    this.logger.log(`Added ${validSyllables.length} custom syllables`);
  }
}