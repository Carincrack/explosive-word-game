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
        console.warn('Archivo de diccionario no encontrado, cargando diccionario básico');
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
      'casa', 'mesa', 'agua', 'fuego', 'tierra', 'aire', 'libro', 'papel', 'lápiz', 'computadora',
      'teléfono', 'coche', 'perro', 'gato', 'árbol', 'flor', 'cielo', 'sol', 'luna', 'estrella',
      'montaña', 'río', 'mar', 'playa', 'ciudad', 'pueblo', 'escuela', 'hospital', 'banco', 'parque',
      'familia', 'madre', 'padre', 'hermano', 'hermana', 'abuelo', 'abuela', 'amigo', 'trabajo', 'dinero',
      'tiempo', 'día', 'noche', 'mañana', 'tarde', 'semana', 'mes', 'año', 'color', 'rojo',
      'azul', 'verde', 'amarillo', 'negro', 'blanco', 'grande', 'pequeño', 'alto', 'bajo', 'nuevo',
      'viejo', 'bueno', 'malo', 'fácil', 'difícil', 'rápido', 'lento', 'caliente', 'frío', 'dulce',
      'comida', 'bebida', 'café', 'leche', 'pan', 'carne', 'pescado', 'pollo', 'verdura', 'fruta',
      'manzana', 'naranja', 'plátano', 'limón', 'tomate', 'patata', 'cebolla', 'zanahoria', 'lechuga', 'arroz',
      'pasta', 'queso', 'huevo', 'azúcar', 'sal', 'pimienta', 'aceite', 'mantequilla', 'música', 'canción',
      // Palabras con sílabas específicas del juego
      'problema', 'solución', 'pregunta', 'respuesta', 'historia', 'presente', 'pasado', 'futuro',
      'naturaleza', 'animal', 'caballo', 'elefante', 'mariposa', 'serpiente', 'tortuga', 'océano',
      'bosque', 'desierto', 'continente', 'dirección', 'edificio', 'restaurante', 'universidad',
      'agricultura', 'importante', 'interesante', 'divertido', 'tranquilo', 'saludable', 'compañía',
      'matemáticas', 'estudiante', 'profesor', 'entender', 'recordar', 'conocer', 'comenzar',
      'terminar', 'continuar', 'trabajar', 'descansar', 'levantarse', 'acostarse', 'vestirse',
      'ducharse', 'cocinar', 'limpiar', 'comprar', 'encontrar', 'mostrar', 'esconder', 'proteger',
      'defender', 'competir', 'celebrar', 'agradecer', 'disculparse', 'construir', 'inventar',
      'fotografiar', 'comunicar', 'recomendar', 'organizar', 'preparar', 'decorar'
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

    // Verificar caracteres válidos (solo letras españolas)
    const validChars = /^[a-záéíóúüñ]+$/i;
    if (!validChars.test(cleanWord)) {
      return false;
    }

    // Verificar si está en nuestro diccionario
    return this.wordSet.has(cleanWord);
  }

  async validateWordWithSyllable(word: string, syllable: string): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    const cleanWord = word.toLowerCase().trim();
    const cleanSyllable = syllable.toLowerCase().trim();

    // Verificar que la palabra contenga la sílaba
    if (!cleanWord.includes(cleanSyllable)) {
      return {
        isValid: false,
        reason: 'La palabra no contiene la sílaba requerida'
      };
    }

    // Verificar que sea una palabra válida
    const isValid = await this.isValidWord(cleanWord);
    if (!isValid) {
      return {
        isValid: false,
        reason: 'Palabra no encontrada en el diccionario'
      };
    }

    return { isValid: true };
  }

  // Método para agregar palabras dinámicamente
  addWord(word: string): void {
    const cleanWord = word.toLowerCase().trim();
    if (cleanWord.length >= 2) {
      this.wordSet.add(cleanWord);
      console.log(`Palabra agregada: ${cleanWord}`);
    }
  }

  // Método para agregar múltiples palabras
  addWords(words: string[]): void {
    let count = 0;
    words.forEach(word => {
      const cleanWord = word.toLowerCase().trim();
      if (cleanWord.length >= 2) {
        this.wordSet.add(cleanWord);
        count++;
      }
    });
    console.log(`${count} palabras agregadas al diccionario`);
  }

  // Método para obtener estadísticas
  getStats(): { 
    totalWords: number; 
    initialized: boolean;
    averageLength: number;
  } {
    const words = Array.from(this.wordSet);
    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    const averageLength = words.length > 0 ? totalLength / words.length : 0;

    return {
      totalWords: this.wordSet.size,
      initialized: this.initialized,
      averageLength: Math.round(averageLength * 100) / 100
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

  // Método para verificar si el diccionario está listo
  isReady(): boolean {
    return this.initialized;
  }

  // Método para forzar la recarga del diccionario
  async reloadDictionary(): Promise<void> {
    this.wordSet.clear();
    this.initialized = false;
    await this.initializeDictionary();
  }
}