import { describe, it, expect } from 'vitest';
import { CrosswordEngine } from '../src/domain/CrosswordEngine';
import { WordNode } from 'shared-types';

describe('CrosswordEngine (Backtracking)', () => {
  const engine = new CrosswordEngine(25);

  it('deve gerar um grid vazio se nenhuma palavra for fornecida', () => {
    const result = engine.generate([]);
    expect(result.placedWords).toHaveLength(0);
    expect(result.bounds.rows).toBe(0);
    expect(result.bounds.cols).toBe(0);
  });

  it('deve posicionar a primeira palavra no grid', () => {
    const words: WordNode[] = [
      { word: 'REACT', clue: 'Biblioteca UI' }
    ];
    const result = engine.generate(words);
    expect(result.placedWords).toHaveLength(1);
    expect(result.placedWords[0].word).toBe('REACT');
    expect(result.bounds.cols).toBeGreaterThanOrEqual(5);
  });

  it('deve cruzar palavras corretamente usando backtracking', () => {
    const words: WordNode[] = [
      { word: 'TYPESCRIPT', clue: 'Linguagem tipada' },
      { word: 'PYTHON', clue: 'Linguagem dinâmica' },
      { word: 'RUST', clue: 'Linguagem com borrow checker' },
      { word: 'NODE', clue: 'Runtime JS' },
    ];

    const result = engine.generate(words);

    expect(result.placedWords.length).toBeGreaterThanOrEqual(2);

    // Verificar se todas as palavras colocadas estão dentro dos limites
    for (const p of result.placedWords) {
      expect(p.row).toBeGreaterThanOrEqual(0);
      expect(p.col).toBeGreaterThanOrEqual(0);
      if (p.direction === 'horizontal') {
        expect(p.col + p.length).toBeLessThanOrEqual(result.bounds.cols);
      } else {
        expect(p.row + p.length).toBeLessThanOrEqual(result.bounds.rows);
      }
    }

    // Verificar se cruzamentos compartilham exatamente o mesmo caractere
    const cellMap = new Map<string, string>();
    for (const p of result.placedWords) {
      for (let i = 0; i < p.length; i++) {
        const r = p.direction === 'horizontal' ? p.row : p.row + i;
        const c = p.direction === 'horizontal' ? p.col + i : p.col;
        const key = `${r},${c}`;
        const char = p.word[i];

        if (cellMap.has(key)) {
          // Interseção: deve ter a mesma letra!
          expect(cellMap.get(key)).toBe(char);
        } else {
          cellMap.set(key, char);
        }
      }
    }
  });
});
