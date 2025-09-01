import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

// Sílabas más comunes en español (expandido)
const ES_SYLLABLES = [
  // Sílabas simples
  'ma', 're', 'to', 'la', 'co', 'na', 'do', 'es', 'te', 'de',
  'se', 'le', 'da', 'ra', 'ta', 'ca', 'pa', 'sa', 'ba', 'fa',
  'ga', 'ha', 'ja', 'ka', 'va', 'wa', 'ya', 'za',
  
  // Sílabas con consonantes combinadas
  'tra', 'pre', 'pro', 'bra', 'cra', 'dra', 'fra', 'gra', 'pra',
  'tri', 'tre', 'tro', 'bri', 'bre', 'bro', 'cri', 'cre', 'cro',
  'dri', 'dre', 'dro', 'fri', 'fre', 'fro', 'gri', 'gre', 'gro',
  'pri', 'pru', 'pla', 'ple', 'pli', 'plo', 'plu',
  'bla', 'ble', 'bli', 'blo', 'blu', 'cla', 'cle', 'cli', 'clo', 'clu',
  'fla', 'fle', 'fli', 'flo', 'flu', 'gla', 'gle', 'gli', 'glo', 'glu',
  
  // Sílabas con dígrafos
  'cha', 'che', 'chi', 'cho', 'chu',
  'lla', 'lle', 'lli', 'llo', 'llu',
  'ña', 'ñe', 'ñi', 'ño', 'ñu',
  'rra', 'rre', 'rri', 'rro', 'rru',
  
  // Sílabas complejas
  'ción', 'sión', 'mente', 'ante', 'ente', 'idad', 'ador', 'edor',
  'ismo', 'ista', 'anza', 'encia', 'ancia', 'illo', 'allo', 'ello',
  'oso', 'osa', 'ivo', 'iva', 'able', 'ible',
  
  // Sílabas con vocales combinadas
  'ai', 'au', 'ei', 'eu', 'oi', 'ou', 'ia', 'ie', 'io', 'iu',
  'ua', 'ue', 'ui', 'uo', 'ay', 'ey', 'oy', 'uy'
];

// Diccionario español expandido
const ES_DICTIONARY = new Set([
  // Palabras básicas
  'casa', 'mesa', 'silla', 'puerta', 'ventana', 'libro', 'papel', 'pluma',
  'agua', 'fuego', 'tierra', 'aire', 'sol', 'luna', 'estrella', 'cielo',
  'mar', 'rio', 'montaña', 'bosque', 'árbol', 'flor', 'hierba', 'piedra',
  
  // Animales
  'perro', 'gato', 'caballo', 'vaca', 'cerdo', 'oveja', 'cabra', 'pollo',
  'pato', 'ganso', 'conejo', 'ratón', 'león', 'tigre', 'oso', 'lobo',
  'zorro', 'ciervo', 'elefante', 'mono', 'serpiente', 'pez', 'pájaro', 'águila',
  
  // Colores
  'rojo', 'azul', 'verde', 'amarillo', 'naranja', 'morado', 'rosa', 'negro',
  'blanco', 'gris', 'marrón', 'violeta', 'turquesa', 'dorado', 'plateado',
  
  // Comida
  'pan', 'queso', 'leche', 'carne', 'pollo', 'pescado', 'arroz', 'pasta',
  'tomate', 'cebolla', 'ajo', 'papa', 'zanahoria', 'lechuga', 'manzana',
  'naranja', 'plátano', 'uva', 'fresa', 'pera', 'limón', 'sandía', 'melón',
  
  // Cuerpo humano
  'cabeza', 'cara', 'ojo', 'nariz', 'boca', 'oreja', 'cuello', 'brazo',
  'mano', 'dedo', 'pierna', 'pie', 'espalda', 'pecho', 'corazón', 'cerebro',
  
  // Familia
  'madre', 'padre', 'hijo', 'hija', 'hermano', 'hermana', 'abuelo', 'abuela',
  'tío', 'tía', 'primo', 'prima', 'esposo', 'esposa', 'novio', 'novia',
  
  // Ropa
  'camisa', 'pantalón', 'falda', 'vestido', 'zapato', 'calcetín', 'sombrero',
  'abrigo', 'chaqueta', 'bufanda', 'guante', 'cinturón', 'corbata',
  
  // Transporte
  'coche', 'autobús', 'tren', 'avión', 'barco', 'bicicleta', 'motocicleta',
  'camión', 'taxi', 'metro', 'helicóptero', 'globo',
  
  // Profesiones
  'doctor', 'enfermera', 'maestro', 'estudiante', 'ingeniero', 'abogado',
  'policía', 'bombero', 'cocinero', 'mesero', 'vendedor', 'agricultor',
  
  // Lugares
  'escuela', 'hospital', 'tienda', 'restaurante', 'hotel', 'iglesia',
  'museo', 'teatro', 'cine', 'parque', 'playa', 'ciudad', 'pueblo',
  
  // Acciones comunes
  'caminar', 'correr', 'saltar', 'nadar', 'volar', 'comer', 'beber',
  'dormir', 'despertar', 'trabajar', 'estudiar', 'jugar', 'cantar',
  'bailar', 'leer', 'escribir', 'hablar', 'escuchar', 'mirar', 'tocar',
  
  // Emociones
  'feliz', 'triste', 'enojado', 'asustado', 'sorprendido', 'aburrido',
  'cansado', 'emocionado', 'nervioso', 'tranquilo', 'preocupado',
  
  // Números
  'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho',
  'nueve', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta',
  'cien', 'mil', 'millón',
  
  // Tiempo
  'segundo', 'minuto', 'hora', 'día', 'semana', 'mes', 'año', 'siglo',
  'mañana', 'tarde', 'noche', 'ayer', 'hoy', 'mañana', 'lunes', 'martes',
  'miércoles', 'jueves', 'viernes', 'sábado', 'domingo',
  
  // Palabras adicionales para el juego
  'guitarra', 'piano', 'violín', 'tambor', 'flauta', 'trompeta',
  'computadora', 'teléfono', 'televisión', 'radio', 'cámara', 'reloj',
  'espejo', 'lámpara', 'cuchillo', 'tenedor', 'cuchara', 'plato', 'vaso',
  'montaña', 'volcán', 'desierto', 'selva', 'océano', 'isla', 'continente',
  'planeta', 'galaxia', 'universo', 'átomo', 'molécula', 'elemento',
  'energía', 'materia', 'tiempo', 'espacio', 'gravedad', 'luz', 'sonido'
]);

@Injectable()
export class WordlistService {
  private externalApiUrl = 'https://api.dictionaryapi.dev/api/v2/entries/es/'; // API externa opcional
  private useExternalApi = false; // Flag para usar API externa

  constructor() {
    console.log(`Diccionario cargado con ${ES_DICTIONARY.size} palabras`);
    console.log(`Sílabas disponibles: ${ES_SYLLABLES.length}`);
  }

  /**
   * Normaliza una palabra removiendo acentos y convirtiendo a minúsculas
   */
  normalize(word: string): string {
    return word
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '');
  }

  /**
   * Verifica si una palabra contiene solo caracteres alfabéticos válidos
   */
  isAlpha(word: string): boolean {
    return /^(?=.{2,40}$)[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]+$/u.test(word);
  }

  /**
   * Verifica si una palabra contiene la sílaba prompt
   */
  containsPrompt(word: string, prompt: string): boolean {
    const normalizedWord = this.normalize(word);
    const normalizedPrompt = this.normalize(prompt);
    return normalizedWord.includes(normalizedPrompt);
  }

  /**
   * Obtiene una sílaba aleatoria
   */
  async nextSyllable(): Promise<string> {
    const randomIndex = Math.floor(Math.random() * ES_SYLLABLES.length);
    return ES_SYLLABLES[randomIndex];
  }

  /**
   * Verifica si una palabra es válida usando el diccionario local
   */
  async isValidWord(word: string): Promise<boolean> {
    const normalizedWord = this.normalize(word);
    
    // Primero verificar en diccionario local
    const isLocalValid = ES_DICTIONARY.has(normalizedWord);
    
    if (isLocalValid) {
      return true;
    }

    // Si está habilitada la API externa, intentar validar ahí
    if (this.useExternalApi) {
      try {
        return await this.checkExternalApi(normalizedWord);
      } catch (error) {
        console.warn(`Error al consultar API externa: ${error.message}`);
        return false;
      }
    }

    return false;
  }

  /**
   * Consulta una API externa para validar palabras (opcional)
   */
  private async checkExternalApi(word: string): Promise<boolean> {
    try {
      // Usar AbortController para timeout manual
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch(`${this.externalApiUrl}${word}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BombParty-Game/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        const data = await response.json();
        return Array.isArray(data) && data.length > 0;
      }
      
      return false;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new HttpException(
          'Timeout al consultar diccionario externo',
          HttpStatus.REQUEST_TIMEOUT
        );
      }
      throw new HttpException(
        'Error al consultar diccionario externo',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * Habilita o deshabilita el uso de API externa
   */
  setExternalApiEnabled(enabled: boolean): void {
    this.useExternalApi = enabled;
    console.log(`API externa ${enabled ? 'habilitada' : 'deshabilitada'}`);
  }

  /**
   * Configura una nueva URL para la API externa
   */
  setExternalApiUrl(url: string): void {
    this.externalApiUrl = url;
    console.log(`URL de API externa actualizada: ${url}`);
  }

  /**
   * Añade palabras al diccionario local
   */
  addWords(words: string[]): number {
    let added = 0;
    for (const word of words) {
      const normalized = this.normalize(word);
      if (this.isAlpha(word) && !ES_DICTIONARY.has(normalized)) {
        ES_DICTIONARY.add(normalized);
        added++;
      }
    }
    console.log(`${added} palabras añadidas al diccionario`);
    return added;
  }

  /**
   * Obtiene estadísticas del diccionario
   */
  getStats() {
    return {
      totalWords: ES_DICTIONARY.size,
      totalSyllables: ES_SYLLABLES.length,
      externalApiEnabled: this.useExternalApi,
      externalApiUrl: this.externalApiUrl
    };
  }

  /**
   * Busca palabras que contengan una sílaba específica (útil para testing)
   */
  findWordsWithSyllable(syllable: string, limit = 10): string[] {
    const normalizedSyllable = this.normalize(syllable);
    const results: string[] = [];
    
    for (const word of ES_DICTIONARY) {
      if (word.includes(normalizedSyllable)) {
        results.push(word);
        if (results.length >= limit) break;
      }
    }
    
    return results;
  }

  /**
   * Obtiene una muestra aleatoria de palabras del diccionario
   */
  getRandomWords(count = 10): string[] {
    const words = Array.from(ES_DICTIONARY);
    const result: string[] = [];
    
    for (let i = 0; i < Math.min(count, words.length); i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      const word = words[randomIndex];
      if (!result.includes(word)) {
        result.push(word);
      }
    }
    
    return result;
  }
}