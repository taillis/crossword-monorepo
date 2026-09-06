import { WordNode } from './types.js';
import wordsData from './data/words.json';

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
  fetchThematicWords(theme: string, count: number): WordNode[];
  getAvailableThemes(): string[];
}

export class OfflineWordProvider implements IOfflineWordProvider {
  private dictionary: Record<string, WordNode[]>;

  constructor(customDictionary?: Record<string, WordNode[]>) {
    this.dictionary = (customDictionary || (wordsData as unknown as Record<string, WordNode[]>));
  }

  public getAvailableThemes(): string[] {
    const keys = Object.keys(this.dictionary);
    const order = ['todos', 'tecnologia', 'ciencia', 'natureza', 'geografia', 'historia', 'geral'];
    return order.filter((k) => keys.includes(k) && (this.dictionary[k]?.length || 0) >= 10);
  }

  public fetchThematicWords(theme: string = 'todos', count: number = 8): WordNode[] {
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

    // Embaralha para variedade
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  }
}
