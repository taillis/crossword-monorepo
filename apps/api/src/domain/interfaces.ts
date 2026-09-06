import { PuzzleGrid, WordNode } from 'shared-types';

export interface IPuzzleRepository {
  save(puzzleId: string, grid: PuzzleGrid): Promise<void>;
  findById(puzzleId: string): Promise<PuzzleGrid | null>;
}

export interface IWordProvider {
  fetchThematicWords(theme: string, count: number): Promise<WordNode[]>;
}

export interface ICrosswordEngine {
  generate(words: WordNode[], maxGridSize?: number): PuzzleGrid;
}
