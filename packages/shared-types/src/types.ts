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

export interface PuzzleGrid {
  bounds: { rows: number; cols: number };
  placedWords: WordPlacement[];
}

export interface WordNode {
  word: string;
  clue: string;
}
