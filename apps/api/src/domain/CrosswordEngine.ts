import { Direction, PuzzleGrid, WordNode, WordPlacement } from 'shared-types';
import { ICrosswordEngine } from './interfaces';

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

    // 1. Filtrar e normalizar palavras válidas (mínimo 2 letras, sem espaços/caracteres especiais)
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

    // 2. Ordenar palavras por tamanho descrescente (palavras maiores ancoram melhor o grid)
    normalizedWords.sort((a, b) => b.word.length - a.word.length);

    // 3. Executar o Backtracking para encontrar a melhor combinação de posicionamentos
    const bestPlacements = this.solveWithBacktracking(normalizedWords, gridSize);

    // 4. Normalizar coordenadas para que o grid comece em (0, 0)
    return this.formatPuzzleGrid(bestPlacements);
  }

  private normalizeText(text: string): string {
    return text
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos para consistência no grid
      .replace(/[^A-Z]/g, '');
  }

  private solveWithBacktracking(
    words: { id: string; word: string; clue: string }[],
    gridSize: number
  ): WordPlacement[] {
    let bestResult: WordPlacement[] = [];

    // Matriz de caracteres do grid (gridSize x gridSize)
    const grid: (Cell | null)[][] = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(null)
    );

    const placed: WordPlacement[] = [];

    // Posiciona a primeira palavra no centro horizontalmente
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

    // Função recursiva de backtracking com branch pruning
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

      // Ordena candidatos por maior número de cruzamentos (interseções compactas)
      candidates.sort((a, b) => b.intersections - a.intersections);

      // Branch pruning: limita a 3 candidatos por nível para execução em tempo real
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

        // Aplica no grid
        this.applyPlacement(grid, placement);
        placed.push(placement);
        placedAny = true;

        if (placed.length > bestResult.length) {
          bestResult = [...placed];
        }

        // Tenta próxima palavra
        backtrack(wordIndex + 1);

        // Reverte (Backtrack)
        placed.pop();
        this.removePlacement(grid, placement, placed);
      }

      // Se não conseguiu posicionar a palavra atual com cruzamento,
      // tenta continuar para as próximas palavras (maximizando aproveitamento)
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

    // Itera por todas as células já preenchidas procurando letras em comum
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = grid[r][c];
        if (!cell) continue;

        // Para cada letra da palavra candidata
        for (let i = 0; i < word.length; i++) {
          if (word[i] === cell.char) {
            // Tentar colocar na vertical cruzando uma célula
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

            // Tentar colocar na horizontal cruzando uma célula
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

    // 1. Limites do grid
    if (row < 0 || col < 0 || endRow >= gridSize || endCol >= gridSize) {
      return false;
    }

    // 2. Célula imediatamente anterior e posterior devem estar livres (não colar palavras)
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

    // 3. Validação de cada letra
    for (let i = 0; i < word.length; i++) {
      const r = isHoriz ? row : row + i;
      const c = isHoriz ? col + i : col;
      const existing = grid[r][c];

      if (existing) {
        // Se já existe uma letra, deve ser idêntica
        if (existing.char !== word[i]) {
          return false;
        }
        // Não sobrepor palavras na mesma direção
        if (isHoriz && existing.horizontalWordId) {
          return false;
        }
        if (!isHoriz && existing.verticalWordId) {
          return false;
        }
        hasIntersection = true;
      } else {
        // Se a célula está vazia, os vizinhos paralelos devem estar vazios para evitar letras adjacentes sem sentido
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

    // A palavra deve cruzar com pelo menos uma palavra já colocada
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

  private removePlacement(
    grid: (Cell | null)[][],
    placement: WordPlacement,
    _remainingPlacedWords: WordPlacement[]
  ): void {
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

      // Se a célula não pertence a nenhuma outra palavra ativa, remove completamente
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

    // Deslocar para começar no índice (0, 0) com padding estético de 0
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
