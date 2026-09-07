import { Direction, PuzzleGrid, WordNode, WordPlacement } from './types.js';

export interface ICrosswordEngine {
  generate(words: WordNode[], maxGridSize?: number): PuzzleGrid;
}

interface Cell {
  char: string;
  horizontalWordId?: string;
  verticalWordId?: string;
}

interface CandidatePlacement {
  row: number;
  col: number;
  direction: Direction;
  intersections: number;
}

export class CrosswordEngine implements ICrosswordEngine {
  private readonly defaultGridSize: number;

  constructor(defaultGridSize: number = 30) {
    this.defaultGridSize = defaultGridSize;
  }

  public generate(words: WordNode[], maxGridSize?: number): PuzzleGrid {
    const gridSize = maxGridSize ?? this.defaultGridSize;

    const normalizedWords = words
      .map((w, index) => ({
        id: `word-${index + 1}`,
        word: this.normalizeText(w.word),
        clue: w.clue,
      }))
      .filter((w) => w.word.length >= 2);

    if (normalizedWords.length === 0) {
      return { bounds: { rows: 0, cols: 0 }, placedWords: [] };
    }

    normalizedWords.sort((a, b) => b.word.length - a.word.length);

    const bestPlacements = this.solveWithBacktracking(normalizedWords, gridSize);

    return this.formatPuzzleGrid(bestPlacements);
  }

  private normalizeText(text: string): string {
    return text
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z]/g, '');
  }

  private solveWithBacktracking(
    words: { id: string; word: string; clue: string }[],
    gridSize: number
  ): WordPlacement[] {
    let bestResult: WordPlacement[] = [];

    const grid: (Cell | null)[][] = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(null)
    );

    const placed: WordPlacement[] = [];

    const firstWord = words[0];
    const startRow = Math.floor(gridSize / 2);
    const startCol = Math.max(0, Math.floor((gridSize - firstWord.word.length) / 2));

    this.applyPlacement(grid, {
      id: firstWord.id,
      word: firstWord.word,
      clue: firstWord.clue,
      row: startRow,
      col: startCol,
      direction: 'horizontal',
      length: firstWord.word.length,
    });

    placed.push({
      id: firstWord.id,
      word: firstWord.word,
      clue: firstWord.clue,
      row: startRow,
      col: startCol,
      direction: 'horizontal',
      length: firstWord.word.length,
    });

    bestResult = [...placed];

    let steps = 0;
    const MAX_STEPS = 250;

    const backtrack = (wordIndex: number): void => {
      steps++;
      if (steps > MAX_STEPS || placed.length === words.length) {
        if (placed.length > bestResult.length) {
          bestResult = [...placed];
        }
        return;
      }

      if (wordIndex >= words.length) {
        if (placed.length > bestResult.length) {
          bestResult = [...placed];
        }
        return;
      }

      const currentWord = words[wordIndex];
      const candidates = this.findCandidates(grid, currentWord.word, gridSize);

      // Prioriza candidatos com mais cruzamentos
      candidates.sort((a, b) => b.intersections - a.intersections);

      // Branch pruning: explorar apenas os 3 melhores candidatos para evitar explosão combinatória
      const topCandidates = candidates.slice(0, 3);

      let placedAny = false;

      for (const candidate of topCandidates) {
        if (steps > MAX_STEPS) break;

        const placement: WordPlacement = {
          id: currentWord.id,
          word: currentWord.word,
          clue: currentWord.clue,
          row: candidate.row,
          col: candidate.col,
          direction: candidate.direction,
          length: currentWord.word.length,
        };

        this.applyPlacement(grid, placement);
        placed.push(placement);
        placedAny = true;

        if (placed.length > bestResult.length) {
          bestResult = [...placed];
        }

        backtrack(wordIndex + 1);

        placed.pop();
        this.removePlacement(grid, placement);
      }

      if (!placedAny && steps <= MAX_STEPS) {
        backtrack(wordIndex + 1);
      }
    };

    backtrack(1);

    return bestResult;
  }

  private findCandidates(
    grid: (Cell | null)[][],
    word: string,
    gridSize: number
  ): CandidatePlacement[] {
    const candidates: CandidatePlacement[] = [];

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = grid[r][c];
        if (!cell) continue;

        for (let i = 0; i < word.length; i++) {
          if (word[i] === cell.char) {
            if (!cell.verticalWordId) {
              const testRow = r - i;
              const testCol = c;
              if (this.canPlaceWord(grid, word, testRow, testCol, 'vertical', gridSize)) {
                candidates.push({
                  row: testRow,
                  col: testCol,
                  direction: 'vertical',
                  intersections: this.countIntersections(grid, word, testRow, testCol, 'vertical'),
                });
              }
            }

            if (!cell.horizontalWordId) {
              const testRow = r;
              const testCol = c - i;
              if (this.canPlaceWord(grid, word, testRow, testCol, 'horizontal', gridSize)) {
                candidates.push({
                  row: testRow,
                  col: testCol,
                  direction: 'horizontal',
                  intersections: this.countIntersections(
                    grid,
                    word,
                    testRow,
                    testCol,
                    'horizontal'
                  ),
                });
              }
            }
          }
        }
      }
    }

    return candidates;
  }

  private canPlaceWord(
    grid: (Cell | null)[][],
    word: string,
    row: number,
    col: number,
    direction: Direction,
    gridSize: number
  ): boolean {
    const isHoriz = direction === 'horizontal';
    const endRow = isHoriz ? row : row + word.length - 1;
    const endCol = isHoriz ? col + word.length - 1 : col;

    if (row < 0 || col < 0 || endRow >= gridSize || endCol >= gridSize) {
      return false;
    }

    const beforeRow = isHoriz ? row : row - 1;
    const beforeCol = isHoriz ? col - 1 : col;
    if (this.isCellOccupied(grid, beforeRow, beforeCol, gridSize)) {
      return false;
    }

    const afterRow = isHoriz ? row : endRow + 1;
    const afterCol = isHoriz ? endCol + 1 : col;
    if (this.isCellOccupied(grid, afterRow, afterCol, gridSize)) {
      return false;
    }

    let hasIntersection = false;

    for (let i = 0; i < word.length; i++) {
      const r = isHoriz ? row : row + i;
      const c = isHoriz ? col + i : col;
      const existing = grid[r][c];

      if (existing) {
        if (existing.char !== word[i]) {
          return false;
        }
        if (isHoriz && existing.horizontalWordId) {
          return false;
        }
        if (!isHoriz && existing.verticalWordId) {
          return false;
        }
        hasIntersection = true;
      } else {
        if (isHoriz) {
          if (
            this.isCellOccupied(grid, r - 1, c, gridSize) ||
            this.isCellOccupied(grid, r + 1, c, gridSize)
          ) {
            return false;
          }
        } else {
          if (
            this.isCellOccupied(grid, r, c - 1, gridSize) ||
            this.isCellOccupied(grid, r, c + 1, gridSize)
          ) {
            return false;
          }
        }
      }
    }

    return hasIntersection;
  }

  private countIntersections(
    grid: (Cell | null)[][],
    word: string,
    row: number,
    col: number,
    direction: Direction
  ): number {
    let count = 0;
    const isHoriz = direction === 'horizontal';

    for (let i = 0; i < word.length; i++) {
      const r = isHoriz ? row : row + i;
      const c = isHoriz ? col + i : col;
      if (grid[r][c] && grid[r][c]?.char === word[i]) {
        count++;
      }
    }

    return count;
  }

  private isCellOccupied(
    grid: (Cell | null)[][],
    row: number,
    col: number,
    gridSize: number
  ): boolean {
    if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) {
      return false;
    }
    return grid[row][col] !== null;
  }

  private applyPlacement(grid: (Cell | null)[][], placement: WordPlacement): void {
    const isHoriz = placement.direction === 'horizontal';

    for (let i = 0; i < placement.length; i++) {
      const r = isHoriz ? placement.row : placement.row + i;
      const c = isHoriz ? placement.col + i : placement.col;
      const char = placement.word[i];

      const current = grid[r][c] || { char };
      current.char = char;

      if (isHoriz) {
        current.horizontalWordId = placement.id;
      } else {
        current.verticalWordId = placement.id;
      }

      grid[r][c] = current;
    }
  }

  private removePlacement(grid: (Cell | null)[][], placement: WordPlacement): void {
    const isHoriz = placement.direction === 'horizontal';

    for (let i = 0; i < placement.length; i++) {
      const r = isHoriz ? placement.row : placement.row + i;
      const c = isHoriz ? placement.col + i : placement.col;
      const cell = grid[r][c];

      if (!cell) continue;

      if (isHoriz) {
        delete cell.horizontalWordId;
      } else {
        delete cell.verticalWordId;
      }

      if (!cell.horizontalWordId && !cell.verticalWordId) {
        grid[r][c] = null;
      }
    }
  }

  private formatPuzzleGrid(placements: WordPlacement[]): PuzzleGrid {
    if (placements.length === 0) {
      return { bounds: { rows: 0, cols: 0 }, placedWords: [] };
    }

    let minRow = Infinity;
    let minCol = Infinity;
    let maxRow = -Infinity;
    let maxCol = -Infinity;

    for (const p of placements) {
      const endRow = p.direction === 'horizontal' ? p.row : p.row + p.length - 1;
      const endCol = p.direction === 'horizontal' ? p.col + p.length - 1 : p.col;

      minRow = Math.min(minRow, p.row);
      minCol = Math.min(minCol, p.col);
      maxRow = Math.max(maxRow, endRow);
      maxCol = Math.max(maxCol, endCol);
    }

    const shiftedPlacements = placements.map((p) => ({
      ...p,
      row: p.row - minRow,
      col: p.col - minCol,
    }));

    return {
      bounds: {
        rows: maxRow - minRow + 1,
        cols: maxCol - minCol + 1,
      },
      placedWords: shiftedPlacements,
    };
  }
}
