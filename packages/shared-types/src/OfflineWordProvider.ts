import { WordNode, DifficultyLevel } from './types.js';
import wordsData from './data/words.js';

export const THEME_LABELS: Record<string, string> = {
  todos: 'Todos',
  geral: 'Geral',
  tecnologia: 'Tecnologia',
  ciencia: 'Ciência',
  natureza: 'Natureza',
  geografia: 'Geografia',
  historia: 'História',
};

export type WordCategory = keyof typeof THEME_LABELS;

export interface IOfflineWordProvider {
  fetchThematicWords(theme?: string, count?: number, difficulty?: DifficultyLevel): WordNode[];
  getAvailableThemes(): string[];
}

export class OfflineWordProvider implements IOfflineWordProvider {
  private dictionary: Record<string, WordNode[]>;

  constructor(customDictionary?: Record<string, WordNode[]>) {
    this.dictionary = customDictionary || (wordsData as unknown as Record<string, WordNode[]>);
  }

  public getAvailableThemes(): string[] {
    const keys = Object.keys(this.dictionary);
    const order = ['todos', 'tecnologia', 'ciencia', 'natureza', 'geografia', 'historia', 'geral'];
    return order.filter((k) => keys.includes(k) && (this.dictionary[k]?.length || 0) >= 10);
  }

  public fetchThematicWords(
    theme: string = 'todos',
    count: number = 8,
    difficulty?: DifficultyLevel
  ): WordNode[] {
    // Normaliza acentos para busca flexível (ex: 'ciência' -> 'ciencia')
    const normalizedTheme = theme
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    let pool = this.dictionary[normalizedTheme];

    if (!pool || pool.length === 0) {
      pool = this.dictionary['geral'] || this.dictionary['todos'] || [];
    }

    if (pool.length === 0) {
      return [];
    }

    // Filtrar pelo nível de dificuldade baseado no comprimento da palavra
    let filteredPool = pool;
    if (difficulty === 'facil') {
      filteredPool = pool.filter((w) => w.word.length >= 3 && w.word.length <= 6);
    } else if (difficulty === 'medio') {
      filteredPool = pool.filter((w) => w.word.length >= 5 && w.word.length <= 9);
    } else if (difficulty === 'dificil') {
      filteredPool = pool.filter((w) => w.word.length >= 7);
    }

    // Se o pool filtrado for insuficiente, busca complemento no pool global de 'todos'
    if (difficulty && filteredPool.length < count) {
      const globalPool = this.dictionary['todos'] || this.dictionary['geral'] || [];
      let globalFiltered: WordNode[] = [];

      if (difficulty === 'facil') {
        globalFiltered = globalPool.filter((w) => w.word.length >= 3 && w.word.length <= 6);
      } else if (difficulty === 'medio') {
        globalFiltered = globalPool.filter((w) => w.word.length >= 5 && w.word.length <= 9);
      } else if (difficulty === 'dificil') {
        globalFiltered = globalPool.filter((w) => w.word.length >= 7);
      }

      const existingWords = new Set(filteredPool.map((w) => w.word.toUpperCase()));
      for (const candidate of globalFiltered) {
        if (!existingWords.has(candidate.word.toUpperCase())) {
          filteredPool.push(candidate);
          existingWords.add(candidate.word.toUpperCase());
        }
        if (filteredPool.length >= count * 2) break;
      }
    }

    // Fallback de segurança: se ainda não houver palavras suficientes, usa o pool original
    if (filteredPool.length === 0) {
      filteredPool = pool;
    }

    // Embaralha para variedade (algoritmo Fisher-Yates)
    const shuffled = [...filteredPool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  }
}
