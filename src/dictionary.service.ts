// src/services/dictionary.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DictionaryService {
  private wordSet: Set<string> = new Set();
  private initialized = false;

  constructor() {
    // Inicializar de forma asíncrona sin esperar
    this.initializeDictionary().catch(error => {
      console.error('Error inicializando diccionario:', error);
    });
  }

  private async initializeDictionary(): Promise<void> {
    try {
      // Cargar diccionario desde archivo
      const dictionaryPath = path.join(process.cwd(), 'src/data/spanish-words.txt');
      
      if (fs.existsSync(dictionaryPath)) {
        const words = fs.readFileSync(dictionaryPath, 'utf8')
          .split('\n')
          .map(word => word.trim().toLowerCase())
          .filter(word => word.length > 0);
        
        words.forEach(word => this.wordSet.add(word));
        console.log(`Diccionario cargado: ${this.wordSet.size} palabras`);
      } else {
        // Diccionario básico de respaldo
        this.loadBasicDictionary();
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error cargando diccionario:', error);
      this.loadBasicDictionary();
      this.initialized = true;
    }
  }

  private loadBasicDictionary(): void {
    const basicWords = [
      // Palabras comunes con diferentes sílabas
      'casa', 'mesa', 'silla', 'puerta', 'ventana', 'techo', 'piso', 'pared',
      'agua', 'fuego', 'tierra', 'aire', 'sol', 'luna', 'estrella', 'cielo',
      'perro', 'gato', 'ratón', 'pájaro', 'pez', 'caballo', 'vaca', 'cerdo',
      'árbol', 'flor', 'rosa', 'hoja', 'rama', 'raíz', 'fruto', 'semilla',
      'coche', 'tren', 'avión', 'barco', 'bicicleta', 'moto', 'camión', 'bus',
      'rojo', 'azul', 'verde', 'amarillo', 'negro', 'blanco', 'gris', 'rosa',
      'grande', 'pequeño', 'alto', 'bajo', 'gordo', 'delgado', 'fuerte', 'débil',
      'correr', 'caminar', 'saltar', 'bailar', 'cantar', 'reír', 'llorar', 'dormir',
      'comer', 'beber', 'cocinar', 'limpiar', 'estudiar', 'trabajar', 'jugar', 'leer',
      'familia', 'padre', 'madre', 'hijo', 'hija', 'hermano', 'hermana', 'abuelo',
      'escuela', 'maestro', 'alumno', 'libro', 'cuaderno', 'lápiz', 'papel', 'mesa',
      'hospital', 'doctor', 'enfermera', 'medicina', 'enfermo', 'sano', 'dolor', 'cura',
      'tienda', 'dinero', 'comprar', 'vender', 'caro', 'barato', 'precio', 'pagar',
      'música', 'canción', 'guitarra', 'piano', 'violín', 'tambor', 'flauta', 'banda',
      'deporte', 'fútbol', 'básquet', 'tenis', 'natación', 'correr', 'ganar', 'perder',
      // Palabras con sílabas específicas para el juego
      'taco', 'tapa', 'taxi', 'rata', 'pata', 'data', 'lata', 'mata',
      'ropa', 'copa', 'sopa', 'lupa', 'papa', 'mapa', 'capa', 'tapa',
      'cine', 'pino', 'vino', 'sino', 'fino', 'mina', 'rima', 'lima',
      'loco', 'poco', 'coco', 'roca', 'boca', 'foca', 'coca', 'toca',
      'mesa', 'pesa', 'tesa', 'besa', 'resa', 'cesa', 'lesa', 'nesa',
      'pelo', 'bello', 'sello', 'mello', 'cello', 'hello', 'tello', 'vello',
      'kilo', 'milo', 'silo', 'filo', 'hilo', 'pila', 'mila', 'lila',
      'muro', 'duro', 'puro', 'cura', 'lura', 'tura', 'sura', 'nura',
      'nave', 'cave', 'pave', 'save', 'have', 'dave', 'rave', 'wave',
      'taxi', 'maxi', 'pixi', 'boxi', 'foxi', 'coxi', 'roxi', 'moxi',
      'yoga', 'joya', 'soya', 'hoya', 'goya', 'moya', 'roya', 'coya',
      'fumar', 'lunar', 'solar', 'polar', 'molar', 'colar', 'volar', 'rodar'
    ];

    basicWords.forEach(word => this.wordSet.add(word.toLowerCase()));
    console.log(`Diccionario básico cargado: ${this.wordSet.size} palabras`);
  }

  async isValidWord(word: string): Promise<boolean> {
    // Esperar a que se inicialice el diccionario
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const cleanWord = word.toLowerCase().trim();
    
    // Validaciones básicas
    if (cleanWord.length < 2 || cleanWord.length > 20) {
      return false;
    }

    // Verificar si está en nuestro diccionario
    return this.wordSet.has(cleanWord);
  }

  async validateWordWithSyllable(word: string, syllable: string): Promise<boolean> {
    const isValid = await this.isValidWord(word);
    if (!isValid) return false;

    const cleanWord = word.toLowerCase();
    const cleanSyllable = syllable.toLowerCase();

    return cleanWord.includes(cleanSyllable);
  }

  // Método para agregar palabras dinámicamente
  addWord(word: string): void {
    this.wordSet.add(word.toLowerCase().trim());
  }

  // Método para obtener estadísticas
  getStats(): { totalWords: number } {
    return {
      totalWords: this.wordSet.size
    };
  }

  // Método para buscar palabras que contengan una sílaba (útil para testing)
  findWordsWithSyllable(syllable: string, limit: number = 10): string[] {
    const matches: string[] = [];
    const cleanSyllable = syllable.toLowerCase();
    
    for (const word of this.wordSet) {
      if (word.includes(cleanSyllable) && matches.length < limit) {
        matches.push(word);
      }
    }
    
    return matches;
  }
}

