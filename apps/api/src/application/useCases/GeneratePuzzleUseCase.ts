import { randomUUID } from 'crypto';
import { ICrosswordEngine, IPuzzleRepository, IWordProvider } from '../../domain/interfaces';
import { PuzzleGrid, DifficultyLevel } from 'shared-types';

export class GeneratePuzzleUseCase {
  constructor(
    private puzzleRepo: IPuzzleRepository,
    private wordProvider: IWordProvider,
    private crosswordEngine: ICrosswordEngine
  ) {}

  async execute(
    theme: string = 'tecnologia',
    wordCount: number = 8,
    difficulty?: DifficultyLevel
  ): Promise<{ id: string; grid: PuzzleGrid }> {
    // 1. Busca palavras temáticas do provedor com base na dificuldade
    const words = await this.wordProvider.fetchThematicWords(theme, wordCount, difficulty);

    // 2. Executa o algoritmo de backtracking para compor o grid
    const grid = this.crosswordEngine.generate(words, undefined, difficulty);

    // 3. Persiste no repositório
    const puzzleId = randomUUID();
    await this.puzzleRepo.save(puzzleId, grid);

    return { id: puzzleId, grid };
  }
}
