import { randomUUID } from 'crypto';
import { ICrosswordEngine, IPuzzleRepository, IWordProvider } from '../../domain/interfaces';
import { PuzzleGrid } from 'shared-types';

export class GeneratePuzzleUseCase {
  constructor(
    private puzzleRepo: IPuzzleRepository,
    private wordProvider: IWordProvider,
    private crosswordEngine: ICrosswordEngine
  ) {}

  async execute(
    theme: string = 'tecnologia',
    wordCount: number = 8
  ): Promise<{ id: string; grid: PuzzleGrid }> {
    // 1. Busca palavras temáticas do provedor
    const words = await this.wordProvider.fetchThematicWords(theme, wordCount);

    // 2. Executa o algoritmo de backtracking para compor o grid
    const grid = this.crosswordEngine.generate(words);

    // 3. Persiste no repositório
    const puzzleId = randomUUID();
    await this.puzzleRepo.save(puzzleId, grid);

    return { id: puzzleId, grid };
  }
}
