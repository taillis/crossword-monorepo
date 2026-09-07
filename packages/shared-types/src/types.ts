export type Direction = 'horizontal' | 'vertical';

export interface WordPlacement {
  id: string;
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: Direction;
  length: number;
}

export type DifficultyLevel = 'facil' | 'medio' | 'dificil';

export interface BoardDifficultyMetrics {
  score: number; // 0 a 100
  level: DifficultyLevel;
  interlockingRatio: number; // proporção de células cruzadas (0.0 a 1.0)
  averageWordLength: number;
  totalWords: number;
  totalUniqueCells: number;
  crossedCells: number;
}

export interface PuzzleGrid {
  bounds: { rows: number; cols: number };
  placedWords: WordPlacement[];
  difficulty?: DifficultyLevel;
  metrics?: BoardDifficultyMetrics;
}

export interface WordNode {
  word: string;
  clue: string;
}
