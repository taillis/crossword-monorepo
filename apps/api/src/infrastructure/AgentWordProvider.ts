import { WordNode, OfflineWordProvider } from 'shared-types';
import { IWordProvider } from '../domain/interfaces';

export class AgentWordProvider implements IWordProvider {
  private offlineProvider: OfflineWordProvider;

  constructor() {
    this.offlineProvider = new OfflineWordProvider();
  }

  async fetchThematicWords(theme: string, count: number = 8): Promise<WordNode[]> {
    // Retorna as palavras do banco offline estruturado (>6.500 termos)
    return this.offlineProvider.fetchThematicWords(theme, count);
  }

  getAvailableThemes(): string[] {
    return this.offlineProvider.getAvailableThemes();
  }
}
